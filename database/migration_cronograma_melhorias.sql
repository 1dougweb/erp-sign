-- Migration: Melhorias no Cronograma
-- Adiciona campos para OS manual, CEP, coordenadas e tabela de todos

USE todo_instalacao;

-- 1. Adicionar novos campos na tabela cronograma_instalacao
ALTER TABLE cronograma_instalacao 
ADD COLUMN IF NOT EXISTS os_manual VARCHAR(50) NULL AFTER observacoes,
ADD COLUMN IF NOT EXISTS cep VARCHAR(10) NULL AFTER endereco,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL AFTER cep,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL AFTER latitude;

-- 2. Criar tabela para todos do cronograma
CREATE TABLE IF NOT EXISTS cronograma_todos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cronograma_id INT NOT NULL,
    descricao TEXT NOT NULL,
    concluido BOOLEAN DEFAULT FALSE,
    ordem INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cronograma_id) REFERENCES cronograma_instalacao(id) ON DELETE CASCADE,
    INDEX idx_cronograma_ordem (cronograma_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: O campo orcamento_id não será removido para manter compatibilidade
-- com dados existentes. Ele pode ser usado opcionalmente.
