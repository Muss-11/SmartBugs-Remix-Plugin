import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Cartella dove vengono salvati temporaneamente i contratti ricevuti dal frontend.
// In Fase 3 sarà questa la cartella montata nel container Docker di SmartBugs.
const TEMP_DIR = path.resolve("temp");

async function ensureTempDir() {
  await mkdir(TEMP_DIR, { recursive: true });
}

/**
 * Ripulisce il nome del file originale da caratteri non sicuri per il filesystem,
 * mantenendo solo lettere, numeri, underscore e trattini.
 */
function sanitizeBaseName(originalPath) {
  const base = path.basename(originalPath, path.extname(originalPath));
  const cleaned = base.replace(/[^a-zA-Z0-9_-]/g, "_");
  return cleaned || "contract";
}

/**
 * Salva il contenuto Solidity ricevuto in un nuovo file con nome univoco,
 * cosi' da poter gestire piu' analisi in parallelo senza sovrascritture.
 *
 * @param {string} originalPath - path originale del file cosi' come su Remix (usato solo per il nome)
 * @param {string} content - contenuto sorgente del contratto
 * @returns {Promise<{ filename: string, filePath: string }>}
 */
export async function saveSolidityFile(originalPath, content) {
  await ensureTempDir();

  const baseName = sanitizeBaseName(originalPath);
  const uniqueId = randomUUID().slice(0, 8);
  const filename = `${baseName}-${uniqueId}.sol`;
  const filePath = path.join(TEMP_DIR, filename);

  await writeFile(filePath, content, "utf-8");

  return { filename, filePath };
}

export { TEMP_DIR };
