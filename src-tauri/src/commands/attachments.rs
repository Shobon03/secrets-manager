use crate::{models::AttachmentMetadata, state::AppState};
use tauri::State;

#[tauri::command]
pub fn add_attachment(
    state: State<'_, AppState>,
    secret_id: i64,
    filename: String,
    mime_type: String,
    content: Vec<u8>,
) -> Result<AttachmentMetadata, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    let file_size = content.len() as i64;

    conn.execute(
        "INSERT INTO attachments (secret_id, filename, mime_type, file_size, content) VALUES (?1, ?2, ?3, ?4, ?5)",
        (secret_id, filename.clone(), mime_type.clone(), file_size, content),
    )
    .map_err(|e| format!("Erro ao salvar arquivo: {}", e))?;

    let id = conn.last_insert_rowid();

    Ok(AttachmentMetadata {
        id,
        secret_id,
        filename,
        mime_type,
        file_size,
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn get_attachments_metadata(
    state: State<'_, AppState>,
    secret_id: i64,
) -> Result<Vec<AttachmentMetadata>, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    let mut stmt = conn.prepare(
        "SELECT id, secret_id, filename, mime_type, file_size, created_at FROM attachments WHERE secret_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| format!("Erro ao buscar arquivos: {}", e))?;

    let rows = stmt
        .query_map([secret_id], |row| {
            Ok(AttachmentMetadata {
                id: row.get(0)?,
                secret_id: row.get(1)?,
                filename: row.get(2)?,
                mime_type: row.get(3)?,
                file_size: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| format!("Erro ao buscar arquivos: {}", e))?;

    let mut attachments = Vec::new();
    for row in rows {
        attachments.push(row.map_err(|e| e.to_string())?);
    }

    Ok(attachments)
}

#[tauri::command]
pub fn get_attachment_content(
    state: State<'_, AppState>,
    attachment_id: i64,
) -> Result<Vec<u8>, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    let content: Vec<u8> = conn
        .query_row(
            "SELECT content FROM attachments WHERE id = ?1",
            [attachment_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(content)
}

#[tauri::command]
pub fn delete_attachment(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    conn.execute("DELETE FROM attachments WHERE id = ?1", (id,))
        .map_err(|e| e.to_string())?;

    Ok(())
}
