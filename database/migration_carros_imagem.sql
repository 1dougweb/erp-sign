-- Migration: Adicionar campo de imagem para carros
-- Execute este script para adicionar o campo imagem_url na tabela carros

USE todo_instalacao;

ALTER TABLE carros 
ADD COLUMN IF NOT EXISTS imagem_url TEXT NULL AFTER ano;
