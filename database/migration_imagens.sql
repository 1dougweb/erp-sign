-- Migração: Adicionar suporte a imagens em materiais e equipamentos
-- Execute este script para adicionar campos de imagem

USE todo_instalacao;

-- Adicionar campo imagem_url na tabela materiais
SET @dbname = DATABASE();
SET @tablename = 'materiais';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'imagem_url')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE materiais ADD COLUMN imagem_url TEXT'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Adicionar campo imagem_url na tabela equipamentos_ferramentas
SET @tablename = 'equipamentos_ferramentas';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'imagem_url')
  ) > 0,
  'SELECT 1',
  'ALTER TABLE equipamentos_ferramentas ADD COLUMN imagem_url TEXT'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
