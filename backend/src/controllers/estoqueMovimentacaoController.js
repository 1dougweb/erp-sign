import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const { material_id, tipo, data_inicio, data_fim } = req.query;
    
    let query = `
      SELECT em.*,
       m.nome as material_nome,
       um.simbolo as unidade_simbolo,
       f.nome as fornecedor_nome,
       el_origem.nome as origem_nome,
       el_destino.nome as destino_nome,
       u.nome as usuario_nome
       FROM estoque_movimentacoes em
       INNER JOIN materiais m ON em.material_id = m.id
       LEFT JOIN unidades_medida um ON em.unidade_id = um.id
       LEFT JOIN fornecedores f ON em.fornecedor_id = f.id
       LEFT JOIN estoque_locais el_origem ON em.origem_id = el_origem.id
       LEFT JOIN estoque_locais el_destino ON em.destino_id = el_destino.id
       LEFT JOIN users u ON em.usuario_id = u.id
       WHERE 1=1
    `;
    
    const params = [];
    
    if (material_id) {
      query += ' AND em.material_id = ?';
      params.push(material_id);
    }
    
    if (tipo) {
      query += ' AND em.tipo = ?';
      params.push(tipo);
    }
    
    if (data_inicio) {
      query += ' AND DATE(em.data_movimentacao) >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ' AND DATE(em.data_movimentacao) <= ?';
      params.push(data_fim);
    }
    
    query += ' ORDER BY em.data_movimentacao DESC LIMIT 1000';
    
    const [movimentacoes] = await pool.execute(query, params);
    res.json(movimentacoes);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
};

export const create = async (req, res) => {
  try {
    const {
      material_id, tipo, quantidade, unidade_id, valor_unitario,
      fornecedor_id, origem_id, destino_id, observacoes, documento_referencia
    } = req.body;
    
    if (!material_id || !tipo || !quantidade) {
      return res.status(400).json({ error: 'Material, tipo e quantidade são obrigatórios' });
    }
    
    if (quantidade <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
    }
    
    const valorTotal = (parseFloat(valor_unitario) || 0) * parseFloat(quantidade);
    const userId = req.user.id;
    
    // Criar movimentação
    const [result] = await pool.execute(
      `INSERT INTO estoque_movimentacoes (
        material_id, tipo, quantidade, unidade_id, valor_unitario, valor_total,
        fornecedor_id, origem_id, destino_id, usuario_id, observacoes, documento_referencia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        material_id, tipo, quantidade, unidade_id || null, valor_unitario || 0, valorTotal,
        fornecedor_id || null, origem_id || null, destino_id || null, userId,
        observacoes || null, documento_referencia || null
      ]
    );
    
    // Atualizar estoque do material
    let operacao = '';
    if (tipo === 'entrada' || tipo === 'devolucao' || tipo === 'ajuste') {
      operacao = '+';
    } else if (tipo === 'saida' || tipo === 'perda' || tipo === 'quebra') {
      operacao = '-';
    }
    
    if (operacao) {
      await pool.execute(
        `UPDATE materiais SET quantidade_estoque = quantidade_estoque ${operacao} ? WHERE id = ?`,
        [quantidade, material_id]
      );
      
      // Atualizar valor total do estoque
      await pool.execute(
        `UPDATE materiais m
         SET m.valor_total_estoque = (
           SELECT COALESCE(SUM(em.valor_total), 0)
           FROM estoque_movimentacoes em
           WHERE em.material_id = m.id AND em.tipo IN ('entrada', 'devolucao', 'ajuste')
         ) - (
           SELECT COALESCE(SUM(em.valor_total), 0)
           FROM estoque_movimentacoes em
           WHERE em.material_id = m.id AND em.tipo IN ('saida', 'perda', 'quebra')
         )
         WHERE m.id = ?`,
        [material_id]
      );
    }
    
    // Verificar alertas
    await verificarAlertas(material_id);
    
    const [movimentacao] = await pool.execute(
      `SELECT em.*,
       m.nome as material_nome,
       um.simbolo as unidade_simbolo
       FROM estoque_movimentacoes em
       INNER JOIN materiais m ON em.material_id = m.id
       LEFT JOIN unidades_medida um ON em.unidade_id = um.id
       WHERE em.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(movimentacao[0]);
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    res.status(500).json({ error: 'Erro ao criar movimentação' });
  }
};

const verificarAlertas = async (materialId) => {
  try {
    const [material] = await pool.execute(
      'SELECT quantidade_estoque, estoque_minimo FROM materiais WHERE id = ?',
      [materialId]
    );
    
    if (material.length === 0) return;
    
    const { quantidade_estoque, estoque_minimo } = material[0];
    
    // Remover alertas antigos não resolvidos
    await pool.execute(
      'DELETE FROM estoque_alertas WHERE material_id = ? AND resolvido = FALSE',
      [materialId]
    );
    
    // Criar alerta de estoque zero
    if (quantidade_estoque <= 0) {
      await pool.execute(
        'INSERT INTO estoque_alertas (material_id, tipo_alerta, nivel) VALUES (?, ?, ?)',
        [materialId, 'estoque_zero', 'critico']
      );
    }
    // Criar alerta de estoque mínimo
    else if (quantidade_estoque <= estoque_minimo && estoque_minimo > 0) {
      await pool.execute(
        'INSERT INTO estoque_alertas (material_id, tipo_alerta, nivel) VALUES (?, ?, ?)',
        [materialId, 'estoque_minimo', 'aviso']
      );
    }
  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [movimentacoes] = await pool.execute(
      `SELECT em.*,
       m.nome as material_nome,
       um.simbolo as unidade_simbolo,
       f.nome as fornecedor_nome,
       u.nome as usuario_nome
       FROM estoque_movimentacoes em
       INNER JOIN materiais m ON em.material_id = m.id
       LEFT JOIN unidades_medida um ON em.unidade_id = um.id
       LEFT JOIN fornecedores f ON em.fornecedor_id = f.id
       LEFT JOIN users u ON em.usuario_id = u.id
       WHERE em.id = ?`,
      [id]
    );
    
    if (movimentacoes.length === 0) {
      return res.status(404).json({ error: 'Movimentação não encontrada' });
    }
    
    res.json(movimentacoes[0]);
  } catch (error) {
    console.error('Erro ao buscar movimentação:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentação' });
  }
};
