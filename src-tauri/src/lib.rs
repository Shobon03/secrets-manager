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
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::unlock_vault,
            commands::setup_vault,
            commands::check_vault_status,
            commands::get_all_secrets,
            commands::create_secret,
            commands::delete_secret,
            commands::update_secret,
            commands::lock_vault,
            commands::export_vault,
            commands::import_vault
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
