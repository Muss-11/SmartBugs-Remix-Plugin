// URL del backend locale. In futuro puo' essere spostato in una variabile
// d'ambiente (import.meta.env.VITE_BACKEND_URL) se serve puntare ad ambienti diversi.
const BACKEND_URL = "http://localhost:4000";

/**
 * Invia il codice sorgente Solidity estratto da Remix al backend,
 * che lo salva in un file temporaneo pronto per l'analisi SmartBugs (Fase 3).
 *
 * @param {string} path - path originale del file in Remix
 * @param {string} content - contenuto sorgente del contratto
 * @returns {Promise<{ filename: string, filePath: string }>}
 * @throws {Error} se il backend non è raggiungibile o rifiuta la richiesta
 */
export async function sendContractToBackend(path, content) {
  const response = await fetch(`${BACKEND_URL}/api/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || "Errore durante l'invio del file al backend.";
    throw new Error(message);
  }

  return data;
}
