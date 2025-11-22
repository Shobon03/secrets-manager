use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use zeroize::{Zeroize, ZeroizeOnDrop};

type Result<T> = std::result::Result<T, String>;

#[derive(Zeroize, ZeroizeOnDrop)]
pub struct MasterKey {
    pub key: [u8; 32], // 32 bytes
}

pub fn generate_salt() -> String {
    let salt = SaltString::generate(&mut OsRng);
    salt.as_str().to_string()
}

pub fn derive_key_from_password(password: &str, salt_str: &str) -> Result<MasterKey> {
    let argon2 = Argon2::default();

    let salt = SaltString::from_b64(salt_str).map_err(|e| format!("Erro ao ler salt: {}", e))?;

    let mut key_buffer = [0u8; 32];

    argon2
        .hash_password_into(
            password.as_bytes(),
            salt.as_str().as_bytes(),
            &mut key_buffer,
        )
        .map_err(|e| format!("Erro ao derivar chave: {}", e))?;

    Ok(MasterKey { key: key_buffer })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_derivation_works() {
        let password = "minha_senha";
        let salt = generate_salt();
        println!("Salt gerado: {}", salt);

        let result = derive_key_from_password(password, &salt);

        assert!(result.is_ok());
        let master_key = result.unwrap();

        assert_ne!(master_key.key, [0u8; 32]);

        println!("Chave derivada com sucesso!");
    }

    #[test]
    fn test_same_password_same_salt_equals_same_key() {
        let password = "minha_senha";
        let salt = generate_salt();

        let k1 = derive_key_from_password(password, &salt).unwrap();
        let k2 = derive_key_from_password(password, &salt).unwrap();

        assert_eq!(k1.key, k2.key);
    }
}
