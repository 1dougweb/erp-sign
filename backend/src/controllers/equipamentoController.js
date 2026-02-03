import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const { tipo, status, busca } = req.query;
    
    let query = 'SELECT * FROM equipamentos_ferramentas WHERE 1=1';
    const params = [];
    
    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (busca) {
      query += ' AND (nome LIKE ? OR marca LIKE ? OR modelo LIKE ? OR numero_serie LIKE ? OR patrimonio LIKE ?)';
      const buscaTerm = `%${busca}%`;
      params.push(buscaTerm, buscaTerm, buscaTerm, buscaTerm, buscaTerm);
    }
    
    query += ' ORDER BY nome ASC';
    
    const [equipamentos] = await pool.execute(query, params);
    res.json(equipamentos);
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar equipamentos' });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [equipamentos] = await pool.execute(
      'SELECT * FROM equipamentos_ferramentas WHERE id = ?',
      [id]
    );
    
    if (equipamentos.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    
    // Buscar histórico de movimentações
    const [movimentacoes] = await pool.execute(
      `SELECT em.*,
       f.nome as funcionario_nome,
       u.nome as usuario_nome
       FROM equipamento_movimentacoes em
       LEFT JOIN funcionarios f ON em.funcionario_id = f.id
       LEFT JOIN users u ON em.usuario_id = u.id
       WHERE em.equipamento_id = ?
       ORDER BY em.data_movimentacao DESC`,
      [id]
    );
    
    equipamentos[0].movimentacoes = movimentacoes;
    
    res.json(equipamentos[0]);
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    res.status(500).json({ error: 'Erro ao buscar equipamento' });
  }
};

export const create = async (req, res) => {
  try {
    const {
      nome, descricao, tipo, marca, modelo, numero_serie, patrimonio,
      localizacao, status, valor_aquisicao, data_aquisicao, observacoes, imagem_url
    } = req.body;
    
    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO equipamentos_ferramentas (
        nome, descricao, tipo, marca, modelo, numero_serie, patrimonio,
        localizacao, status, valor_aquisicao, data_aquisicao, observacoes, imagem_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome, descricao || null, tipo, marca || null, modelo || null,
        numero_serie || null, patrimonio || null, localizacao || null,
        status || 'disponivel', valor_aquisicao || 0, data_aquisicao || null, observacoes || null, imagem_url || null
      ]
    );
    
    const [equipamento] = await pool.execute(
      'SELECT * FROM equipamentos_ferramentas WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(equipamento[0]);
  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    res.status(500).json({ error: 'Erro ao criar equipamento' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, descricao, tipo, marca, modelo, numero_serie, patrimonio,
      localizacao, status, valor_aquisicao, data_aquisicao, observacoes, imagem_url
    } = req.body;
    
    const [existing] = await pool.execute(
      'SELECT * FROM equipamentos_ferramentas WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    
    const equipamento = existing[0];
    
    await pool.execute(
      `UPDATE equipamentos_ferramentas SET 
        nome = ?, descricao = ?, tipo = ?, marca = ?, modelo = ?, numero_serie = ?, patrimonio = ?,
        localizacao = ?, status = ?, valor_aquisicao = ?, data_aquisicao = ?, observacoes = ?, imagem_url = ?
        WHERE id = ?`,
      [
        nome || equipamento.nome,
        descricao !== undefined ? descricao : equipamento.descricao,
        tipo || equipamento.tipo,
        marca !== undefined ? marca : equipamento.marca,
        modelo !== undefined ? modelo : equipamento.modelo,
        numero_serie !== undefined ? numero_serie : equipamento.numero_serie,
        patrimonio !== undefined ? patrimonio : equipamento.patrimonio,
        localizacao !== undefined ? localizacao : equipamento.localizacao,
        status || equipamento.status,
        valor_aquisicao !== undefined ? valor_aquisicao : equipamento.valor_aquisicao,
        data_aquisicao !== undefined ? data_aquisicao : equipamento.data_aquisicao,
        observacoes !== undefined ? observacoes : equipamento.observacoes,
        imagem_url !== undefined ? imagem_url : equipamento.imagem_url,
        id
      ]
    );
    
    const [updated] = await pool.execute(
      'SELECT * FROM equipamentos_ferramentas WHERE id = ?',
      [id]
    );
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar equipamento' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await pool.execute(
      'SELECT * FROM equipamentos_ferramentas WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    
    await pool.execute('DELETE FROM equipamentos_ferramentas WHERE id = ?', [id]);
    
    res.json({ message: 'Equipamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir equipamento:', error);
    res.status(500).json({ error: 'Erro ao excluir equipamento' });
  }
};

export const emprestar = async (req, res) => {
  try {
    const { id } = req.params;
    const { funcionario_id, data_prevista_devolucao, observacoes } = req.body;
    
    const [equipamentos] = await pool.execute(
      'SELECT * FROM equipamentos_ferramentas WHERE id = ?',
      [id]
    );
    
    if (equipamentos.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    
    if (equipamentos[0].status !== 'disponivel') {
      return res.status(400).json({ error: 'Equipamento não está disponível' });
    }
    
    const userId = req.user.id;
    
    // Criar movimentação
    await pool.execute(
      `INSERT INTO equipamento_movimentacoes (
        equipamento_id, tipo, funcionario_id, usuario_id, data_prevista_devolucao, observacoes
      ) VALUES (?, 'emprestimo', ?, ?, ?, ?)`,
      [id, funcionario_id || null, userId, data_prevista_devolucao || null, observacoes || null]
    );
    
    // Atualizar status
    await pool.execute(
      'UPDATE equipamentos_ferramentas SET status = ? WHERE id = ?',
      ['em_uso', id]
    );
    
    res.json({ message: 'Equipamento emprestado com sucesso' });
  } catch (error) {
    console.error('Erro ao emprestar equipamento:', error);
    res.status(500).json({ error: 'Erro ao emprestar equipamento' });
  }
};

export const devolver = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;
    
    const [equipamentos] = await pool.execute(
      'SELECT * FROM equipamentos_ferramentas WHERE id = ?',
      [id]
    );
    
    if (equipamentos.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    
    const userId = req.user.id;
    
    // Buscar último empréstimo
    const [ultimoEmprestimo] = await pool.execute(
      `SELECT * FROM equipamento_movimentacoes 
       WHERE equipamento_id = ? AND tipo = 'emprestimo' AND data_devolucao IS NULL
       ORDER BY data_movimentacao DESC LIMIT 1`,
      [id]
    );
    
    if (ultimoEmprestimo.length > 0) {
      // Atualizar movimentação de empréstimo
      await pool.execute(
        'UPDATE equipamento_movimentacoes SET data_devolucao = NOW() WHERE id = ?',
        [ultimoEmprestimo[0].id]
      );
    }
    
    // Criar movimentação de devolução
    await pool.execute(
      `INSERT INTO equipamento_movimentacoes (
        equipamento_id, tipo, usuario_id, observacoes
      ) VALUES (?, 'devolucao', ?, ?)`,
      [id, userId, observacoes || null]
    );
    
    // Atualizar status
    await pool.execute(
      'UPDATE equipamentos_ferramentas SET status = ? WHERE id = ?',
      ['disponivel', id]
    );
    
    res.json({ message: 'Equipamento devolvido com sucesso' });
  } catch (error) {
    console.error('Erro ao devolver equipamento:', error);
    res.status(500).json({ error: 'Erro ao devolver equipamento' });
  }
};
