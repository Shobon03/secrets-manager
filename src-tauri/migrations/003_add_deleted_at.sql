-- Adiciona coluna deleted_at nas tabelas para soft delete e gerenciamento
-- de lixeira e poder recuperar ou excluir definitivamente os registros
ALTER TABLE projects ADD COLUMN deleted_at TEXT;
ALTER TABLE secrets ADD COLUMN deleted_at TEXT;
