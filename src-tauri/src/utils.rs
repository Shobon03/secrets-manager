use std::{env, fs, path::PathBuf};

fn get_vaults_dir() -> Result<PathBuf, String> {
    let home_dir = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map_err(|_| "Não foi possível determinar o diretório home")?;

    let vaults_dir = PathBuf::from(home_dir)
        .join(".secrets-manager")
        .join("vaults");

    if !vaults_dir.exists() {
        fs::create_dir_all(&vaults_dir).map_err(|e| format!("Erro ao criar diretório: {}", e))?;
    }

    Ok(vaults_dir)
}

pub fn get_meta_path() -> Result<PathBuf, String> {
    let vaults_dir = get_vaults_dir()?;
    Ok(vaults_dir.join("vault.meta"))
}

pub fn get_db_path() -> Result<PathBuf, String> {
    let vaults_dir = get_vaults_dir()?;
    Ok(vaults_dir.join("vault.db"))
}
