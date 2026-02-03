import pool from '../config/database.js';

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(
      'SELECT COALESCE(is_admin, 0) as is_admin FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!users[0].is_admin || users[0].is_admin === 0) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};
