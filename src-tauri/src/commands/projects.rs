use crate::models::Project;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn create_project(
    state: State<'_, AppState>,
    name: String,
    description: Option<String>,
) -> Result<i64, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    conn.execute(
        "INSERT INTO projects (name, description) VALUES (?1, ?2)",
        (name, description),
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
pub fn get_all_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    let mut stmt = conn
        .prepare("SELECT id, name, description, created_at FROM projects WHERE deleted_at IS NULL ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let projects_iter = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                deleted_at: None,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    for project in projects_iter {
        projects.push(project.map_err(|e| e.to_string())?);
    }

    Ok(projects)
}

#[tauri::command]
pub fn get_deleted_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    let mut stmt = conn
        .prepare("SELECT id, name, description, created_at, deleted_at FROM projects WHERE deleted_at IS NOT NULL ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let projects_iter = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                deleted_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    for project in projects_iter {
        projects.push(project.map_err(|e| e.to_string())?);
    }

    Ok(projects)
}

#[tauri::command]
pub fn get_project(state: State<'_, AppState>, id: i64) -> Result<Project, String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    let project = conn
        .query_row(
            "SELECT id, name, description, created_at FROM projects WHERE id = ?1",
            [id],
            |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    created_at: row.get(3)?,
                    deleted_at: None,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(project)
}

#[tauri::command]
pub fn update_project(
    state: State<'_, AppState>,
    id: i64,
    name: String,
    description: Option<String>,
) -> Result<(), String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2 WHERE id = ?3",
        (name, description, id),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn soft_delete_project(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let mut lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_mut().ok_or("Cofre fechado! Faça login primeiro.")?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Passo 1: "Soltar" os segredos (Setar project_id = NULL)
    // Isso é redundante se o banco suportar e estiver com PRAGMA foreign_keys = ON,
    // mas é uma segurança extra essencial em SQLite embutido.
    tx.execute(
        "UPDATE secrets SET project_id = NULL WHERE project_id = ?1",
        [id],
    )
    .map_err(|e| e.to_string())?;

    // Passo 2: Soft deletar o projeto
    tx.execute(
        "UPDATE projects SET deleted_at = ?1 WHERE id = ?2",
        (chrono::Utc::now().to_rfc3339(), id),
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_project(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let mut lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_mut().ok_or("Cofre fechado! Faça login primeiro.")?;

    // Iniciamos uma transação para garantir atomicidade
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Passo 1: "Soltar" os segredos (Setar project_id = NULL)
    // Isso é redundante se o banco suportar e estiver com PRAGMA foreign_keys = ON,
    // mas é uma segurança extra essencial em SQLite embutido.
    tx.execute(
        "UPDATE secrets SET project_id = NULL WHERE project_id = ?1",
        [id],
    )
    .map_err(|e| e.to_string())?;

    // Passo 2: Deletar o projeto
    tx.execute("DELETE FROM projects WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn restore_project(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let lock = state.db.lock().map_err(|_| "Falha no Mutex".to_string())?;
    let conn = lock.as_ref().ok_or("Cofre fechado! Faça login primeiro.")?;

    conn.execute("UPDATE projects SET deleted_at = NULL WHERE id = ?", [id])
        .map_err(|e| format!("Erro ao restaurar projeto: {}", e))?;

    Ok(())
}
