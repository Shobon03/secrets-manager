-- Criação da tabela de Projetos
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionando a coluna project_id na tabela secrets existente
-- Nota: SQLite permite isso, mas a constraint FK pode não ser validada retroativamente
-- sem recriar a tabela. Vamos confiar na sintaxe, mas reforçar a lógica no Rust.
ALTER TABLE secrets ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Criar índice para performance em queries de relacionamento
CREATE INDEX IF NOT EXISTS idx_secrets_project_id ON secrets(project_id);
