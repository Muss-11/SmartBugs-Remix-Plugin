import { createClient } from "@remixproject/plugin-webview";

/**
 * Istanza singleton del client del plugin.
 * Viene creata una sola volta e riutilizzata in tutta l'app.
 */
const client = createClient();

/**
 * Attende che il plugin sia caricato e connesso a Remix IDE.
 * Da chiamare una volta sola, tipicamente in un useEffect al mount di App.
 *
 * @returns {Promise<void>}
 * @throws se la connessione con Remix fallisce
 */
export async function connectToRemix() {
  await client.onload();
}

/**
 * Recupera il path del file attualmente aperto/attivo nell'editor di Remix.
 *
 * @returns {Promise<string|null>} path del file, o null se nessun file è aperto
 */
export async function getCurrentFilePath() {
  try {
    const path = await client.call("fileManager", "getCurrentFile");
    return path || null;
  } catch (error) {
    // Remix rigetta la chiamata (invece di restituire null/undefined)
    // quando non c'è nessun file attualmente aperto nell'editor.
    console.debug("getCurrentFile ha fallito, presumo nessun file aperto:", error);
    return null;
  }
}

/**
 * Legge il contenuto testuale di un file dal file system di Remix.
 *
 * @param {string} path - path del file da leggere (es. "contracts/MyContract.sol")
 * @returns {Promise<string>} contenuto del file
 */
export async function readFileContent(path) {
  return client.call("fileManager", "readFile", path);
}

/**
 * Estrae il codice sorgente del contratto Solidity attualmente aperto in Remix.
 * Combina getCurrentFilePath + readFileContent e valida che il file sia .sol.
 *
 * @returns {Promise<{ path: string, content: string }>}
 * @throws {Error} se non c'è nessun file aperto o non è un file .sol
 */
export async function extractCurrentSolidityFile() {
  const path = await getCurrentFilePath();

  if (!path) {
    throw new Error("NO_FILE_OPEN");
  }

  if (!path.endsWith(".sol")) {
    throw new Error("NOT_SOLIDITY_FILE");
  }

  const content = await readFileContent(path);
  return { path, content };
}

export default client;
