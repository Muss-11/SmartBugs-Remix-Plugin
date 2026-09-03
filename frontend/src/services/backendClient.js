// URL del backend locale. In futuro puo' essere spostato in una variabile
// d'ambiente (import.meta.env.VITE_BACKEND_URL) se serve puntare ad ambienti diversi.
const BACKEND_URL = "http://localhost:4000";

/**
 * Invia il codice sorgente Solidity estratto da Remix al backend,
 * che lo salva in un file temporaneo pronto per l'analisi SmartBugs.
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
    const message =
      data?.message || "Errore durante l'invio del file al backend.";
    throw new Error(message);
  }

  return data;
}

/**
 * Avvia l'analisi SmartBugs su un file già salvato dal backend (via sendContractToBackend).
 * Può richiedere da qualche secondo a diversi minuti: il chiamante dovrebbe
 * mostrare uno stato di caricamento per tutta la durata della chiamata.
 *
 * @param {string} filename - nome file restituito da sendContractToBackend
 * @param {string} [tool] - tool SmartBugs da usare (default: quello configurato nel backend)
 * @returns {Promise<{ runId: string, resultsDir: string, findings: object|null, message: string }>}
 * @throws {Error} se il backend non è raggiungibile o l'analisi fallisce
 */
export async function analyzeContract(filename, tool) {
  const response = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, tool }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || "Errore durante l'analisi SmartBugs.";
    throw new Error(message);
  }

  return data;
}
