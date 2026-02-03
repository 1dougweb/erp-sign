import pool from '../config/database.js';
// WebSocket removido

export const getTodos = async (req, res) => {
  try {
    const { tarefaId } = req.params;

    // Verificar se a tarefa pertence a um projeto do usuário
    const [tarefas] = await pool.execute(
      `SELECT t.* FROM tarefas t 
       INNER JOIN projetos p ON t.projeto_id = p.id 
       WHERE t.id = ? AND p.user_id = ?`,
      [tarefaId, req.user.id]
    );

    if (tarefas.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Buscar todos - tentar ordenar por ordem, se não existir usar created_at
    let todos;
    try {
      // Tentar ordenar por ordem primeiro
      [todos] = await pool.execute(
        'SELECT * FROM todos WHERE tarefa_id = ? ORDER BY ordem ASC, created_at ASC',
        [tarefaId]
      );
    } catch (error) {
      // Se coluna ordem não existir, ordenar apenas por created_at
      [todos] = await pool.execute(
        'SELECT * FROM todos WHERE tarefa_id = ? ORDER BY created_at ASC',
        [tarefaId]
      );
    }
    res.json(todos);
  } catch (error) {
    console.error('Erro ao buscar todos:', error);
    res.status(500).json({ error: 'Erro ao buscar todos' });
  }
};

export const createTodo = async (req, res) => {
  try {
    const { tarefaId } = req.params;
    const { descricao } = req.body;

    if (!descricao) {
      return res.status(400).json({ error: 'Descrição do todo é obrigatória' });
    }

    // Verificar se a tarefa pertence a um projeto do usuário
    const [tarefas] = await pool.execute(
      `SELECT t.* FROM tarefas t 
       INNER JOIN projetos p ON t.projeto_id = p.id 
       WHERE t.id = ? AND p.user_id = ?`,
      [tarefaId, req.user.id]
    );

    if (tarefas.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Tentar inserir com ordem, se a coluna existir
    let result;
    try {
      // Pegar a maior ordem atual para esta tarefa
      const [maxOrder] = await pool.execute(
        'SELECT COALESCE(MAX(ordem), 0) as max_ordem FROM todos WHERE tarefa_id = ?',
        [tarefaId]
      );
      const ordem = (maxOrder[0]?.max_ordem || 0) + 1;

      [result] = await pool.execute(
        'INSERT INTO todos (tarefa_id, descricao, ordem) VALUES (?, ?, ?)',
        [tarefaId, descricao, ordem]
      );
    } catch (error) {
      // Se falhar (coluna ordem não existe), inserir sem ordem
      [result] = await pool.execute(
        'INSERT INTO todos (tarefa_id, descricao) VALUES (?, ?)',
        [tarefaId, descricao]
      );
    }

    const [todo] = await pool.execute(
      'SELECT * FROM todos WHERE id = ?',
      [result.insertId]
    );

    // WebSocket removido

    res.status(201).json(todo[0]);
  } catch (error) {
    console.error('Erro ao criar todo:', error);
    res.status(500).json({ error: 'Erro ao criar todo' });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, concluido } = req.body;

    // Verificar se o todo pertence a uma tarefa de um projeto do usuário
    const [todos] = await pool.execute(
      `SELECT td.* FROM todos td 
       INNER JOIN tarefas t ON td.tarefa_id = t.id 
       INNER JOIN projetos p ON t.projeto_id = p.id 
       WHERE td.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );

    if (todos.length === 0) {
      return res.status(404).json({ error: 'Todo não encontrado' });
    }

    const updateFields = [];
    const updateValues = [];

    if (descricao !== undefined) {
      updateFields.push('descricao = ?');
      updateValues.push(descricao);
    }

    if (concluido !== undefined) {
      updateFields.push('concluido = ?');
      // Converter boolean para 0/1 para MySQL
      updateValues.push(concluido ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE todos SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await pool.execute(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );

    // WebSocket removido

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar todo:', error);
    res.status(500).json({ error: 'Erro ao atualizar todo' });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o todo pertence a uma tarefa de um projeto do usuário
    const [todos] = await pool.execute(
      `SELECT td.* FROM todos td 
       INNER JOIN tarefas t ON td.tarefa_id = t.id 
       INNER JOIN projetos p ON t.projeto_id = p.id 
       WHERE td.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );

    if (todos.length === 0) {
      return res.status(404).json({ error: 'Todo não encontrado' });
    }

    const tarefaId = todos[0].tarefa_id;

    await pool.execute('DELETE FROM todos WHERE id = ?', [id]);

    // WebSocket removido

    res.json({ message: 'Todo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir todo:', error);
    res.status(500).json({ error: 'Erro ao excluir todo' });
  }
};

export const reordenarTodos = async (req, res) => {
  try {
    const { tarefaId } = req.params;
    const { todos } = req.body; // Array de { id, ordem }

    if (!Array.isArray(todos)) {
      return res.status(400).json({ error: 'Array de todos é obrigatório' });
    }

    // Verificar se a tarefa pertence a um projeto do usuário
    const [tarefas] = await pool.execute(
      `SELECT t.* FROM tarefas t 
       INNER JOIN projetos p ON t.projeto_id = p.id 
       WHERE t.id = ? AND p.user_id = ?`,
      [tarefaId, req.user.id]
    );

    if (tarefas.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Verificar se todos os todos pertencem à tarefa
    const todoIds = todos.map(t => t.id);
    const placeholders = todoIds.map(() => '?').join(',');

    const [existingTodos] = await pool.execute(
      `SELECT id FROM todos WHERE id IN (${placeholders}) AND tarefa_id = ?`,
      [...todoIds, tarefaId]
    );

    if (existingTodos.length !== todos.length) {
      return res.status(400).json({ error: 'Alguns todos não foram encontrados' });
    }

    // Tentar atualizar ordem de cada todo (se coluna existir)
    try {
      for (const todo of todos) {
        await pool.execute(
          'UPDATE todos SET ordem = ? WHERE id = ? AND tarefa_id = ?',
          [todo.ordem, todo.id, tarefaId]
        );
      }
    } catch (error) {
      // Se coluna ordem não existir, apenas retornar sucesso sem atualizar
      console.warn('Coluna ordem não existe ainda. Execute a migration primeiro.');
    }

    // Retornar todos atualizados - tentar ordenar por ordem, se não existir usar created_at
    let updatedTodos;
    try {
      [updatedTodos] = await pool.execute(
        'SELECT * FROM todos WHERE tarefa_id = ? ORDER BY ordem ASC, created_at ASC',
        [tarefaId]
      );
    } catch (error) {
      [updatedTodos] = await pool.execute(
        'SELECT * FROM todos WHERE tarefa_id = ? ORDER BY created_at ASC',
        [tarefaId]
      );
    }

    // WebSocket removido

    res.json(updatedTodos);
  } catch (error) {
    console.error('Erro ao reordenar todos:', error);
    res.status(500).json({ error: 'Erro ao reordenar todos' });
  }
};
