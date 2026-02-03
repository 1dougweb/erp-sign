import pool from '../config/database.js';

export const getTarefas = async (req, res) => {
  try {
    const { projetoId } = req.params;

    const [tarefas] = await pool.execute(
      'SELECT * FROM tarefas WHERE projeto_id = ? ORDER BY ordem ASC, created_at ASC',
      [projetoId]
    );
    res.json(tarefas);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
};

export const createTarefa = async (req, res) => {
  try {
    const { projetoId } = req.params;
    const { titulo, descricao } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'Título da tarefa é obrigatório' });
    }

    // Verificar se o projeto existe e pertence ao usuário
    const [projetos] = await pool.execute(
      'SELECT id FROM projetos WHERE id = ? AND user_id = ?',
      [projetoId, req.user.id]
    );

    if (projetos.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Pegar a maior ordem atual
    const [maxOrder] = await pool.execute(
      'SELECT MAX(ordem) as max_ordem FROM tarefas WHERE projeto_id = ?',
      [projetoId]
    );

    const ordem = (maxOrder[0]?.max_ordem || 0) + 1;

    const [result] = await pool.execute(
      'INSERT INTO tarefas (projeto_id, titulo, descricao, ordem) VALUES (?, ?, ?, ?)',
      [projetoId, titulo, descricao || null, ordem]
    );

    const [tarefa] = await pool.execute(
      'SELECT * FROM tarefas WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(tarefa[0]);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
};

export const updateTarefa = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao } = req.body;

    // Verificar se a tarefa pertence a um projeto do usuário
    const [tarefas] = await pool.execute(
      `SELECT t.* FROM tarefas t 
       INNER JOIN projetos p ON t.projeto_id = p.id 
       WHERE t.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );

    if (tarefas.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    await pool.execute(
      'UPDATE tarefas SET titulo = ?, descricao = ? WHERE id = ?',
      [titulo, descricao || null, id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM tarefas WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
};

export const deleteTarefa = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a tarefa pertence a um projeto do usuário
    const [tarefas] = await pool.execute(
      `SELECT t.* FROM tarefas t 
       INNER JOIN projetos p ON t.projeto_id = p.id 
       WHERE t.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );

    if (tarefas.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    await pool.execute('DELETE FROM tarefas WHERE id = ?', [id]);

    res.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
};

export const reordenarTarefas = async (req, res) => {
  try {
    const { tarefas } = req.body; // Array de { id, ordem }

    if (!Array.isArray(tarefas)) {
      return res.status(400).json({ error: 'Array de tarefas é obrigatório' });
    }

    // Verificar se todas as tarefas pertencem a projetos do usuário
    const tarefaIds = tarefas.map(t => t.id);
    const placeholders = tarefaIds.map(() => '?').join(',');

    const [existingTarefas] = await pool.execute(
      `SELECT t.id FROM tarefas t 
       INNER JOIN projetos p ON t.projeto_id = p.id 
       WHERE t.id IN (${placeholders}) AND p.user_id = ?`,
      [...tarefaIds, req.user.id]
    );

    if (existingTarefas.length !== tarefas.length) {
      return res.status(400).json({ error: 'Algumas tarefas não foram encontradas' });
    }

    // Atualizar ordem de cada tarefa
    for (const tarefa of tarefas) {
      await pool.execute(
        'UPDATE tarefas SET ordem = ? WHERE id = ?',
        [tarefa.ordem, tarefa.id]
      );
    }

    res.json({ message: 'Tarefas reordenadas com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar tarefas:', error);
    res.status(500).json({ error: 'Erro ao reordenar tarefas' });
  }
};
