import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const [precos] = await pool.execute(
      `SELECT mp.*, m.nome as material_nome, m.descricao as material_descricao 
       FROM material_precos mp 
       INNER JOIN materiais m ON mp.material_id = m.id 
       ORDER BY m.nome ASC, mp.tipo_calculo ASC`
    );
    res.json(precos);
  } catch (error) {
    console.error('Erro ao buscar preços de materiais:', error);
    res.status(500).json({ error: 'Erro ao buscar preços de materiais' });
  }
};

export const getByMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const [precos] = await pool.execute(
      `SELECT mp.*, m.nome as material_nome 
       FROM material_precos mp 
       INNER JOIN materiais m ON mp.material_id = m.id 
       WHERE mp.material_id = ? AND mp.ativo = TRUE`,
      [materialId]
    );
    res.json(precos);
  } catch (error) {
    console.error('Erro ao buscar preço do material:', error);
    res.status(500).json({ error: 'Erro ao buscar preço do material' });
  }
};

export const create = async (req, res) => {
  try {
    const { material_id, tipo_calculo, valor_por_cm2, ativo } = req.body;

    if (!material_id || !valor_por_cm2) {
      return res.status(400).json({ error: 'Material e valor por cm² são obrigatórios' });
    }

    if (valor_por_cm2 <= 0) {
      return res.status(400).json({ error: 'Valor por cm² deve ser maior que zero' });
    }

    // Verificar se já existe configuração para este material e tipo
    const [existing] = await pool.execute(
      'SELECT id FROM material_precos WHERE material_id = ? AND tipo_calculo = ?',
      [material_id, tipo_calculo || 'impressao_cm2']
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Já existe configuração de preço para este material e tipo de cálculo' });
    }

    const [result] = await pool.execute(
      'INSERT INTO material_precos (material_id, tipo_calculo, valor_por_cm2, ativo) VALUES (?, ?, ?, ?)',
      [material_id, tipo_calculo || 'impressao_cm2', valor_por_cm2, ativo !== undefined ? ativo : true]
    );

    const [preco] = await pool.execute(
      `SELECT mp.*, m.nome as material_nome 
       FROM material_precos mp 
       INNER JOIN materiais m ON mp.material_id = m.id 
       WHERE mp.id = ?`,
      [result.insertId]
    );

    res.status(201).json(preco[0]);
  } catch (error) {
    console.error('Erro ao criar preço de material:', error);
    res.status(500).json({ error: 'Erro ao criar preço de material' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { valor_por_cm2, ativo } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM material_precos WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Configuração de preço não encontrada' });
    }

    if (valor_por_cm2 !== undefined && valor_por_cm2 <= 0) {
      return res.status(400).json({ error: 'Valor por cm² deve ser maior que zero' });
    }

    const updateFields = [];
    const updateValues = [];

    if (valor_por_cm2 !== undefined) {
      updateFields.push('valor_por_cm2 = ?');
      updateValues.push(valor_por_cm2);
    }

    if (ativo !== undefined) {
      updateFields.push('ativo = ?');
      updateValues.push(ativo);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE material_precos SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [preco] = await pool.execute(
      `SELECT mp.*, m.nome as material_nome 
       FROM material_precos mp 
       INNER JOIN materiais m ON mp.material_id = m.id 
       WHERE mp.id = ?`,
      [id]
    );

    res.json(preco[0]);
  } catch (error) {
    console.error('Erro ao atualizar preço de material:', error);
    res.status(500).json({ error: 'Erro ao atualizar preço de material' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM material_precos WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Configuração de preço não encontrada' });
    }

    await pool.execute('DELETE FROM material_precos WHERE id = ?', [id]);

    res.json({ message: 'Configuração de preço excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir preço de material:', error);
    res.status(500).json({ error: 'Erro ao excluir preço de material' });
  }
};
