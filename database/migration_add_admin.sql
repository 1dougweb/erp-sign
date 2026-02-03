-- Script de migração para adicionar campo is_admin
-- Execute este script se o banco de dados já existe

USE todo_instalacao;

-- Adicionar campo is_admin se não existir
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Adicionar campos na tabela orcamentos se não existirem
ALTER TABLE orcamentos
ADD COLUMN IF NOT EXISTS tipo_trabalho VARCHAR(255),
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar tabela material_precos se não existir
CREATE TABLE IF NOT EXISTS material_precos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    tipo_calculo ENUM('impressao_cm2', 'corte_cm2', 'outro') DEFAULT 'impressao_cm2',
    valor_por_cm2 DECIMAL(10, 4) NOT NULL DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    UNIQUE KEY unique_material_tipo (material_id, tipo_calculo),
    INDEX idx_material_ativo (material_id, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela orcamento_itens se não existir
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orcamento_id INT NOT NULL,
    material_id INT NOT NULL,
    descricao_trabalho TEXT,
    metragem_cm2 DECIMAL(10, 2) NOT NULL DEFAULT 0,
    valor_unitario DECIMAL(10, 4) NOT NULL DEFAULT 0,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    INDEX idx_orcamento_ordem (orcamento_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
