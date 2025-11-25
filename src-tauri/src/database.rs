use crate::security::MasterKey;
use include_dir::{include_dir, Dir};
use rusqlite::{Connection, Result};
use std::path::Path;

static MIGRATIONS_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/migrations");

struct Migration<'a> {
    version: i32,
    sql: &'a str,
}

pub fn initialize_database(path: &Path, key: &MasterKey) -> Result<Connection> {
    let mut conn = Connection::open(path)?;

    let key_hex = hex::encode(key.key);
    conn.pragma_update(None, "key", &format!("x'{}'", key_hex))?;

    conn.pragma_update(None, "foreign_keys", "ON")?;

    run_migrations(&mut conn)?;

    #[cfg(debug_assertions)]
    {
        // run_seed(&mut conn).map_err(|e| e.to_string())?;
    }

    Ok(conn)
}

fn run_migrations(conn: &mut Connection) -> Result<()> {
    let mut migrations: Vec<Migration> = MIGRATIONS_DIR
        .files()
        .filter_map(|file| {
            let name = file.path().file_name()?.to_str()?;

            if !name.ends_with(".sql") {
                return None;
            }

            let version_part = name.split("_").next()?;
            let version = version_part.parse::<i32>().ok()?;

            let sql = file.contents_utf8()?;

            Some(Migration { version, sql })
        })
        .collect();

    migrations.sort_by_key(|m| m.version);

    let mut current_version: i32 = conn.query_row("PRAGMA user_version", [], |row| row.get(0))?;
    println!("Versão atual do banco: {}", current_version);

    let tx = conn.transaction()?;

    for migration in migrations {
        if current_version < migration.version {
            println!("Aplicando migration versão: {}", migration.version);

            tx.execute_batch(migration.sql)?;

            current_version = migration.version;
            tx.pragma_update(None, "user_version", &current_version)?;
        }
    }

    tx.commit()?;

    println!(
        "Banco de dados atualizado para a versão: {}",
        current_version
    );

    Ok(())
}

fn run_seed(conn: &mut Connection) -> Result<()> {
    let sql = include_str!("../migrations/seed.sql");

    println!("Executando seed");

    conn.execute_batch(sql)?;

    println!("Seed executado");

    Ok(())
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
