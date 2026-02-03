-- Script de migração corrigido para MySQL
-- Este script verifica se as colunas existem antes de adicioná-las

USE todo_instalacao;

-- Função auxiliar para verificar se coluna existe (MySQL 5.7+)
-- Se usar MySQL 8.0+, pode usar IF NOT EXISTS diretamente

-- Adicionar campos na tabela materiais (com verificação manual)
SET @dbname = DATABASE();
SET @tablename = 'materiais';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'categoria_id')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN categoria_id INT'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'fornecedor_id')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN fornecedor_id INT'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'unidade_medida_id')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN unidade_medida_id INT'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'estoque_minimo')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN estoque_minimo DECIMAL(10, 2) DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'estoque_maximo')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN estoque_maximo DECIMAL(10, 2) DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'ponto_reposicao')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN ponto_reposicao DECIMAL(10, 2) DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'valor_unitario')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN valor_unitario DECIMAL(10, 2) DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'valor_total_estoque')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN valor_total_estoque DECIMAL(10, 2) DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'localizacao')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN localizacao VARCHAR(255)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'codigo_barras')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN codigo_barras VARCHAR(100)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'codigo_interno')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN codigo_interno VARCHAR(100)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'ativo')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN ativo BOOLEAN DEFAULT TRUE'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'observacoes')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN observacoes TEXT'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Adicionar foreign keys (verificar se não existem)
-- Nota: MySQL não suporta IF NOT EXISTS para constraints, então vamos usar um procedimento
-- Por enquanto, vamos apenas tentar adicionar e ignorar erros se já existirem

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_materiais_categoria ON materiais(categoria_id);
CREATE INDEX IF NOT EXISTS idx_materiais_fornecedor ON materiais(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_materiais_ativo ON materiais(ativo);
