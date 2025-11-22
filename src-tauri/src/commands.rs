use crate::database::initialize_database;
use crate::security::{derive_key_from_password, generate_salt};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Serialize, Deserialize)]
pub struct Secret {
    pub id: i32,
    pub title: String,
    pub username: String,
    pub password: String,
}

pub struct AppState {
    pub db: Mutex<Option<Connection>>,
}

fn get_meta_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }

    Ok(app_dir.join("vault.meta"))
}

fn get_db_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(app_dir.join("vault.db"))
}

#[tauri::command]
pub fn check_vault_status(app_handle: AppHandle) -> Result<bool, String> {
    let meta_path = get_meta_path(&app_handle)?;
    Ok(meta_path.exists())
}

#[tauri::command]
pub fn setup_vault(
    password: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let meta_path = get_meta_path(&app_handle)?;

    if meta_path.exists() {
        return Err("Um cofre já existe neste computador.".to_string());
    }

    let salt = generate_salt();

    fs::write(&meta_path, &salt).map_err(|e| format!("Erro ao salvar meta: {}", e))?;

    let db_path = get_db_path(&app_handle)?;
    if db_path.exists() {
        println!("Limpando banco de dados antigo em {:?}", db_path);
        fs::remove_file(&db_path).map_err(|e| format!("Erro ao limpar banco: {}", e))?;
    }

    let key = derive_key_from_password(&password, &salt).map_err(|e| e.to_string())?;

    let conn =
        initialize_database(&db_path, &key).map_err(|e| format!("Erro ao criar banco: {}", e))?;

    *state.db.lock().map_err(|_| "Falha no Mutex".to_string())? = Some(conn);

    Ok("Cofre criado com sucesso!".to_string())
}

#[tauri::command]
pub fn unlock_vault(
    password: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let meta_path = get_meta_path(&app_handle)?;

    if !meta_path.exists() {
        return Err("Nenhum cofre encontrado. Crie um primeiro.".to_string());
    }

    let salt =
        fs::read_to_string(&meta_path).map_err(|_| "Erro ao ler arquivo de salt".to_string())?;

    let key = derive_key_from_password(&password, &salt).map_err(|e| e.to_string())?;

    let db_path = get_db_path(&app_handle)?;
    let conn = initialize_database(&db_path, &key)
        .map_err(|e| format!("Senha incorreta ou erro no banco: {}", e))?;

    *state.db.lock().map_err(|_| "Falha no Mutex".to_string())? = Some(conn);

    Ok("Cofre aberto!".to_string())
}

#[tauri::command]
pub fn create_secret(
    title: String,
    username: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    conn.execute(
        "INSERT INTO secrets (title, username, password_blob) VALUES (?1, ?2, ?3)",
        (title, username, password.as_bytes()),
    )
    .map_err(|e| format!("Erro ao salvar segredo: {}", e))?;

    Ok("Segredo salvo!".to_string())
}

#[tauri::command]
pub fn get_all_secrets(state: State<'_, AppState>) -> Result<Vec<Secret>, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    let mut stmt = conn
        .prepare("SELECT id, title, username, password_blob FROM secrets")
        .map_err(|e| format!("Erro ao obter secretos: {}", e))?;

    let secrets_iter = stmt
        .query_map([], |row| {
            let pass_blob: Vec<u8> = row.get(3)?;
            let pass_str = String::from_utf8(pass_blob).unwrap_or_default();

            Ok(Secret {
                id: row.get(0)?,
                title: row.get(1)?,
                username: row.get(2)?,
                password: pass_str,
            })
        })
        .map_err(|e| format!("Erro ao obter secretos: {}", e))?;

    let mut secrets = Vec::new();
    for secret in secrets_iter {
        secrets.push(secret.map_err(|e| e.to_string())?);
    }

    Ok(secrets)
}

#[tauri::command]
pub fn delete_secret(id: i32, state: State<'_, AppState>) -> Result<String, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    conn.execute("DELETE FROM secrets WHERE id = ?", (id,))
        .map_err(|e| format!("Erro ao deletar segredo: {}", e))?;

    Ok("Segredo deletado!".to_string())
}

#[tauri::command]
pub fn update_secret(
    id: i32,
    title: String,
    username: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    conn.execute(
        "UPDATE secrets SET title = ?1, username = ?2, password_blob = ?3 WHERE id = ?4",
        (title, username, password.as_bytes(), id),
    )
    .map_err(|e| format!("Erro ao atualizar segredo: {}", e))?;

    Ok("Segredo atualizado!".to_string())
}
