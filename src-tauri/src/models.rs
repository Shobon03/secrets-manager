use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Secret {
    pub id: i64,
    pub title: String,
    pub username: String,
    pub project_id: Option<i64>,
    pub password: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentMetadata {
    pub id: i64,
    pub secret_id: i64,
    pub filename: String,
    pub mime_type: String,
    pub file_size: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Attachment {
    pub id: Option<i64>,
    pub secret_id: i64,
    pub filename: String,
    pub mime_type: String,
    pub file_size: i64,
    pub content: Vec<u8>,
}
