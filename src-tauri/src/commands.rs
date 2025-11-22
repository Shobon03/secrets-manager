use crate::database::initialize_database;
use crate::security::{derive_key_from_password, generate_salt};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;
use tauri::State;

pub struct AppState {
    pub db: Mutex<Option<Connection>>,
}

#[tauri::command]
pub fn unlock_vault(
    password: String,
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    println!("Tentativa de desbloqueio recebida...");

    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }

    let db_path = app_dir.join("vault.db");

    let temp_salt = "c29tZXN1cGVycmFuZG9tc2FsdA";

    let key = derive_key_from_password(&password, &temp_salt).map_err(|e| e.to_string())?;

    let conn = initialize_database(&db_path, &key)
        .map_err(|e| format!("Senha incorreta o banco corrompido: {}", e))?;

    let mut db_guard = state
        .db
        .lock()
        .map_err(|_| "Falha ao acessar estado global".to_string())?;
    *db_guard = Some(conn);

    Ok("Cofre desbloqueado com sucesso!".to_string())
}
