import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    // Verificar se a tabela orcamento_itens existe, se não, retornar orçamentos sem itens
    let orcamentos;
    try {
      [orcamentos] = await pool.execute(
        `SELECT o.*, 
         COALESCE(SUM(oi.valor_total), 0) as valor_calculado
         FROM orcamentos o
         LEFT JOIN orcamento_itens oi ON o.id = oi.orcamento_id
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      );
    } catch (err) {
      // Se a tabela orcamento_itens não existe, buscar apenas orçamentos
      [orcamentos] = await pool.execute(
        'SELECT o.*, COALESCE(o.valor, 0) as valor_calculado FROM orcamentos o ORDER BY o.created_at DESC'
      );
    }

    // Buscar itens de cada orçamento
    for (const orcamento of orcamentos) {
      try {
        const [itens] = await pool.execute(
          `SELECT oi.*, m.nome as material_nome 
           FROM orcamento_itens oi
           INNER JOIN materiais m ON oi.material_id = m.id
           WHERE oi.orcamento_id = ?
           ORDER BY oi.ordem ASC`,
          [orcamento.id]
        );
        orcamento.itens = itens;
      } catch (err) {
        // Se não conseguir buscar itens, definir como array vazio
        orcamento.itens = [];
      }
    }

    res.json(orcamentos);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamentos', details: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orcamentos] = await pool.execute(
      'SELECT * FROM orcamentos WHERE id = ?',
      [id]
    );

    if (orcamentos.length === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    const orcamento = orcamentos[0];

    // Buscar itens
    const [itens] = await pool.execute(
      `SELECT oi.*, m.nome as material_nome 
       FROM orcamento_itens oi
       INNER JOIN materiais m ON oi.material_id = m.id
       WHERE oi.orcamento_id = ?
       ORDER BY oi.ordem ASC`,
      [id]
    );

    orcamento.itens = itens;

    // Calcular total
    const total = itens.reduce((sum, item) => sum + parseFloat(item.valor_total || 0), 0);
    orcamento.valor_calculado = total;

    res.json(orcamento);
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamento' });
  }
};

export const create = async (req, res) => {
  try {
    const { numero, cliente_nome, cliente_endereco, tipo_trabalho, observacoes, status, itens } = req.body;

    if (!numero || !cliente_nome) {
      return res.status(400).json({ error: 'Número e nome do cliente são obrigatórios' });
    }

    // Verificar se número já existe
    const [existing] = await pool.execute(
      'SELECT id FROM orcamentos WHERE numero = ?',
      [numero]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Número de orçamento já existe' });
    }

    const [result] = await pool.execute(
      'INSERT INTO orcamentos (numero, cliente_nome, cliente_endereco, tipo_trabalho, observacoes, status) VALUES (?, ?, ?, ?, ?, ?)',
      [numero, cliente_nome, cliente_endereco || null, tipo_trabalho || null, observacoes || null, status || 'pendente']
    );

    const orcamentoId = result.insertId;
    let valorTotal = 0;

    // Adicionar itens
    if (Array.isArray(itens) && itens.length > 0) {
      for (let i = 0; i < itens.length; i++) {
        const item = itens[i];
        const valorTotalItem = parseFloat(item.metragem_cm2 || 0) * parseFloat(item.valor_unitario || 0);
        valorTotal += valorTotalItem;

        await pool.execute(
          'INSERT INTO orcamento_itens (orcamento_id, material_id, descricao_trabalho, metragem_cm2, valor_unitario, valor_total, ordem) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            orcamentoId,
            item.material_id,
            item.descricao_trabalho || null,
            item.metragem_cm2 || 0,
            item.valor_unitario || 0,
            valorTotalItem,
            i
          ]
        );
      }

      // Atualizar valor total do orçamento
      await pool.execute(
        'UPDATE orcamentos SET valor = ? WHERE id = ?',
        [valorTotal, orcamentoId]
      );
    }

    const [orcamento] = await pool.execute(
      'SELECT * FROM orcamentos WHERE id = ?',
      [orcamentoId]
    );

    // Buscar itens
    const [itensList] = await pool.execute(
      `SELECT oi.*, m.nome as material_nome 
       FROM orcamento_itens oi
       INNER JOIN materiais m ON oi.material_id = m.id
       WHERE oi.orcamento_id = ?
       ORDER BY oi.ordem ASC`,
      [orcamentoId]
    );

    orcamento[0].itens = itensList;
    orcamento[0].valor_calculado = valorTotal;

    res.status(201).json(orcamento[0]);
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ error: 'Erro ao criar orçamento' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, cliente_nome, cliente_endereco, tipo_trabalho, observacoes, status, itens } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM orcamentos WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    // Verificar se número já existe em outro orçamento
    if (numero && numero !== existing[0].numero) {
      const [numeroExists] = await pool.execute(
        'SELECT id FROM orcamentos WHERE numero = ? AND id != ?',
        [numero, id]
      );

      if (numeroExists.length > 0) {
        return res.status(400).json({ error: 'Número de orçamento já existe' });
      }
    }

    await pool.execute(
      'UPDATE orcamentos SET numero = ?, cliente_nome = ?, cliente_endereco = ?, tipo_trabalho = ?, observacoes = ?, status = ? WHERE id = ?',
      [
        numero || existing[0].numero,
        cliente_nome || existing[0].cliente_nome,
        cliente_endereco !== undefined ? cliente_endereco : existing[0].cliente_endereco,
        tipo_trabalho !== undefined ? tipo_trabalho : existing[0].tipo_trabalho,
        observacoes !== undefined ? observacoes : existing[0].observacoes,
        status || existing[0].status,
        id
      ]
    );

    // Atualizar itens
    if (Array.isArray(itens)) {
      // Deletar itens antigos
      await pool.execute('DELETE FROM orcamento_itens WHERE orcamento_id = ?', [id]);

      let valorTotal = 0;

      // Adicionar novos itens
      for (let i = 0; i < itens.length; i++) {
        const item = itens[i];
        const valorTotalItem = parseFloat(item.metragem_cm2 || 0) * parseFloat(item.valor_unitario || 0);
        valorTotal += valorTotalItem;

        await pool.execute(
          'INSERT INTO orcamento_itens (orcamento_id, material_id, descricao_trabalho, metragem_cm2, valor_unitario, valor_total, ordem) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            item.material_id,
            item.descricao_trabalho || null,
            item.metragem_cm2 || 0,
            item.valor_unitario || 0,
            valorTotalItem,
            i
          ]
        );
      }

      // Atualizar valor total
      await pool.execute(
        'UPDATE orcamentos SET valor = ? WHERE id = ?',
        [valorTotal, id]
      );
    }

    const [updated] = await pool.execute(
      'SELECT * FROM orcamentos WHERE id = ?',
      [id]
    );

    // Buscar itens
    const [itensList] = await pool.execute(
      `SELECT oi.*, m.nome as material_nome 
       FROM orcamento_itens oi
       INNER JOIN materiais m ON oi.material_id = m.id
       WHERE oi.orcamento_id = ?
       ORDER BY oi.ordem ASC`,
      [id]
    );

    updated[0].itens = itensList;

    const valorTotal = itensList.reduce((sum, item) => sum + parseFloat(item.valor_total || 0), 0);
    updated[0].valor_calculado = valorTotal;

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar orçamento' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM orcamentos WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    // Deletar itens (cascata) e orçamento
    await pool.execute('DELETE FROM orcamentos WHERE id = ?', [id]);

    res.json({ message: 'Orçamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({ error: 'Erro ao excluir orçamento' });
  }
};

export const calcularTotal = async (req, res) => {
  try {
    const { id } = req.params;

    const [itens] = await pool.execute(
      'SELECT valor_total FROM orcamento_itens WHERE orcamento_id = ?',
      [id]
    );

    const total = itens.reduce((sum, item) => sum + parseFloat(item.valor_total || 0), 0);

    await pool.execute(
      'UPDATE orcamentos SET valor = ? WHERE id = ?',
      [total, id]
    );

    res.json({ valor_total: total });
  } catch (error) {
    console.error('Erro ao calcular total do orçamento:', error);
    res.status(500).json({ error: 'Erro ao calcular total do orçamento' });
  }
};
