import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const [categorias] = await pool.execute(
      'SELECT * FROM categorias_material ORDER BY nome ASC'
    );
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    // Se a tabela não existe, retornar array vazio
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes('doesn\'t exist')) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [categorias] = await pool.execute(
      'SELECT * FROM categorias_material WHERE id = ?',
      [id]
    );

    if (categorias.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json(categorias[0]);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
};

export const create = async (req, res) => {
  try {
    const { nome, descricao, ativo } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const [result] = await pool.execute(
      'INSERT INTO categorias_material (nome, descricao, ativo) VALUES (?, ?, ?)',
      [nome, descricao || null, ativo !== undefined ? ativo : true]
    );

    const [categoria] = await pool.execute(
      'SELECT * FROM categorias_material WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(categoria[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM categorias_material WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await pool.execute(
      'UPDATE categorias_material SET nome = ?, descricao = ?, ativo = ? WHERE id = ?',
      [nome || existing[0].nome, descricao !== undefined ? descricao : existing[0].descricao, ativo !== undefined ? ativo : existing[0].ativo, id]
    );

    const [categoria] = await pool.execute(
      'SELECT * FROM categorias_material WHERE id = ?',
      [id]
    );

    res.json(categoria[0]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM categorias_material WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await pool.execute('DELETE FROM categorias_material WHERE id = ?', [id]);

    res.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
};
