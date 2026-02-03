import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const { status, solicitante_id } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.is_admin || false;
    
    let query = `
      SELECT rm.*,
       u_solicitante.nome as solicitante_nome,
       u_aprovador.nome as aprovador_nome,
       p.nome as projeto_nome,
       o.numero as orcamento_numero,
       ci.id as cronograma_id
       FROM requisicoes_materiais rm
       INNER JOIN users u_solicitante ON rm.solicitante_id = u_solicitante.id
       LEFT JOIN users u_aprovador ON rm.aprovador_id = u_aprovador.id
       LEFT JOIN projetos p ON rm.projeto_id = p.id
       LEFT JOIN orcamentos o ON rm.orcamento_id = o.id
       LEFT JOIN cronograma_instalacao ci ON rm.cronograma_id = ci.id
       WHERE 1=1
    `;
    
    const params = [];
    
    // Se não for admin, só vê suas próprias requisições
    if (!isAdmin) {
      query += ' AND rm.solicitante_id = ?';
      params.push(userId);
    } else if (solicitante_id) {
      query += ' AND rm.solicitante_id = ?';
      params.push(solicitante_id);
    }
    
    if (status) {
      query += ' AND rm.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY rm.data_solicitacao DESC';
    
    const [requisicoes] = await pool.execute(query, params);
    
    // Buscar itens de cada requisição
    for (const requisicao of requisicoes) {
      const [itens] = await pool.execute(
        `SELECT ri.*, m.nome as material_nome, um.simbolo as unidade_simbolo
         FROM requisicao_itens ri
         INNER JOIN materiais m ON ri.material_id = m.id
         LEFT JOIN unidades_medida um ON ri.unidade_id = um.id
         WHERE ri.requisicao_id = ?`,
        [requisicao.id]
      );
      requisicao.itens = itens;
    }
    
    res.json(requisicoes);
  } catch (error) {
    console.error('Erro ao buscar requisições:', error);
    res.status(500).json({ error: 'Erro ao buscar requisições' });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.is_admin || false;
    
    const [requisicoes] = await pool.execute(
      `SELECT rm.*,
       u_solicitante.nome as solicitante_nome,
       u_aprovador.nome as aprovador_nome,
       p.nome as projeto_nome,
       o.numero as orcamento_numero
       FROM requisicoes_materiais rm
       INNER JOIN users u_solicitante ON rm.solicitante_id = u_solicitante.id
       LEFT JOIN users u_aprovador ON rm.aprovador_id = u_aprovador.id
       LEFT JOIN projetos p ON rm.projeto_id = p.id
       LEFT JOIN orcamentos o ON rm.orcamento_id = o.id
       WHERE rm.id = ?`,
      [id]
    );
    
    if (requisicoes.length === 0) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }
    
    const requisicao = requisicoes[0];
    
    // Verificar permissão
    if (!isAdmin && requisicao.solicitante_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Buscar itens
    const [itens] = await pool.execute(
      `SELECT ri.*, m.nome as material_nome, um.simbolo as unidade_simbolo
       FROM requisicao_itens ri
       INNER JOIN materiais m ON ri.material_id = m.id
       LEFT JOIN unidades_medida um ON ri.unidade_id = um.id
       WHERE ri.requisicao_id = ?`,
      [id]
    );
    
    requisicao.itens = itens;
    
    res.json(requisicao);
  } catch (error) {
    console.error('Erro ao buscar requisição:', error);
    res.status(500).json({ error: 'Erro ao buscar requisição' });
  }
};

export const create = async (req, res) => {
  try {
    const { numero, projeto_id, orcamento_id, cronograma_id, justificativa, observacoes, itens } = req.body;
    
    if (!justificativa || !justificativa.trim()) {
      return res.status(400).json({ error: 'Justificativa é obrigatória' });
    }
    
    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'Adicione pelo menos um item à requisição' });
    }
    
    // Gerar número se não fornecido
    let numeroRequisicao = numero;
    if (!numeroRequisicao) {
      const [ultima] = await pool.execute(
        'SELECT numero FROM requisicoes_materiais ORDER BY id DESC LIMIT 1'
      );
      const ultimoNum = ultima.length > 0 ? parseInt(ultima[0].numero.split('-').pop()) || 0 : 0;
      numeroRequisicao = `REQ-${new Date().getFullYear()}-${String(ultimoNum + 1).padStart(4, '0')}`;
    }
    
    const solicitanteId = req.user.id;
    
    const [result] = await pool.execute(
      'INSERT INTO requisicoes_materiais (numero, solicitante_id, projeto_id, orcamento_id, cronograma_id, justificativa, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [numeroRequisicao, solicitanteId, projeto_id || null, orcamento_id || null, cronograma_id || null, justificativa, observacoes || null]
    );
    
    const requisicaoId = result.insertId;
    
    // Adicionar itens
    for (const item of itens) {
      if (!item.material_id || !item.quantidade_solicitada) {
        continue;
      }
      
      await pool.execute(
        'INSERT INTO requisicao_itens (requisicao_id, material_id, quantidade_solicitada, unidade_id, justificativa_item) VALUES (?, ?, ?, ?, ?)',
        [
          requisicaoId,
          item.material_id,
          item.quantidade_solicitada,
          item.unidade_id || null,
          item.justificativa_item || null
        ]
      );
    }
    
    const [requisicao] = await pool.execute(
      `SELECT rm.*,
       u_solicitante.nome as solicitante_nome
       FROM requisicoes_materiais rm
       INNER JOIN users u_solicitante ON rm.solicitante_id = u_solicitante.id
       WHERE rm.id = ?`,
      [requisicaoId]
    );
    
    // Buscar itens
    const [itensList] = await pool.execute(
      `SELECT ri.*, m.nome as material_nome
       FROM requisicao_itens ri
       INNER JOIN materiais m ON ri.material_id = m.id
       WHERE ri.requisicao_id = ?`,
      [requisicaoId]
    );
    
    requisicao[0].itens = itensList;
    
    res.status(201).json(requisicao[0]);
  } catch (error) {
    console.error('Erro ao criar requisição:', error);
    res.status(500).json({ error: 'Erro ao criar requisição' });
  }
};

export const aprovar = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprovado, observacoes } = req.body;
    
    const [requisicoes] = await pool.execute(
      'SELECT * FROM requisicoes_materiais WHERE id = ?',
      [id]
    );
    
    if (requisicoes.length === 0) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }
    
    const requisicao = requisicoes[0];
    
    if (requisicao.status !== 'pendente') {
      return res.status(400).json({ error: 'Apenas requisições pendentes podem ser aprovadas/rejeitadas' });
    }
    
    const aprovadorId = req.user.id;
    const novoStatus = aprovado ? 'aprovada' : 'rejeitada';
    
    await pool.execute(
      'UPDATE requisicoes_materiais SET status = ?, aprovador_id = ?, data_aprovacao = NOW(), observacoes = ? WHERE id = ?',
      [novoStatus, aprovadorId, observacoes || requisicao.observacoes, id]
    );
    
    // Se aprovada, criar saídas automáticas do estoque
    if (aprovado) {
      const [itens] = await pool.execute(
        'SELECT * FROM requisicao_itens WHERE requisicao_id = ?',
        [id]
      );
      
      for (const item of itens) {
        // Criar movimentação de saída
        await pool.execute(
          `INSERT INTO estoque_movimentacoes (
            material_id, tipo, quantidade, unidade_id, usuario_id, observacoes, documento_referencia
          ) VALUES (?, 'saida', ?, ?, ?, ?, ?)`,
          [
            item.material_id,
            item.quantidade_solicitada,
            item.unidade_id,
            aprovadorId,
            `Requisição ${requisicao.numero}`,
            requisicao.numero
          ]
        );
        
        // Atualizar estoque
        await pool.execute(
          'UPDATE materiais SET quantidade_estoque = quantidade_estoque - ? WHERE id = ?',
          [item.quantidade_solicitada, item.material_id]
        );
        
        // Atualizar quantidade atendida
        await pool.execute(
          'UPDATE requisicao_itens SET quantidade_atendida = ? WHERE id = ?',
          [item.quantidade_solicitada, item.id]
        );
      }
      
      // Marcar como atendida
      await pool.execute(
        'UPDATE requisicoes_materiais SET status = ?, data_atendimento = NOW() WHERE id = ?',
        ['atendida', id]
      );
    }
    
    const [updated] = await pool.execute(
      `SELECT rm.*,
       u_solicitante.nome as solicitante_nome,
       u_aprovador.nome as aprovador_nome
       FROM requisicoes_materiais rm
       INNER JOIN users u_solicitante ON rm.solicitante_id = u_solicitante.id
       LEFT JOIN users u_aprovador ON rm.aprovador_id = u_aprovador.id
       WHERE rm.id = ?`,
      [id]
    );
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao aprovar requisição:', error);
    res.status(500).json({ error: 'Erro ao aprovar requisição' });
  }
};

export const cancelar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.is_admin || false;
    
    const [requisicoes] = await pool.execute(
      'SELECT * FROM requisicoes_materiais WHERE id = ?',
      [id]
    );
    
    if (requisicoes.length === 0) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }
    
    const requisicao = requisicoes[0];
    
    // Só pode cancelar se for o solicitante ou admin, e se estiver pendente
    if (requisicao.status !== 'pendente') {
      return res.status(400).json({ error: 'Apenas requisições pendentes podem ser canceladas' });
    }
    
    if (!isAdmin && requisicao.solicitante_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    await pool.execute(
      'UPDATE requisicoes_materiais SET status = ? WHERE id = ?',
      ['cancelada', id]
    );
    
    res.json({ message: 'Requisição cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar requisição:', error);
    res.status(500).json({ error: 'Erro ao cancelar requisição' });
  }
};
