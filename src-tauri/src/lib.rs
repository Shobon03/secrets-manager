pub mod commands;
pub mod database;
pub mod security;

use commands::AppState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            db: Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![commands::unlock_vault])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
