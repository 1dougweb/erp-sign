import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const [fornecedores] = await pool.execute(
      'SELECT * FROM fornecedores ORDER BY nome ASC'
    );
    res.json(fornecedores);
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    // Se a tabela não existe, retornar array vazio
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes('doesn\'t exist')) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Erro ao buscar fornecedores' });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [fornecedores] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [id]
    );

    if (fornecedores.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    res.json(fornecedores[0]);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedor' });
  }
};

export const create = async (req, res) => {
  try {
    const { nome, cnpj, telefone, email, endereco, contato, avaliacao, ativo } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const [result] = await pool.execute(
      'INSERT INTO fornecedores (nome, cnpj, telefone, email, endereco, contato, avaliacao, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, cnpj || null, telefone || null, email || null, endereco || null, contato || null, avaliacao || 0, ativo !== undefined ? ativo : true]
    );

    const [fornecedor] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(fornecedor[0]);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, telefone, email, endereco, contato, avaliacao, ativo } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    await pool.execute(
      'UPDATE fornecedores SET nome = ?, cnpj = ?, telefone = ?, email = ?, endereco = ?, contato = ?, avaliacao = ?, ativo = ? WHERE id = ?',
      [
        nome || existing[0].nome,
        cnpj !== undefined ? cnpj : existing[0].cnpj,
        telefone !== undefined ? telefone : existing[0].telefone,
        email !== undefined ? email : existing[0].email,
        endereco !== undefined ? endereco : existing[0].endereco,
        contato !== undefined ? contato : existing[0].contato,
        avaliacao !== undefined ? avaliacao : existing[0].avaliacao,
        ativo !== undefined ? ativo : existing[0].ativo,
        id
      ]
    );

    const [fornecedor] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [id]
    );

    res.json(fornecedor[0]);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM fornecedores WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    await pool.execute('DELETE FROM fornecedores WHERE id = ?', [id]);

    res.json({ message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    res.status(500).json({ error: 'Erro ao excluir fornecedor' });
  }
};
