import { spawn } from "child_process";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { TEMP_DIR } from "../utils/tempFile.js";

// "smartbugs" raggiungibile dal PATH.
const SMARTBUGS_CMD = process.env.SMARTBUGS_CMD || "smartbugs";

// Cartella da cui lanciare il comando, se richiesto
// (es. se smartbugs va eseguito come ./smartbugs dalla cartella di installazione).
// Non impostata, il comando viene lanciato dalla cwd del processo Node.
const SMARTBUGS_CWD = process.env.SMARTBUGS_CWD || undefined;

const DEFAULT_TOOL = process.env.SMARTBUGS_TOOL || "slither";

const DEFAULT_TIMEOUT_SECONDS = Number(process.env.SMARTBUGS_TIMEOUT || 120);

// Cartella dove SmartBugs scriverà i risultati grezzi di ogni run.
const RESULTS_DIR = path.resolve("results");

/**
 * Cerca ricorsivamente un file chiamato "result.json" dentro una cartella.
 *
 * @param {string} dir
 * @returns {Promise<string|null>} path assoluto del file trovato, o null
 */
async function findResultJson(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findResultJson(fullPath);
      if (found) return found;
    } else if (entry.name === "result.json") {
      return fullPath;
    }
  }
  return null;
}

/**
 * Esegue SmartBugs su un file .sol già salvato in TEMP_DIR e attende il completamento.
 *
 * @param {string} filename - nome del file dentro TEMP_DIR (quello restituito da saveSolidityFile)
 * @param {object} [options]
 * @param {string} [options.tool] - tool SmartBugs da usare (default: slither)
 * @param {number} [options.timeoutSeconds] - timeout in secondi per l'analisi
 * @returns {Promise<{ runId: string, resultsDir: string, stdout: string, stderr: string }>}
 * @throws {Error} se il comando non parte (es. SMARTBUGS_CMD errato) o SmartBugs termina con errore
 */
export function runSmartBugsAnalysis(filename, options = {}) {
  const tool = options.tool || DEFAULT_TOOL;
  const timeoutSeconds = options.timeoutSeconds || DEFAULT_TIMEOUT_SECONDS;

  const filePath = path.join(TEMP_DIR, filename);
  const runId = randomUUID().slice(0, 8);
  const runResultsDir = path.join(RESULTS_DIR, runId);

  const args = [
    "-t",
    tool,
    "-f",
    filePath,
    "--timeout",
    String(timeoutSeconds),
    "--results",
    runResultsDir,
    "--json", // senza questo flag SmartBugs NON scrive result.json
  ];

  return new Promise((resolve, reject) => {
    // Su Windows, tool installati via pip spesso creano wrapper .cmd/.bat.
    // Node's spawn() senza shell non li trova/esegue correttamente, quindi
    // su Windows passiamo sempre dalla shell; su Linux/Mac non serve.
    const useShell = process.platform === "win32";

    const child = spawn(SMARTBUGS_CMD, args, {
      cwd: SMARTBUGS_CWD,
      shell: useShell,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Impossibile avviare SmartBugs (comando: "${SMARTBUGS_CMD}"): ${error.message}`,
        ),
      );
    });

    child.on("close", async (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `SmartBugs terminato con codice ${code}. Dettagli: ${stderr.slice(0, 2000) || stdout.slice(0, 2000)}`,
          ),
        );
        return;
      }

      let findings = null;
      const resultJsonPath = await findResultJson(runResultsDir);
      if (resultJsonPath) {
        try {
          const raw = await readFile(resultJsonPath, "utf-8");
          findings = JSON.parse(raw);
        } catch (parseError) {
          console.warn(
            `Trovato result.json ma non parsabile (${resultJsonPath}):`,
            parseError.message,
          );
        }
      } else {
        console.warn(
          `Nessun result.json trovato dentro ${runResultsDir}. Controlla resultsDir/stdout per debug.`,
        );
      }

      resolve({ runId, resultsDir: runResultsDir, stdout, stderr, findings });
    });
  });
}

export { RESULTS_DIR };
