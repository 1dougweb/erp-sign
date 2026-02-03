import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET || 'seu_secret_jwt_aqui_mude_em_producao',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: result.insertId,
        nome,
        email,
        avatar_url: null,
        is_admin: false
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const [users] = await pool.execute(
      'SELECT id, nome, email, senha, avatar_url, COALESCE(is_admin, 0) as is_admin FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(senha, user.senha);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'seu_secret_jwt_aqui_mude_em_producao',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        avatar_url: user.avatar_url || null,
        is_admin: user.is_admin || false
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, nome, email, avatar_url, COALESCE(is_admin, 0) as is_admin, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      userId: req.user?.id
    });
    
    // Se a tabela não existe, retornar erro específico
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist") || error.message.includes('não existe')) {
      return res.status(500).json({ 
        error: 'Tabela de usuários não encontrada no banco de dados',
        details: 'Execute as migrações do banco de dados'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao buscar usuário',
      details: error.message,
      code: error.code
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nome, email, avatar_url } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    // Verificar se o email já está em uso por outro usuário
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id <> ?',
      [email, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já está sendo usado por outro usuário' });
    }

    await pool.execute(
      'UPDATE users SET nome = ?, email = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nome, email, avatar_url || null, userId]
    );

    const [users] = await pool.execute(
      'SELECT id, nome, email, avatar_url, COALESCE(is_admin, 0) as is_admin, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json(users[0]);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    const [users] = await pool.execute(
      'SELECT id, senha FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(senhaAtual, user.senha);

    if (!validPassword) {
      return res.status(400).json({ error: 'Senha atual inválida' });
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await pool.execute(
      'UPDATE users SET senha = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
};

export const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    const [result] = await pool.execute(
      'UPDATE users SET is_admin = TRUE WHERE id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário promovido a administrador com sucesso' });
  } catch (error) {
    console.error('Erro ao promover usuário:', error);
    res.status(500).json({ error: 'Erro ao promover usuário' });
  }
};
