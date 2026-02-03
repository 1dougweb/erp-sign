import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const { visualizado, resolvido, tipo_alerta } = req.query;
    
    let query = `
      SELECT ea.*,
       m.nome as material_nome,
       m.quantidade_estoque,
       m.estoque_minimo
       FROM estoque_alertas ea
       INNER JOIN materiais m ON ea.material_id = m.id
       WHERE 1=1
    `;
    
    const params = [];
    
    if (visualizado !== undefined) {
      query += ' AND ea.visualizado = ?';
      params.push(visualizado === 'true' ? 1 : 0);
    }
    
    if (resolvido !== undefined) {
      query += ' AND ea.resolvido = ?';
      params.push(resolvido === 'true' ? 1 : 0);
    }
    
    if (tipo_alerta) {
      query += ' AND ea.tipo_alerta = ?';
      params.push(tipo_alerta);
    }
    
    query += ' ORDER BY ea.data_alerta DESC';
    
    const [alertas] = await pool.execute(query, params);
    res.json(alertas);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // Se a tabela não existe, retornar array vazio
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist") || error.message.includes('não existe')) {
      console.warn('Tabela estoque_alertas não encontrada. Retornando array vazio.');
      return res.json([]);
    }
    
    res.status(500).json({ 
      error: 'Erro ao buscar alertas',
      details: error.message,
      code: error.code
    });
  }
};

export const marcarVisualizado = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE estoque_alertas SET visualizado = TRUE WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Alerta marcado como visualizado' });
  } catch (error) {
    console.error('Erro ao marcar alerta:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
    
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
      return res.status(404).json({ error: 'Tabela de alertas não encontrada' });
    }
    
    res.status(500).json({ 
      error: 'Erro ao marcar alerta',
      details: error.message
    });
  }
};

export const marcarResolvido = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE estoque_alertas SET resolvido = TRUE WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Alerta marcado como resolvido' });
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
    
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
      return res.status(404).json({ error: 'Tabela de alertas não encontrada' });
    }
    
    res.status(500).json({ 
      error: 'Erro ao resolver alerta',
      details: error.message
    });
  }
};

export const getCountNaoVisualizados = async (req, res) => {
  try {
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM estoque_alertas WHERE visualizado = FALSE AND resolvido = FALSE'
    );
    
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Erro ao contar alertas:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
    
    // Se a tabela não existe, retornar contagem zero
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist") || error.message.includes('não existe')) {
      return res.json({ count: 0 });
    }
    
    res.status(500).json({ 
      error: 'Erro ao contar alertas',
      details: error.message
    });
  }
};
