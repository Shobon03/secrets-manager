use crate::commands::secrets::get_all_secrets;
use crate::database::initialize_database;
use crate::models::Secret;
use crate::security::{decrypt_data, derive_key_from_password, encrypt_data, generate_salt};
use crate::state::AppState;
use crate::utils::{get_db_path, get_meta_path};
use std::fs;
use std::fs::File;
use std::io::Write;
use tauri::{AppHandle, State};

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
        .map_err(|_| "Senha incorreta".to_string())?;

    *state.db.lock().map_err(|_| "Falha no Mutex".to_string())? = Some(conn);

    Ok("Cofre aberto!".to_string())
}

#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) -> Result<String, String> {
    let mut db_guard = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;

    *db_guard = None;

    Ok("Cofre trancado.".to_string())
}

#[tauri::command]
pub fn export_vault(
    file_path: String,
    password: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let meta_path = get_meta_path(&app_handle)?;
    let salt = fs::read_to_string(&meta_path).map_err(|_| "Erro ao ler salt".to_string())?;

    let key = derive_key_from_password(&password, &salt).map_err(|e| e.to_string())?;

    let secrets = get_all_secrets(state)?;
    let json_data =
        serde_json::to_string(&secrets).map_err(|e| format!("Erro ao gerar JSON: {}", e))?;

    let encrypted_bytes = encrypt_data(&json_data, &key).map_err(|e| e.to_string())?;

    let mut file = File::create(file_path).map_err(|e| e.to_string())?;
    file.write_all(&encrypted_bytes)
        .map_err(|e| e.to_string())?;

    Ok("Backup exportado com sucesso!".to_string())
}

#[tauri::command]
pub fn import_vault(
    file_path: String,
    password: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let encrypted_bytes =
        fs::read(&file_path).map_err(|e| format!("Erro ao ler arquivo: {}", e))?;
    let meta_path = get_meta_path(&app_handle)?;
    let salt = fs::read_to_string(&meta_path).map_err(|_| "Erro ao ler salt".to_string())?;
    let key = derive_key_from_password(&password, &salt).map_err(|e| e.to_string())?;

    let json_string = decrypt_data(&encrypted_bytes, &key).map_err(|e| e.to_string())?;
    let imported_secrets: Vec<Secret> =
        serde_json::from_str(&json_string).map_err(|e| format!("Backup inválido: {}", e))?;

    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    let mut existing_entries = Vec::new();

    let mut stmt = conn
        .prepare("SELECT title, username, password_blob FROM secrets")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let pass_blob: Vec<u8> = row.get(2)?;
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                String::from_utf8(pass_blob).unwrap_or_default(),
            ))
        })
        .map_err(|e| e.to_string())?;

    for r in rows {
        existing_entries.push(r.map_err(|e| e.to_string())?);
    }

    let mut inserted_count = 0;
    let mut skipped_count = 0;

    for secret in imported_secrets {
        let already_exists = existing_entries
            .iter()
            .any(|(t, u, p)| *t == secret.title && *u == secret.username && *p == secret.password);

        if already_exists {
            skipped_count += 1;
            continue;
        }

        conn.execute(
            "INSERT INTO secrets (title, username, password_blob) VALUES (?1, ?2, ?3)",
            (secret.title, secret.username, secret.password.as_bytes()),
        )
        .map_err(|e| e.to_string())?;

        inserted_count += 1;
    }

    Ok(format!(
        "Importação concluída: {} novos, {} ignorados",
        inserted_count, skipped_count
    ))
}
