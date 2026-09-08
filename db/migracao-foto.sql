-- Migração: foto de perfil compactada (data URL JPEG).
-- Rode uma vez no banco já existente:
--   mysql -u seu_usuario -p seu_banco < db/migracao-foto.sql

ALTER TABLE pessoas
  ADD COLUMN foto TEXT NULL;
