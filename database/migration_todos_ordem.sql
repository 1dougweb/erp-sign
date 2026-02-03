-- Adicionar campo ordem na tabela todos (se não existir)
-- MySQL não suporta IF NOT EXISTS no ALTER TABLE, então verificamos antes
SET @dbname = DATABASE();
SET @tablename = 'todos';
SET @columnname = 'ordem';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT DEFAULT 0')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Atualizar ordem existente baseada em created_at
UPDATE todos t1
SET ordem = (
  SELECT COUNT(*) + 1 
  FROM todos t2 
  WHERE t2.tarefa_id = t1.tarefa_id 
  AND t2.created_at < t1.created_at
)
WHERE ordem = 0 OR ordem IS NULL;

-- Criar índice para melhorar performance (se não existir)
SET @indexname = 'idx_todos_tarefa_ordem';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(tarefa_id, ordem)')
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;
