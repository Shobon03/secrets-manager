# 🔒 Secrets Manager

Um gerenciador de segredos **Local-First**, desenvolvido com foco em segurança máxima, performance e uma experiência de usuário moderna. Construído sobre a robustez do **Rust** e a flexibilidade do **React**.

![Status](https://img.shields.io/badge/Status-MVP%20Functional-success)
![Security](https://img.shields.io/badge/Security-AES--256%20%2B%20Argon2id-blue)
![Stack](https://img.shields.io/badge/Stack-Tauri%20v2%20%7C%20Rust%20%7C%20React%2019-orange)

## ✨ Funcionalidades

### 🛡️ Segurança & Core

- **Criptografia de Ponta-a-Ponta (Local):** Banco de dados SQLite inteiramente criptografado com **SQLCipher** (AES-256).
- **Autenticação Robusta:** Derivação de chaves usando **Argon2id** com salt aleatório por usuário.
- **Zero-Knowledge Architecture:** A senha mestre nunca é salva em disco; ela apenas deriva a chave para abrir o cofre na memória.
- **Auto-Lock:** O cofre se tranca automaticamente após inatividade (Hook `useAutoLock`).
- **Limpeza de Memória:** Uso da crate `zeroize` para limpar segredos da RAM quando não utilizados.

### 🚀 Funcionalidades do Usuário

- **CRUD de Segredos:** Gerencie Títulos, Usuários, Senhas e URLs.
- **Anexos Seguros (Novo):** Upload de arquivos (chaves SSH, certificados, imagens) criptografados via BLOB dentro do banco.
<!--- **Drag & Drop Nativo:** Arraste arquivos diretamente do sistema operacional (Linux/Windows) para o cofre.-->
- **Importação/Exportação:** Backup seguro em JSON criptografado (AES-GCM).
- **UI Moderna:** Interface limpa com Dark Mode nativo, construída com **Shadcn/UI** e **Tailwind CSS v4**.

---

## 🛠️ Tech Stack

### Backend (Rust / Tauri v2)

- **Framework:** [Tauri v2](https://v2.tauri.app/) (Beta/RC)
- **Database:** `rusqlite` com feature `bundled-sqlcipher` (Static linking).
- **Crypto:** `argon2`, `aes-gcm`, `rand`.

### Frontend (React Ecosystem)

- **Framework:** React 19 + TypeScript + Vite.
- **Estilização:** Tailwind CSS v4.
- **Componentes:** [Shadcn/UI](https://ui.shadcn.com/) (Radix Primitives).
- **Gerenciamento de Estado:** React Hook Form + Zod.
- **Utils:** Lucide React (Ícones), Sonner (Toasts).
- **Package Manager:** Bun.

---

## 🏗️ Estrutura do Projeto

O projeto segue uma arquitetura modular para escalabilidade:

```text
src-tauri/
├── src/
│   ├── commands/              # Lógica de negócios exposta ao Frontend
│   │   ├── secrets.rs         # CRUD de senhas
│   │   ├── attachments.rs     # Upload/Download de arquivos
│   │   └── mod.rs
│   ├── main.rs                # Entrada principal do aplicativo
│   ├── models.rs              # Structs e Tipos (DTOs)
│   ├── database.rs            # Conexão e configuração do SQLCipher
│   ├── state.rs               # Gerenciamento de Estado Global (Mutex)
│   ├── utils.rs               # Helpers de Sistema de Arquivos
│   ├── lib.rs                 # Registro de plugins e comandos
│   └── security.ts            # Funções de segurança
├── migrations/                # Scripts SQL embutidos no binário
│   └── schema.sql
```

```text
src/
├── routes/     # Páginas principais da aplicação
├── components/ # Componentes reutilizáveis
│   └── ui/     # Primitivos do Shadcn/UI
├── hooks/      # Custom Hooks
├── types/      # Definições de tipos TypeScript
├── lib/        # Utilitários e helpers
├── assets/     # Recursos estáticos
│   ├── css/    # CSS (Tailwind)
│   └── fonts/  # Fontes
├── App.tsx     # Aplicação principal
└── main.tsx    # Entrada principal do aplicativo
```

## 🚀 Como Rodar

### Pré-requisitos

- **Rust:** `cargo` (versão 1.75+ recomendada).
- **Node/Bun:** `bun` instalado.
- **Dependências de Sistema:**
  - _Linux (Fedora):_ `webkit2gtk4.1-devel`, `openssl-devel`, `libappindicator-gtk3-devel`.
  - _Windows:_ WebView2 (já vem no W10/11) e Build Tools do C++.

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/Shobon03/secrets-manager.git
cd secrets-manager
```

2. Instale as dependências do Frontend:

```bash
bun install
```

3. Rode em modo de desenvolvimento:

```bash
bun tauri dev
```

_Isso irá compilar o Rust (pode demorar na primeira vez) e abrir a janela do aplicativo._

---

## 🛣️ Roadmap

- [x] MVP (CRUD + Auth)
- [x] Criptografia de Arquivos (Anexos)
- [x] Auto-Lock por inatividade
- [ ] **Grupos/Projetos:** Organização de secrets em pastas.
- [ ] **TOTP:** Geração de códigos 2FA nativos com timer visual.
- [ ] **Pesquisa Global:** Busca rápida (Fuzzy Search).
- [ ] **Configurações:** Painel de preferências do usuário.
- [ ] **Multiplos arquivos de cofres:** Suporte para múltiplos cofres (compartilhamento de senhas).

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

> **Aviso de Segurança:** Atualmente este é um projeto pessoal/educacional. Embora utilize bibliotecas criptográficas padrão da indústria (Argon2, SQLCipher), recomenda-se auditoria antes de uso em ambientes corporativos críticos.
