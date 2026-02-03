-- Script de migração para adicionar campo data_termino ao cronograma
-- Execute este script se o banco de dados já existe

USE todo_instalacao;

-- Adicionar campo data_termino se não existir
ALTER TABLE cronograma_instalacao
ADD COLUMN IF NOT EXISTS data_termino DATE NULL AFTER data_instalacao;