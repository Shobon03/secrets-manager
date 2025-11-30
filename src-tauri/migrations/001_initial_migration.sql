-- Tabela de Segredos
CREATE TABLE IF NOT EXISTS secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    username TEXT,
    password_blob BLOB NULL, -- Alterado para BLOB conforme seu snippet (bom para dados criptografados)
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Anexos (Relacionada com Segredos)
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    secret_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content BLOB NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (secret_id) REFERENCES secrets(id) ON DELETE CASCADE
);
