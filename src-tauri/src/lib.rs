mod commands;

pub mod database;
pub mod models;
pub mod security;
pub mod state;
pub mod utils;

use commands::{attachments, projects, secrets, trash, vaults};

use state::AppState;
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
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            vaults::unlock_vault,
            vaults::setup_vault,
            vaults::check_vault_status,
            vaults::lock_vault,
            vaults::export_vault,
            vaults::import_vault,
            secrets::get_all_secrets,
            secrets::get_deleted_secrets,
            secrets::create_secret,
            secrets::soft_delete_secret,
            secrets::delete_secret,
            secrets::restore_secret,
            secrets::update_secret,
            attachments::add_attachment,
            attachments::get_attachments_metadata,
            attachments::get_attachment_content,
            attachments::delete_attachment,
            projects::create_project,
            projects::get_all_projects,
            projects::get_deleted_projects,
            projects::get_project,
            projects::update_project,
            projects::soft_delete_project,
            projects::delete_project,
            projects::restore_project,
            trash::empty_trash,
        ])
        .on_page_load(|webview, _payload| {
            // Desabilita menu de contexto apenas em produção
            #[cfg(not(debug_assertions))]
            {
                let _ = webview
                    .eval("window.addEventListener('contextmenu', (e) => e.preventDefault());");
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
