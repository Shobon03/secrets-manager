use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Secret {
    pub id: i32,
    pub title: String,
    pub username: String,
    pub password: String,
}
