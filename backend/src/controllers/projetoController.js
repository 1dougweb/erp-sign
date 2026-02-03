import pool from '../config/database.js';

export const getProjetos = async (req, res) => {
  try {
    const [projetos] = await pool.execute(
      'SELECT * FROM projetos WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(projetos);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  }
};

export const createProjeto = async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
    }

    const [result] = await pool.execute(
      'INSERT INTO projetos (nome, descricao, user_id) VALUES (?, ?, ?)',
      [nome, descricao || null, req.user.id]
    );

    const [projeto] = await pool.execute(
      'SELECT * FROM projetos WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(projeto[0]);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
};

export const updateProjeto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    const [projetos] = await pool.execute(
      'SELECT * FROM projetos WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    await pool.execute(
      'UPDATE projetos SET nome = ?, descricao = ? WHERE id = ? AND user_id = ?',
      [nome, descricao || null, id, req.user.id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM projetos WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
};

export const deleteProjeto = async (req, res) => {
  try {
    const { id } = req.params;

    const [projetos] = await pool.execute(
      'SELECT * FROM projetos WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    await pool.execute('DELETE FROM projetos WHERE id = ? AND user_id = ?', [id, req.user.id]);

    res.json({ message: 'Projeto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir projeto:', error);
    res.status(500).json({ error: 'Erro ao excluir projeto' });
  }
};
