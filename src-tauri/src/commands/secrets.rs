use crate::models::Secret;
use crate::state::AppState;
use tauri::State;

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
