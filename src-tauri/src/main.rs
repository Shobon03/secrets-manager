// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(any(target_os = "linux", target_os = "freebsd"))]
    {
        if std::env::var("GTK_USE_PORTAL").is_err() {
            std::env::set_var("GTK_USE_PORTAL", "1");
        }
    }

    secrets_manager_lib::run()
}
