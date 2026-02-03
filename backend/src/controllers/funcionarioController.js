import pool from '../config/database.js';

export const getFuncionarios = async (req, res) => {
  try {
    const [funcionarios] = await pool.execute(
      'SELECT * FROM funcionarios ORDER BY nome ASC'
    );
    res.json(funcionarios);
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    res.status(500).json({ error: 'Erro ao buscar funcionários' });
  }
};

export const createFuncionario = async (req, res) => {
  try {
    const { nome, email, telefone, cargo } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome do funcionário é obrigatório' });
    }

    const [result] = await pool.execute(
      'INSERT INTO funcionarios (nome, email, telefone, cargo) VALUES (?, ?, ?, ?)',
      [nome, email || null, telefone || null, cargo || null]
    );

    const [funcionario] = await pool.execute(
      'SELECT * FROM funcionarios WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(funcionario[0]);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ error: 'Erro ao criar funcionário' });
  }
};

export const updateFuncionario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, cargo, ativo } = req.body;

    const [funcionarios] = await pool.execute(
      'SELECT * FROM funcionarios WHERE id = ?',
      [id]
    );

    if (funcionarios.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    await pool.execute(
      'UPDATE funcionarios SET nome = ?, email = ?, telefone = ?, cargo = ?, ativo = ? WHERE id = ?',
      [nome, email || null, telefone || null, cargo || null, ativo !== undefined ? ativo : funcionarios[0].ativo, id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM funcionarios WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }
};

export const deleteFuncionario = async (req, res) => {
  try {
    const { id } = req.params;

    const [funcionarios] = await pool.execute(
      'SELECT * FROM funcionarios WHERE id = ?',
      [id]
    );

    if (funcionarios.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    await pool.execute('DELETE FROM funcionarios WHERE id = ?', [id]);

    res.json({ message: 'Funcionário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error);
    res.status(500).json({ error: 'Erro ao excluir funcionário' });
  }
};
