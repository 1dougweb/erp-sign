import pool from '../config/database.js';

export const getCarros = async (req, res) => {
  try {
    const [carros] = await pool.execute(
      'SELECT * FROM carros ORDER BY placa ASC'
    );
    res.json(carros);
  } catch (error) {
    console.error('Erro ao buscar carros:', error);
    res.status(500).json({ error: 'Erro ao buscar carros' });
  }
};

export const createCarro = async (req, res) => {
  try {
    const { placa, modelo, marca, ano, imagem_url, disponivel } = req.body;

    if (!placa || !modelo) {
      return res.status(400).json({ error: 'Placa e modelo são obrigatórios' });
    }

    const [result] = await pool.execute(
      'INSERT INTO carros (placa, modelo, marca, ano, imagem_url, disponivel) VALUES (?, ?, ?, ?, ?, ?)',
      [placa, modelo, marca || null, ano || null, imagem_url || null, disponivel !== undefined ? disponivel : true]
    );

    const [carro] = await pool.execute(
      'SELECT * FROM carros WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(carro[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Placa já cadastrada' });
    }
    console.error('Erro ao criar carro:', error);
    res.status(500).json({ error: 'Erro ao criar carro' });
  }
};

export const updateCarro = async (req, res) => {
  try {
    const { id } = req.params;
    const { placa, modelo, marca, ano, imagem_url, disponivel } = req.body;

    const [carros] = await pool.execute(
      'SELECT * FROM carros WHERE id = ?',
      [id]
    );

    if (carros.length === 0) {
      return res.status(404).json({ error: 'Carro não encontrado' });
    }

    await pool.execute(
      'UPDATE carros SET placa = ?, modelo = ?, marca = ?, ano = ?, imagem_url = ?, disponivel = ? WHERE id = ?',
      [placa, modelo, marca || null, ano || null, imagem_url || null, disponivel !== undefined ? disponivel : carros[0].disponivel, id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM carros WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Placa já cadastrada' });
    }
    console.error('Erro ao atualizar carro:', error);
    res.status(500).json({ error: 'Erro ao atualizar carro' });
  }
};

export const deleteCarro = async (req, res) => {
  try {
    const { id } = req.params;

    const [carros] = await pool.execute(
      'SELECT * FROM carros WHERE id = ?',
      [id]
    );

    if (carros.length === 0) {
      return res.status(404).json({ error: 'Carro não encontrado' });
    }

    await pool.execute('DELETE FROM carros WHERE id = ?', [id]);

    res.json({ message: 'Carro excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir carro:', error);
    res.status(500).json({ error: 'Erro ao excluir carro' });
  }
};
