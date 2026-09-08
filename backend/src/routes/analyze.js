import { Router } from "express";
import { runSmartBugsAnalysis } from "../services/smartbugsRunner.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/**
 * POST /api/analyze
 * Body atteso: { filename: string, tool?: string }
 */
router.post("/", async (req, res) => {
  const { filename, tool } = req.body ?? {};

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: 'Richiesto il campo "filename" (string).',
    });
  }

  try {
    const result = await runSmartBugsAnalysis(filename, { tool });

    res.status(200).json({
      message: result.findings
        ? "Analisi completata."
        : "Analisi completata, ma non è stato possibile leggere result.json.",
      runId: result.runId,
      resultsDir: result.resultsDir,
      findings: result.findings,
    });
  } catch (error) {
    console.error("Errore durante l'esecuzione di SmartBugs:", error);
    res.status(500).json({
      error: "ANALYSIS_FAILED",
      message:
        error.message || "Errore durante l'esecuzione dell'analisi SmartBugs.",
    });
  } finally {
    // PULIZIA DEL FILE TEMPORANEO
    try {
      // __dirname punta a "backend/src/routes"
      // Saliamo di due livelli e puntiamo a "backend/temp/nomefile.sol"
      const filePath = path.join(__dirname, "..", "..", "temp", filename);

      await fs.unlink(filePath);
      console.log(
        `[Cleanup] File temporaneo eliminato con successo: ${filename}`,
      );
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.error(
          `[Cleanup] Impossibile eliminare il file temporaneo ${filename}:`,
          cleanupError,
        );
      }
    }
  }
});

export default router;
