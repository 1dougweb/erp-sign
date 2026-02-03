import pool from '../config/database.js';

export const getAll = async (req, res) => {
  try {
    const [unidades] = await pool.execute(
      'SELECT * FROM unidades_medida ORDER BY tipo ASC, nome ASC'
    );
    res.json(unidades);
  } catch (error) {
    console.error('Erro ao buscar unidades de medida:', error);
    // Se a tabela não existe, retornar array vazio
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes('doesn\'t exist')) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Erro ao buscar unidades de medida' });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [unidades] = await pool.execute(
      'SELECT * FROM unidades_medida WHERE id = ?',
      [id]
    );

    if (unidades.length === 0) {
      return res.status(404).json({ error: 'Unidade de medida não encontrada' });
    }

    res.json(unidades[0]);
  } catch (error) {
    console.error('Erro ao buscar unidade de medida:', error);
    res.status(500).json({ error: 'Erro ao buscar unidade de medida' });
  }
};

export const create = async (req, res) => {
  try {
    const { nome, simbolo, tipo } = req.body;

    if (!nome || !simbolo) {
      return res.status(400).json({ error: 'Nome e símbolo são obrigatórios' });
    }

    const [result] = await pool.execute(
      'INSERT INTO unidades_medida (nome, simbolo, tipo) VALUES (?, ?, ?)',
      [nome, simbolo, tipo || 'unidade']
    );

    const [unidade] = await pool.execute(
      'SELECT * FROM unidades_medida WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(unidade[0]);
  } catch (error) {
    console.error('Erro ao criar unidade de medida:', error);
    res.status(500).json({ error: 'Erro ao criar unidade de medida' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, simbolo, tipo } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM unidades_medida WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Unidade de medida não encontrada' });
    }

    await pool.execute(
      'UPDATE unidades_medida SET nome = ?, simbolo = ?, tipo = ? WHERE id = ?',
      [nome || existing[0].nome, simbolo || existing[0].simbolo, tipo || existing[0].tipo, id]
    );

    const [unidade] = await pool.execute(
      'SELECT * FROM unidades_medida WHERE id = ?',
      [id]
    );

    res.json(unidade[0]);
  } catch (error) {
    console.error('Erro ao atualizar unidade de medida:', error);
    res.status(500).json({ error: 'Erro ao atualizar unidade de medida' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM unidades_medida WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Unidade de medida não encontrada' });
    }

    await pool.execute('DELETE FROM unidades_medida WHERE id = ?', [id]);

    res.json({ message: 'Unidade de medida excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir unidade de medida:', error);
    res.status(500).json({ error: 'Erro ao excluir unidade de medida' });
  }
};
