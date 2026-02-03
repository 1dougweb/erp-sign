-- Migration: adicionar avatar_url na tabela users para foto de perfil

ALTER TABLE users
  ADD COLUMN avatar_url VARCHAR(500) NULL AFTER email;

