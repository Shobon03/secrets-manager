import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";

export default function App() {
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	async function handleUnlock(e: React.FormEvent) {
		e.preventDefault();
		if (!password) return;

		setIsLoading(true);
		setStatus("Verificando criptografia...");

		try {
			const response = await invoke("unlock_vault", { password });
			setStatus(response as string);
		} catch (error) {
			console.error(error);
			setStatus(`Erro: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<main className="container">
			<h1>🔐 Cofre Local</h1>

			<p>Digite sua Senha Mestra para descriptografar o banco de dados.</p>

			<form className="row" onSubmit={handleUnlock}>
				<input
					id="greet-input"
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Senha Mestra..."
					type="password"
					disabled={isLoading}
				/>
				<button type="submit" disabled={isLoading}>
					{isLoading ? "Descriptografando..." : "Abrir Cofre"}
				</button>
			</form>

			<p>{status}</p>
		</main>
	);
}
