import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_jwt_aqui_mude_em_producao', (err, decoded) => {
    if (err) {
      console.error('Erro ao verificar token:', err.message);
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    
    // Garantir que o token decodificado tem id e email
    if (!decoded.id) {
      console.error('Token decodificado não contém id:', decoded);
      return res.status(403).json({ error: 'Token inválido - informações do usuário ausentes' });
    }
    
    req.user = decoded;
    next();
  });
};
