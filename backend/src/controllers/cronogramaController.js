import pool from '../config/database.js';

export const getCronogramas = async (req, res) => {
  try {
    const [cronogramas] = await pool.execute(
      `SELECT c.*
       FROM cronograma_instalacao c 
       ORDER BY c.data_instalacao DESC, c.hora_inicio ASC`
    );

    // Buscar equipes e materiais de cada cronograma
    for (const cronograma of cronogramas) {
      // Equipes
      const [equipes] = await pool.execute(
        `SELECT e.* FROM equipes e 
         INNER JOIN cronograma_equipe ce ON e.id = ce.equipe_id 
         WHERE ce.cronograma_id = ?`,
        [cronograma.id]
      );
      
      // Buscar funcionários de cada equipe
      for (const equipe of equipes) {
        const [funcionarios] = await pool.execute(
          `SELECT f.* FROM funcionarios f 
           INNER JOIN equipe_funcionarios ef ON f.id = ef.funcionario_id 
           WHERE ef.equipe_id = ?`,
          [equipe.id]
        );
        equipe.funcionarios = funcionarios;
      }
      
      cronograma.equipes = equipes;

      // Materiais
      const [materiais] = await pool.execute(
        `SELECT m.*, cm.quantidade_necessaria, cm.quantidade_confirmada 
         FROM materiais m 
         INNER JOIN cronograma_material cm ON m.id = cm.material_id 
         WHERE cm.cronograma_id = ?`,
        [cronograma.id]
      );
      cronograma.materiais = materiais;

      // Carros (veículos)
      const [carros] = await pool.execute(
        `SELECT c.* FROM carros c 
         INNER JOIN cronograma_carro cc ON c.id = cc.carro_id 
         WHERE cc.cronograma_id = ?`,
        [cronograma.id]
      );
      cronograma.carros = carros;

      // Equipamentos
      const [equipamentos] = await pool.execute(
        `SELECT e.* FROM equipamentos_ferramentas e 
         INNER JOIN cronograma_equipamento ce ON e.id = ce.equipamento_id 
         WHERE ce.cronograma_id = ?`,
        [cronograma.id]
      );
      cronograma.equipamentos = equipamentos;
    }

    res.json(cronogramas);
  } catch (error) {
    console.error('Erro ao buscar cronogramas:', error);
    res.status(500).json({ error: 'Erro ao buscar cronogramas' });
  }
};

export const createCronograma = async (req, res) => {
  try {
    const { os_manual, data_instalacao, data_termino, hora_inicio, hora_fim, endereco, cep, latitude, longitude, observacoes, equipes, materiais, veiculos, equipamentos } = req.body;

    if (!data_instalacao || !endereco) {
      return res.status(400).json({ error: 'Data de instalação e endereço são obrigatórios' });
    }

    const [result] = await pool.execute(
      'INSERT INTO cronograma_instalacao (os_manual, data_instalacao, data_termino, hora_inicio, hora_fim, endereco, cep, latitude, longitude, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [os_manual || null, data_instalacao, data_termino || null, hora_inicio || null, hora_fim || null, endereco, cep || null, latitude || null, longitude || null, observacoes || null]
    );

    const cronogramaId = result.insertId;

    // Adicionar equipes
    if (Array.isArray(equipes) && equipes.length > 0) {
      for (const equipeId of equipes) {
        await pool.execute(
          'INSERT INTO cronograma_equipe (cronograma_id, equipe_id) VALUES (?, ?)',
          [cronogramaId, equipeId]
        );
      }
    }

    // Adicionar materiais
    if (Array.isArray(materiais) && materiais.length > 0) {
      for (const material of materiais) {
        await pool.execute(
          'INSERT INTO cronograma_material (cronograma_id, material_id, quantidade_necessaria) VALUES (?, ?, ?)',
          [cronogramaId, material.material_id, material.quantidade_necessaria || 1]
        );
      }
    }

    // Adicionar veículos (carros)
    if (Array.isArray(veiculos) && veiculos.length > 0) {
      for (const carroId of veiculos) {
        await pool.execute(
          'INSERT INTO cronograma_carro (cronograma_id, carro_id) VALUES (?, ?)',
          [cronogramaId, carroId]
        );
      }
    }

    // Adicionar equipamentos
    if (Array.isArray(equipamentos) && equipamentos.length > 0) {
      for (const equipamentoId of equipamentos) {
        await pool.execute(
          'INSERT INTO cronograma_equipamento (cronograma_id, equipamento_id) VALUES (?, ?)',
          [cronogramaId, equipamentoId]
        );
      }
    }

    const [cronograma] = await pool.execute(
      `SELECT c.*
       FROM cronograma_instalacao c 
       WHERE c.id = ?`,
      [cronogramaId]
    );

    // Buscar relacionamentos
    const [equipesList] = await pool.execute(
      `SELECT e.* FROM equipes e 
       INNER JOIN cronograma_equipe ce ON e.id = ce.equipe_id 
       WHERE ce.cronograma_id = ?`,
      [cronogramaId]
    );
    
    // Buscar funcionários de cada equipe
    for (const equipe of equipesList) {
      const [funcionarios] = await pool.execute(
        `SELECT f.* FROM funcionarios f 
         INNER JOIN equipe_funcionarios ef ON f.id = ef.funcionario_id 
         WHERE ef.equipe_id = ?`,
        [equipe.id]
      );
      equipe.funcionarios = funcionarios;
    }

    const [materiaisList] = await pool.execute(
      `SELECT m.*, cm.quantidade_necessaria, cm.quantidade_confirmada 
       FROM materiais m 
       INNER JOIN cronograma_material cm ON m.id = cm.material_id 
       WHERE cm.cronograma_id = ?`,
      [cronogramaId]
    );

    const [carrosList] = await pool.execute(
      `SELECT c.* FROM carros c 
       INNER JOIN cronograma_carro cc ON c.id = cc.carro_id 
       WHERE cc.cronograma_id = ?`,
      [cronogramaId]
    );

    const [equipamentosList] = await pool.execute(
      `SELECT e.* FROM equipamentos_ferramentas e 
       INNER JOIN cronograma_equipamento ce ON e.id = ce.equipamento_id 
       WHERE ce.cronograma_id = ?`,
      [cronogramaId]
    );

    cronograma[0].equipes = equipesList;
    cronograma[0].materiais = materiaisList;
    cronograma[0].carros = carrosList;
    cronograma[0].equipamentos = equipamentosList;

    res.status(201).json(cronograma[0]);
  } catch (error) {
    console.error('Erro ao criar cronograma:', error);
    res.status(500).json({ error: 'Erro ao criar cronograma' });
  }
};

export const updateCronograma = async (req, res) => {
  try {
    const { id } = req.params;
    const { os_manual, data_instalacao, data_termino, hora_inicio, hora_fim, endereco, cep, latitude, longitude, observacoes, status, equipes, materiais, veiculos, equipamentos } = req.body;

    const [cronogramas] = await pool.execute(
      'SELECT * FROM cronograma_instalacao WHERE id = ?',
      [id]
    );

    if (cronogramas.length === 0) {
      return res.status(404).json({ error: 'Cronograma não encontrado' });
    }

    await pool.execute(
      'UPDATE cronograma_instalacao SET os_manual = ?, data_instalacao = ?, data_termino = ?, hora_inicio = ?, hora_fim = ?, endereco = ?, cep = ?, latitude = ?, longitude = ?, observacoes = ?, status = ? WHERE id = ?',
      [os_manual || null, data_instalacao, data_termino || null, hora_inicio || null, hora_fim || null, endereco, cep || null, latitude || null, longitude || null, observacoes || null, status || cronogramas[0].status, id]
    );

    // Atualizar equipes
    if (Array.isArray(equipes)) {
      await pool.execute('DELETE FROM cronograma_equipe WHERE cronograma_id = ?', [id]);
      for (const equipeId of equipes) {
        await pool.execute(
          'INSERT INTO cronograma_equipe (cronograma_id, equipe_id) VALUES (?, ?)',
          [id, equipeId]
        );
      }
    }

    // Atualizar materiais
    if (Array.isArray(materiais)) {
      await pool.execute('DELETE FROM cronograma_material WHERE cronograma_id = ?', [id]);
      for (const material of materiais) {
        await pool.execute(
          'INSERT INTO cronograma_material (cronograma_id, material_id, quantidade_necessaria, quantidade_confirmada) VALUES (?, ?, ?, ?)',
          [id, material.material_id, material.quantidade_necessaria || 1, material.quantidade_confirmada || 0]
        );
      }
    }

    // Atualizar veículos (carros)
    if (Array.isArray(veiculos)) {
      await pool.execute('DELETE FROM cronograma_carro WHERE cronograma_id = ?', [id]);
      for (const carroId of veiculos) {
        await pool.execute(
          'INSERT INTO cronograma_carro (cronograma_id, carro_id) VALUES (?, ?)',
          [id, carroId]
        );
      }
    }

    // Atualizar equipamentos
    if (Array.isArray(equipamentos)) {
      await pool.execute('DELETE FROM cronograma_equipamento WHERE cronograma_id = ?', [id]);
      for (const equipamentoId of equipamentos) {
        await pool.execute(
          'INSERT INTO cronograma_equipamento (cronograma_id, equipamento_id) VALUES (?, ?)',
          [id, equipamentoId]
        );
      }
    }

    const [updated] = await pool.execute(
      `SELECT c.*
       FROM cronograma_instalacao c 
       WHERE c.id = ?`,
      [id]
    );

    // Buscar relacionamentos atualizados
    const [equipesList] = await pool.execute(
      `SELECT e.* FROM equipes e 
       INNER JOIN cronograma_equipe ce ON e.id = ce.equipe_id 
       WHERE ce.cronograma_id = ?`,
      [id]
    );
    
    // Buscar funcionários de cada equipe
    for (const equipe of equipesList) {
      const [funcionarios] = await pool.execute(
        `SELECT f.* FROM funcionarios f 
         INNER JOIN equipe_funcionarios ef ON f.id = ef.funcionario_id 
         WHERE ef.equipe_id = ?`,
        [equipe.id]
      );
      equipe.funcionarios = funcionarios;
    }

    const [materiaisList] = await pool.execute(
      `SELECT m.*, cm.quantidade_necessaria, cm.quantidade_confirmada 
       FROM materiais m 
       INNER JOIN cronograma_material cm ON m.id = cm.material_id 
       WHERE cm.cronograma_id = ?`,
      [id]
    );

    const [carrosList] = await pool.execute(
      `SELECT c.* FROM carros c 
       INNER JOIN cronograma_carro cc ON c.id = cc.carro_id 
       WHERE cc.cronograma_id = ?`,
      [id]
    );

    const [equipamentosList] = await pool.execute(
      `SELECT e.* FROM equipamentos_ferramentas e 
       INNER JOIN cronograma_equipamento ce ON e.id = ce.equipamento_id 
       WHERE ce.cronograma_id = ?`,
      [id]
    );

    updated[0].equipes = equipesList;
    updated[0].materiais = materiaisList;
    updated[0].carros = carrosList;
    updated[0].equipamentos = equipamentosList;

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar cronograma:', error);
    res.status(500).json({ error: 'Erro ao atualizar cronograma' });
  }
};

export const updateMaterialQuantidade = async (req, res) => {
  try {
    const { cronogramaId, materialId } = req.params;
    const { quantidade_confirmada } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM cronograma_material WHERE cronograma_id = ? AND material_id = ?',
      [cronogramaId, materialId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado no cronograma' });
    }

    await pool.execute(
      'UPDATE cronograma_material SET quantidade_confirmada = ? WHERE cronograma_id = ? AND material_id = ?',
      [quantidade_confirmada || 0, cronogramaId, materialId]
    );

    const [updated] = await pool.execute(
      `SELECT m.*, cm.quantidade_necessaria, cm.quantidade_confirmada 
       FROM materiais m 
       INNER JOIN cronograma_material cm ON m.id = cm.material_id 
       WHERE cm.cronograma_id = ? AND cm.material_id = ?`,
      [cronogramaId, materialId]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar quantidade do material:', error);
    res.status(500).json({ error: 'Erro ao atualizar quantidade do material' });
  }
};

export const deleteCronograma = async (req, res) => {
  try {
    const { id } = req.params;

    const [cronogramas] = await pool.execute(
      'SELECT * FROM cronograma_instalacao WHERE id = ?',
      [id]
    );

    if (cronogramas.length === 0) {
      return res.status(404).json({ error: 'Cronograma não encontrado' });
    }

    await pool.execute('DELETE FROM cronograma_instalacao WHERE id = ?', [id]);

    res.json({ message: 'Cronograma excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cronograma:', error);
    res.status(500).json({ error: 'Erro ao excluir cronograma' });
  }
};

export const getOrcamentos = async (req, res) => {
  try {
    const [orcamentos] = await pool.execute(
      'SELECT * FROM orcamentos WHERE status IN ("aprovado", "em_andamento") ORDER BY created_at DESC'
    );
    res.json(orcamentos);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamentos' });
  }
};

export const getTiposInstalacao = async (req, res) => {
  try {
    const [tipos] = await pool.execute(
      'SELECT * FROM tipos_instalacao ORDER BY nome ASC'
    );
    res.json(tipos);
  } catch (error) {
    console.error('Erro ao buscar tipos de instalação:', error);
    res.status(500).json({ error: 'Erro ao buscar tipos de instalação' });
  }
};
