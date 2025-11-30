use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn empty_trash(state: State<'_, AppState>) -> Result<String, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    conn.execute("DELETE FROM secrets WHERE deleted_at IS NOT NULL", ())
        .map_err(|e| format!("Erro ao deletar segredos: {}", e))?;

    conn.execute("DELETE FROM projects WHERE deleted_at IS NOT NULL", ())
        .map_err(|e| format!("Erro ao deletar projetos: {}", e))?;

    Ok("Lixeira vazia!".to_string())
}
