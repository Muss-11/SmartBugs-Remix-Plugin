import { createClient } from "@remixproject/plugin-webview";

const client = createClient();

export async function connectToRemix() {
  await client.onload();
}

export async function getCurrentFilePath() {
  try {
    const path = await client.call("fileManager", "getCurrentFile");
    return path || null;
  } catch (error) {
    console.debug(
      "getCurrentFile ha fallito, presumo nessun file aperto:",
      error,
    );
    return null;
  }
}

export async function readFileContent(path) {
  return client.call("fileManager", "readFile", path);
}

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

/**
 * Evidenzia una riga specifica nell'editor di Remix.
 *
 * @param {string} filePath - Il percorso del file attualmente aperto
 * @param {number} line - Il numero di riga restituito da SmartBugs (1-indexed)
 * @param {string} impact - La severità del bug per scegliere il colore
 */
export async function highlightCode(filePath, line, impact) {
  if (!filePath || line == null) return;

  // L'editor di Remix è 0-indexed (la riga 1 è l'indice 0)
  const remixLine = line > 0 ? line - 1 : 0;

  const position = {
    start: { line: remixLine, column: 0 },
    end: { line: remixLine, column: 100 }, // un valore alto per prendere tutta la riga
  };

  // Mappiamo la severità a un colore esadecimale (trasparente per non coprire il testo)
  const colors = {
    High: "#ff808066", // Rosso trasparente
    Medium: "#ffcc8066", // Arancione trasparente
    Low: "#ffff8066", // Giallo trasparente
    Informational: "#80d4ff66", // Azzurro trasparente
    Optimization: "#80ff8066", // Verde trasparente
  };

  const color = colors[impact] || "#ffffff66";

  try {
    // Prima rimuove eventuali evidenziazioni precedenti per non fare confusione
    await client.call("editor", "discardHighlight");
    // Poi applica il nuovo highlight
    await client.call("editor", "highlight", position, filePath, color);
  } catch (error) {
    console.error("Errore durante l'highlighting:", error);
  }
}

/**
 * Rimuove tutte le evidenziazioni dall'editor.
 */
export async function clearHighlight() {
  try {
    await client.call("editor", "discardHighlight");
  } catch (error) {
    console.error("Errore durante la pulizia dell'highlight:", error);
  }
}
