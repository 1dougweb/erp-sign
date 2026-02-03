import pool from '../config/database.js';

export const getEstoque = async (req, res) => {
  try {
    const { categoria_id, fornecedor_id, busca, estoque_baixo } = req.query;
    
    // Primeiro, verificar se as tabelas existem
    let tabelasExistem = false;
    try {
      await pool.execute('SELECT 1 FROM categorias_material LIMIT 1');
      await pool.execute('SELECT 1 FROM fornecedores LIMIT 1');
      await pool.execute('SELECT 1 FROM unidades_medida LIMIT 1');
      tabelasExistem = true;
    } catch (checkError) {
      // Tabelas não existem, usar query simples
      tabelasExistem = false;
    }
    
    let query;
    const params = [];
    
    if (tabelasExistem) {
      // Verificar se o campo ativo existe
      let campoAtivoExiste = false;
      try {
        await pool.execute('SELECT ativo FROM materiais LIMIT 1');
        campoAtivoExiste = true;
      } catch (e) {
        campoAtivoExiste = false;
      }
      
      // Query completa com JOINs
      const whereAtivo = campoAtivoExiste ? 'AND COALESCE(m.ativo, TRUE) = TRUE' : '';
      query = `
        SELECT m.*, 
         c.nome as categoria_nome,
         f.nome as fornecedor_nome,
         um.nome as unidade_nome,
         um.simbolo as unidade_simbolo,
         COALESCE(m.estoque_minimo, 0) as estoque_minimo,
         COALESCE(m.estoque_maximo, 0) as estoque_maximo,
         COALESCE(m.valor_unitario, 0) as valor_unitario,
         COALESCE(m.localizacao, '') as localizacao,
         CASE 
           WHEN COALESCE(m.quantidade_estoque, 0) <= COALESCE(m.estoque_minimo, 0) AND COALESCE(m.estoque_minimo, 0) > 0 THEN 'baixo'
           WHEN COALESCE(m.quantidade_estoque, 0) = 0 THEN 'zero'
           ELSE 'normal'
         END as status_estoque
         FROM materiais m
         LEFT JOIN categorias_material c ON m.categoria_id = c.id
         LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
         LEFT JOIN unidades_medida um ON m.unidade_medida_id = um.id
         WHERE m.tipo = ? ${whereAtivo}
      `;
      params.push('material');
    } else {
      // Query simples sem JOINs
      query = `
        SELECT m.*,
         NULL as categoria_nome,
         NULL as fornecedor_nome,
         NULL as unidade_nome,
         COALESCE(m.unidade, 'un') as unidade_simbolo,
         0 as estoque_minimo,
         0 as estoque_maximo,
         0 as valor_unitario,
         NULL as localizacao,
         CASE 
           WHEN COALESCE(m.quantidade_estoque, 0) = 0 THEN 'zero'
           ELSE 'normal'
         END as status_estoque
         FROM materiais m
         WHERE m.tipo = ?
      `;
      params.push('material');
    }
    
    if (categoria_id && tabelasExistem) {
      query += ' AND m.categoria_id = ?';
      params.push(categoria_id);
    }
    
    if (fornecedor_id && tabelasExistem) {
      query += ' AND m.fornecedor_id = ?';
      params.push(fornecedor_id);
    }
    
    if (busca) {
      query += ' AND (m.nome LIKE ? OR m.descricao LIKE ?)';
      const buscaTerm = `%${busca}%`;
      params.push(buscaTerm, buscaTerm);
    }
    
    if (estoque_baixo === 'true' && tabelasExistem) {
      query += ' AND COALESCE(m.quantidade_estoque, 0) <= COALESCE(m.estoque_minimo, 0)';
    }
    
    query += ' ORDER BY m.nome ASC';
    
    const [materiais] = await pool.execute(query, params);
    res.json(materiais);
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    console.error('Stack:', error.stack);
    // Tentar query simples como fallback
    try {
      const [materiais] = await pool.execute(
        'SELECT * FROM materiais WHERE tipo = ? ORDER BY nome ASC',
        ['material']
      );
      const materiaisCompletos = materiais.map(m => ({
        ...m,
        categoria_nome: null,
        fornecedor_nome: null,
        unidade_nome: null,
        unidade_simbolo: m.unidade || 'un',
        estoque_minimo: 0,
        estoque_maximo: 0,
        valor_unitario: 0,
        localizacao: null,
        status_estoque: (m.quantidade_estoque || 0) <= 0 ? 'zero' : 'normal'
      }));
      return res.json(materiaisCompletos);
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError);
    }
    res.status(500).json({ error: 'Erro ao buscar estoque', details: error.message, code: error.code });
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se as tabelas existem
    let tabelasExistem = false;
    try {
      await pool.execute('SELECT 1 FROM categorias_material LIMIT 1');
      await pool.execute('SELECT 1 FROM fornecedores LIMIT 1');
      await pool.execute('SELECT 1 FROM unidades_medida LIMIT 1');
      tabelasExistem = true;
    } catch (checkError) {
      tabelasExistem = false;
    }
    
    let query;
    if (tabelasExistem) {
      query = `
        SELECT m.*, 
         c.nome as categoria_nome,
         f.nome as fornecedor_nome,
         um.nome as unidade_nome,
         um.simbolo as unidade_simbolo
         FROM materiais m
         LEFT JOIN categorias_material c ON m.categoria_id = c.id
         LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
         LEFT JOIN unidades_medida um ON m.unidade_medida_id = um.id
         WHERE m.id = ?
      `;
    } else {
      query = `
        SELECT m.*,
         NULL as categoria_nome,
         NULL as fornecedor_nome,
         NULL as unidade_nome,
         COALESCE(m.unidade, 'un') as unidade_simbolo
         FROM materiais m
         WHERE m.id = ?
      `;
    }
    
    const [materiais] = await pool.execute(query, [id]);
    
    if (materiais.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }
    
    res.json(materiais[0]);
  } catch (error) {
    console.error('Erro ao buscar material:', error);
    res.status(500).json({ error: 'Erro ao buscar material', details: error.message });
  }
};

export const calcularEstoqueAtual = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Calcular estoque atual baseado nas movimentações
    const [movimentacoes] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN tipo IN ('entrada', 'devolucao', 'ajuste') THEN quantidade ELSE 0 END) as entradas,
        SUM(CASE WHEN tipo IN ('saida', 'perda', 'quebra') THEN quantidade ELSE 0 END) as saidas
       FROM estoque_movimentacoes
       WHERE material_id = ?`,
      [id]
    );
    
    const entradas = parseFloat(movimentacoes[0]?.entradas || 0);
    const saidas = parseFloat(movimentacoes[0]?.saidas || 0);
    const estoqueAtual = entradas - saidas;
    
    // Atualizar estoque no material
    await pool.execute(
      'UPDATE materiais SET quantidade_estoque = ? WHERE id = ?',
      [estoqueAtual, id]
    );
    
    res.json({ estoque_atual: estoqueAtual, entradas, saidas });
  } catch (error) {
    console.error('Erro ao calcular estoque:', error);
    res.status(500).json({ error: 'Erro ao calcular estoque' });
  }
};
