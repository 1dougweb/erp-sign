import pool from '../config/database.js';

export const getEquipes = async (req, res) => {
  try {
    const [equipes] = await pool.execute(
      `SELECT e.*, ti.nome as tipo_instalacao_nome 
       FROM equipes e 
       LEFT JOIN tipos_instalacao ti ON e.tipo_instalacao_id = ti.id 
       ORDER BY e.nome ASC`
    );

    // Buscar funcionários de cada equipe
    for (const equipe of equipes) {
      const [funcionarios] = await pool.execute(
        `SELECT f.* FROM funcionarios f 
         INNER JOIN equipe_funcionarios ef ON f.id = ef.funcionario_id 
         WHERE ef.equipe_id = ?`,
        [equipe.id]
      );
      equipe.funcionarios = funcionarios;
    }

    res.json(equipes);
  } catch (error) {
    console.error('Erro ao buscar equipes:', error);
    res.status(500).json({ error: 'Erro ao buscar equipes' });
  }
};

export const createEquipe = async (req, res) => {
  try {
    const { nome, tipo_instalacao_id, descricao, funcionarios } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome da equipe é obrigatório' });
    }

    const [result] = await pool.execute(
      'INSERT INTO equipes (nome, tipo_instalacao_id, descricao) VALUES (?, ?, ?)',
      [nome, tipo_instalacao_id || null, descricao || null]
    );

    const equipeId = result.insertId;

    // Adicionar funcionários à equipe
    if (Array.isArray(funcionarios) && funcionarios.length > 0) {
      for (const funcionarioId of funcionarios) {
        await pool.execute(
          'INSERT INTO equipe_funcionarios (equipe_id, funcionario_id) VALUES (?, ?)',
          [equipeId, funcionarioId]
        );
      }
    }

    const [equipe] = await pool.execute(
      `SELECT e.*, ti.nome as tipo_instalacao_nome 
       FROM equipes e 
       LEFT JOIN tipos_instalacao ti ON e.tipo_instalacao_id = ti.id 
       WHERE e.id = ?`,
      [equipeId]
    );

    const [funcionariosList] = await pool.execute(
      `SELECT f.* FROM funcionarios f 
       INNER JOIN equipe_funcionarios ef ON f.id = ef.funcionario_id 
       WHERE ef.equipe_id = ?`,
      [equipeId]
    );

    equipe[0].funcionarios = funcionariosList;

    res.status(201).json(equipe[0]);
  } catch (error) {
    console.error('Erro ao criar equipe:', error);
    res.status(500).json({ error: 'Erro ao criar equipe' });
  }
};

export const updateEquipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo_instalacao_id, descricao, ativa } = req.body;

    const [equipes] = await pool.execute(
      'SELECT * FROM equipes WHERE id = ?',
      [id]
    );

    if (equipes.length === 0) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    await pool.execute(
      'UPDATE equipes SET nome = ?, tipo_instalacao_id = ?, descricao = ?, ativa = ? WHERE id = ?',
      [nome, tipo_instalacao_id || null, descricao || null, ativa !== undefined ? ativa : equipes[0].ativa, id]
    );

    const [updated] = await pool.execute(
      `SELECT e.*, ti.nome as tipo_instalacao_nome 
       FROM equipes e 
       LEFT JOIN tipos_instalacao ti ON e.tipo_instalacao_id = ti.id 
       WHERE e.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar equipe:', error);
    res.status(500).json({ error: 'Erro ao atualizar equipe' });
  }
};

export const deleteEquipe = async (req, res) => {
  try {
    const { id } = req.params;

    const [equipes] = await pool.execute(
      'SELECT * FROM equipes WHERE id = ?',
      [id]
    );

    if (equipes.length === 0) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    await pool.execute('DELETE FROM equipes WHERE id = ?', [id]);

    res.json({ message: 'Equipe excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir equipe:', error);
    res.status(500).json({ error: 'Erro ao excluir equipe' });
  }
};

export const addFuncionarioToEquipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { funcionario_id } = req.body;

    if (!funcionario_id) {
      return res.status(400).json({ error: 'ID do funcionário é obrigatório' });
    }

    // Verificar se já existe
    const [existing] = await pool.execute(
      'SELECT * FROM equipe_funcionarios WHERE equipe_id = ? AND funcionario_id = ?',
      [id, funcionario_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Funcionário já está na equipe' });
    }

    await pool.execute(
      'INSERT INTO equipe_funcionarios (equipe_id, funcionario_id) VALUES (?, ?)',
      [id, funcionario_id]
    );

    res.json({ message: 'Funcionário adicionado à equipe com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar funcionário:', error);
    res.status(500).json({ error: 'Erro ao adicionar funcionário' });
  }
};

export const removeFuncionarioFromEquipe = async (req, res) => {
  try {
    const { id, funcionarioId } = req.params;

    await pool.execute(
      'DELETE FROM equipe_funcionarios WHERE equipe_id = ? AND funcionario_id = ?',
      [id, funcionarioId]
    );

    res.json({ message: 'Funcionário removido da equipe com sucesso' });
  } catch (error) {
    console.error('Erro ao remover funcionário:', error);
    res.status(500).json({ error: 'Erro ao remover funcionário' });
  }
};
