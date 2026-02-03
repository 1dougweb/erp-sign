import pool from '../config/database.js';
// WebSocket removido

export const getCronogramaTodos = async (req, res) => {
  try {
    const { id } = req.params;

    const [todos] = await pool.execute(
      'SELECT * FROM cronograma_todos WHERE cronograma_id = ? ORDER BY ordem ASC, created_at ASC',
      [id]
    );

    res.json(todos);
  } catch (error) {
    console.error('Erro ao buscar todos do cronograma:', error);
    res.status(500).json({ error: 'Erro ao buscar todos do cronograma' });
  }
};

export const createCronogramaTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, ordem } = req.body;

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    // Se não fornecida a ordem, buscar a maior ordem e incrementar
    let ordemValue = ordem;
    if (ordemValue === undefined || ordemValue === null) {
      const [maxOrdem] = await pool.execute(
        'SELECT COALESCE(MAX(ordem), 0) as max_ordem FROM cronograma_todos WHERE cronograma_id = ?',
        [id]
      );
      ordemValue = (maxOrdem[0]?.max_ordem || 0) + 1;
    }

    const [result] = await pool.execute(
      'INSERT INTO cronograma_todos (cronograma_id, descricao, ordem, concluido) VALUES (?, ?, ?, FALSE)',
      [id, descricao.trim(), ordemValue]
    );

    const [newTodo] = await pool.execute(
      'SELECT * FROM cronograma_todos WHERE id = ?',
      [result.insertId]
    );

    // WebSocket removido

    res.status(201).json(newTodo[0]);
  } catch (error) {
    console.error('Erro ao criar todo do cronograma:', error);
    res.status(500).json({ error: 'Erro ao criar todo do cronograma' });
  }
};

export const updateCronogramaTodo = async (req, res) => {
  try {
    const { id, todoId } = req.params;
    const { descricao, concluido, ordem } = req.body;

    const [todos] = await pool.execute(
      'SELECT * FROM cronograma_todos WHERE id = ? AND cronograma_id = ?',
      [todoId, id]
    );

    if (todos.length === 0) {
      return res.status(404).json({ error: 'Todo não encontrado' });
    }

    const updateFields = [];
    const updateValues = [];

    if (descricao !== undefined) {
      updateFields.push('descricao = ?');
      updateValues.push(descricao.trim());
    }

    if (concluido !== undefined) {
      updateFields.push('concluido = ?');
      updateValues.push(concluido ? 1 : 0);
    }

    if (ordem !== undefined) {
      updateFields.push('ordem = ?');
      updateValues.push(ordem);
    }

    if (updateFields.length === 0) {
      return res.json(todos[0]);
    }

    updateValues.push(todoId, id);

    await pool.execute(
      `UPDATE cronograma_todos SET ${updateFields.join(', ')} WHERE id = ? AND cronograma_id = ?`,
      updateValues
    );

    const [updated] = await pool.execute(
      'SELECT * FROM cronograma_todos WHERE id = ? AND cronograma_id = ?',
      [todoId, id]
    );

    // WebSocket removido

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar todo do cronograma:', error);
    res.status(500).json({ error: 'Erro ao atualizar todo do cronograma' });
  }
};

export const deleteCronogramaTodo = async (req, res) => {
  try {
    const { id, todoId } = req.params;

    const [todos] = await pool.execute(
      'SELECT * FROM cronograma_todos WHERE id = ? AND cronograma_id = ?',
      [todoId, id]
    );

    if (todos.length === 0) {
      return res.status(404).json({ error: 'Todo não encontrado' });
    }

    await pool.execute(
      'DELETE FROM cronograma_todos WHERE id = ? AND cronograma_id = ?',
      [todoId, id]
    );

    // WebSocket removido

    res.json({ message: 'Todo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir todo do cronograma:', error);
    res.status(500).json({ error: 'Erro ao excluir todo do cronograma' });
  }
};

export const reorderCronogramaTodos = async (req, res) => {
  try {
    const { id } = req.params;
    const { todos } = req.body; // Array de { id, ordem }

    if (!Array.isArray(todos)) {
      return res.status(400).json({ error: 'Array de todos é obrigatório' });
    }

    // Atualizar ordem de cada todo
    for (const todo of todos) {
      await pool.execute(
        'UPDATE cronograma_todos SET ordem = ? WHERE id = ? AND cronograma_id = ?',
        [todo.ordem, todo.id, id]
      );
    }

    // Retornar todos atualizados
    const [updatedTodos] = await pool.execute(
      'SELECT * FROM cronograma_todos WHERE cronograma_id = ? ORDER BY ordem ASC',
      [id]
    );

    // WebSocket removido

    res.json(updatedTodos);
  } catch (error) {
    console.error('Erro ao reordenar todos do cronograma:', error);
    res.status(500).json({ error: 'Erro ao reordenar todos do cronograma' });
  }
};
