import pool from '../config/database.js';

export const getMateriais = async (req, res) => {
  try {
    const [materiais] = await pool.execute(
      `SELECT m.*, 
       c.nome as categoria_nome,
       f.nome as fornecedor_nome,
       um.nome as unidade_nome,
       um.simbolo as unidade_simbolo
       FROM materiais m
       LEFT JOIN categorias_material c ON m.categoria_id = c.id
       LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
       LEFT JOIN unidades_medida um ON m.unidade_medida_id = um.id
       ORDER BY m.nome ASC`
    );
    res.json(materiais);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro ao buscar materiais' });
  }
};

export const createMaterial = async (req, res) => {
  try {
    const { 
      nome, descricao, tipo, categoria_id, fornecedor_id, unidade_medida_id,
      quantidade_estoque, estoque_minimo, estoque_maximo, ponto_reposicao,
      valor_unitario, localizacao, codigo_barras, codigo_interno, unidade, ativo, observacoes, imagem_url
    } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome do material é obrigatório' });
    }

    const [result] = await pool.execute(
      `INSERT INTO materiais (
        nome, descricao, tipo, categoria_id, fornecedor_id, unidade_medida_id,
        quantidade_estoque, estoque_minimo, estoque_maximo, ponto_reposicao,
        valor_unitario, localizacao, codigo_barras, codigo_interno, unidade, ativo, observacoes, imagem_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome, descricao || null, tipo || 'material', categoria_id || null, fornecedor_id || null, unidade_medida_id || null,
        quantidade_estoque || 0, estoque_minimo || 0, estoque_maximo || 0, ponto_reposicao || 0,
        valor_unitario || 0, localizacao || null, codigo_barras || null, codigo_interno || null, unidade || null, ativo !== undefined ? ativo : true, observacoes || null, imagem_url || null
      ]
    );

    const [material] = await pool.execute(
      `SELECT m.*, 
       c.nome as categoria_nome,
       f.nome as fornecedor_nome,
       um.nome as unidade_nome,
       um.simbolo as unidade_simbolo
       FROM materiais m
       LEFT JOIN categorias_material c ON m.categoria_id = c.id
       LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
       LEFT JOIN unidades_medida um ON m.unidade_medida_id = um.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json(material[0]);
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ error: 'Erro ao criar material' });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nome, descricao, tipo, categoria_id, fornecedor_id, unidade_medida_id,
      quantidade_estoque, estoque_minimo, estoque_maximo, ponto_reposicao,
      valor_unitario, localizacao, codigo_barras, codigo_interno, unidade, ativo, observacoes, imagem_url
    } = req.body;

    // Validar nome
    if (nome !== undefined && (!nome || !nome.trim())) {
      return res.status(400).json({ error: 'Nome do material é obrigatório' });
    }

    const [materiais] = await pool.execute(
      'SELECT * FROM materiais WHERE id = ?',
      [id]
    );

    if (materiais.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }

    const material = materiais[0];

    // Função helper para tratar valores vazios como null
    const treatEmpty = (value, defaultValue) => {
      if (value === undefined) return defaultValue;
      if (value === '' || value === null) return null;
      return value;
    };

    await pool.execute(
      `UPDATE materiais SET 
        nome = ?, descricao = ?, tipo = ?, categoria_id = ?, fornecedor_id = ?, unidade_medida_id = ?,
        quantidade_estoque = ?, estoque_minimo = ?, estoque_maximo = ?, ponto_reposicao = ?,
        valor_unitario = ?, localizacao = ?, codigo_barras = ?, codigo_interno = ?, unidade = ?, ativo = ?, observacoes = ?, imagem_url = ?
        WHERE id = ?`,
      [
        nome !== undefined ? nome : material.nome,
        treatEmpty(descricao, material.descricao),
        tipo !== undefined ? tipo : material.tipo,
        categoria_id !== undefined ? (categoria_id === '' ? null : categoria_id) : material.categoria_id,
        fornecedor_id !== undefined ? (fornecedor_id === '' ? null : fornecedor_id) : material.fornecedor_id,
        unidade_medida_id !== undefined ? (unidade_medida_id === '' ? null : unidade_medida_id) : material.unidade_medida_id,
        quantidade_estoque !== undefined ? (parseFloat(quantidade_estoque) || 0) : material.quantidade_estoque,
        estoque_minimo !== undefined ? (parseFloat(estoque_minimo) || 0) : material.estoque_minimo,
        estoque_maximo !== undefined ? (parseFloat(estoque_maximo) || 0) : material.estoque_maximo,
        ponto_reposicao !== undefined ? (parseFloat(ponto_reposicao) || 0) : material.ponto_reposicao,
        valor_unitario !== undefined ? (parseFloat(valor_unitario) || 0) : material.valor_unitario,
        treatEmpty(localizacao, material.localizacao),
        treatEmpty(codigo_barras, material.codigo_barras),
        treatEmpty(codigo_interno, material.codigo_interno),
        treatEmpty(unidade, material.unidade),
        ativo !== undefined ? (ativo === true || ativo === 1 || ativo === '1') : material.ativo,
        treatEmpty(observacoes, material.observacoes),
        treatEmpty(imagem_url, material.imagem_url),
        id
      ]
    );

    const [updated] = await pool.execute(
      `SELECT m.*, 
       c.nome as categoria_nome,
       f.nome as fornecedor_nome,
       um.nome as unidade_nome,
       um.simbolo as unidade_simbolo
       FROM materiais m
       LEFT JOIN categorias_material c ON m.categoria_id = c.id
       LEFT JOIN fornecedores f ON m.fornecedor_id = f.id
       LEFT JOIN unidades_medida um ON m.unidade_medida_id = um.id
       WHERE m.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    console.error('Stack trace:', error.stack);
    console.error('Dados recebidos:', req.body);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Erro ao atualizar material: ${error.message}${error.sqlMessage ? ` (SQL: ${error.sqlMessage})` : ''}` 
      : 'Erro ao atualizar material';
    res.status(500).json({ error: errorMessage });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const [materiais] = await pool.execute(
      'SELECT * FROM materiais WHERE id = ?',
      [id]
    );

    if (materiais.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }

    await pool.execute('DELETE FROM materiais WHERE id = ?', [id]);

    res.json({ message: 'Material excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({ error: 'Erro ao excluir material' });
  }
};
