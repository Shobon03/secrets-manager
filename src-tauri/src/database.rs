use crate::security::MasterKey;
use rusqlite::{Connection, Result};
use std::path::Path;

pub fn initialize_database(path: &Path, key: &MasterKey) -> Result<Connection> {
    let conn = Connection::open(path)?;

    let key_hex = hex::encode(key.key);

    conn.pragma_update(None, "key", &format!("x'{}'", key_hex))?;

    conn.execute_batch(include_str!("../migrations/schema.sql"))?;

    Ok(conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::security::{derive_key_from_password, generate_salt};
    use std::fs;

    #[test]
    fn test_encypted_db_flow() {
        let db_path = std::env::temp_dir().join("test.db");

        if db_path.exists() {
            fs::remove_file(&db_path).unwrap();
        }

        let salt = generate_salt();
        let real_key = derive_key_from_password("senha_correta", &salt).unwrap();

        {
            let conn = initialize_database(&db_path, &real_key);
            assert!(conn.is_ok(), "Deveria criar o banco com a chave secreta");
        }

        let wrong_salt = generate_salt();
        let wrong_key = derive_key_from_password("senha_correta", &wrong_salt).unwrap();

        let result = initialize_database(&db_path, &wrong_key);
        assert!(
            result.is_err(),
            "Deveria falhar ao abrir com a chave errada"
        );
    }
}
