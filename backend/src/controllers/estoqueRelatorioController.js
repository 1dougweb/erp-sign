import pool from '../config/database.js';

export const movimentacoesPorPeriodo = async (req, res) => {
  try {
    const { data_inicio, data_fim, tipo, material_id } = req.query;
    
    let query = `
      SELECT 
        DATE(em.data_movimentacao) as data,
        em.tipo,
        COUNT(*) as quantidade_movimentacoes,
        SUM(em.quantidade) as quantidade_total,
        SUM(em.valor_total) as valor_total
       FROM estoque_movimentacoes em
       WHERE 1=1
    `;
    
    const params = [];
    
    if (data_inicio) {
      query += ' AND DATE(em.data_movimentacao) >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ' AND DATE(em.data_movimentacao) <= ?';
      params.push(data_fim);
    }
    
    if (tipo) {
      query += ' AND em.tipo = ?';
      params.push(tipo);
    }
    
    if (material_id) {
      query += ' AND em.material_id = ?';
      params.push(material_id);
    }
    
    query += ' GROUP BY DATE(em.data_movimentacao), em.tipo ORDER BY data DESC';
    
    const [result] = await pool.execute(query, params);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

export const consumoPorMaterial = async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    let query = `
      SELECT 
        m.id,
        m.nome as material_nome,
        SUM(CASE WHEN em.tipo = 'saida' THEN em.quantidade ELSE 0 END) as quantidade_consumida,
        SUM(CASE WHEN em.tipo = 'saida' THEN em.valor_total ELSE 0 END) as valor_consumido
       FROM materiais m
       LEFT JOIN estoque_movimentacoes em ON m.id = em.material_id
       WHERE 1=1
    `;
    
    const params = [];
    
    if (data_inicio) {
      query += ' AND (em.data_movimentacao IS NULL OR DATE(em.data_movimentacao) >= ?)';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ' AND (em.data_movimentacao IS NULL OR DATE(em.data_movimentacao) <= ?)';
      params.push(data_fim);
    }
    
    query += ' GROUP BY m.id, m.nome HAVING quantidade_consumida > 0 ORDER BY quantidade_consumida DESC LIMIT 50';
    
    const [result] = await pool.execute(query, params);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar relatório de consumo:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de consumo' });
  }
};

export const estoqueAtualVsMinimo = async (req, res) => {
  try {
    const [result] = await pool.execute(
      `SELECT 
        m.id,
        m.nome,
        m.quantidade_estoque,
        m.estoque_minimo,
        m.estoque_maximo,
        CASE 
          WHEN m.quantidade_estoque <= 0 THEN 'zero'
          WHEN m.quantidade_estoque <= m.estoque_minimo THEN 'baixo'
          WHEN m.quantidade_estoque >= m.estoque_maximo THEN 'alto'
          ELSE 'normal'
        END as status
       FROM materiais m
       WHERE m.ativo = TRUE AND m.tipo = 'material'
       ORDER BY 
         CASE status
           WHEN 'zero' THEN 1
           WHEN 'baixo' THEN 2
           WHEN 'alto' THEN 3
           ELSE 4
         END,
         m.nome ASC`
    );
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

export const historicoRequisicoes = async (req, res) => {
  try {
    const { data_inicio, data_fim, status } = req.query;
    
    let query = `
      SELECT 
        rm.id,
        rm.numero,
        rm.status,
        rm.data_solicitacao,
        rm.data_aprovacao,
        rm.data_atendimento,
        u_solicitante.nome as solicitante_nome,
        COUNT(ri.id) as quantidade_itens,
        SUM(ri.quantidade_solicitada) as quantidade_total
       FROM requisicoes_materiais rm
       INNER JOIN users u_solicitante ON rm.solicitante_id = u_solicitante.id
       LEFT JOIN requisicao_itens ri ON rm.id = ri.requisicao_id
       WHERE 1=1
    `;
    
    const params = [];
    
    if (data_inicio) {
      query += ' AND DATE(rm.data_solicitacao) >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ' AND DATE(rm.data_solicitacao) <= ?';
      params.push(data_fim);
    }
    
    if (status) {
      query += ' AND rm.status = ?';
      params.push(status);
    }
    
    query += ' GROUP BY rm.id ORDER BY rm.data_solicitacao DESC';
    
    const [result] = await pool.execute(query, params);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};
