-- Migration: Adicionar tabela de relacionamento entre cronograma e equipamentos
-- Data: 2024

CREATE TABLE IF NOT EXISTS cronograma_equipamento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cronograma_id INT NOT NULL,
    equipamento_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cronograma_id) REFERENCES cronograma_instalacao(id) ON DELETE CASCADE,
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos_ferramentas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cronograma_equipamento (cronograma_id, equipamento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
