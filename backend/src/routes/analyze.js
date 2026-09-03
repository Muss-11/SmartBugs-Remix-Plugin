import { Router } from "express";
import { runSmartBugsAnalysis } from "../services/smartbugsRunner.js";

const router = Router();

/**
 * POST /api/analyze
 * Body atteso: { filename: string, tool?: string }
 *
 * Esegue SmartBugs sul file precedentemente salvato tramite /api/contracts
 * e restituisce dove sono stati scritti i risultati grezzi.
 *
 * Questa chiamata può richiedere da qualche secondo a diversi minuti
 * a seconda del tool e della complessità del contratto, è normale che la
 * risposta HTTP arrivi con ritardo.
 */
router.post("/", async (req, res) => {
  const { filename, tool } = req.body ?? {};

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({
      error: "INVALID_PAYLOAD",
      message:
        'Richiesto il campo "filename" (string), quello restituito da /api/contracts.',
    });
  }

  try {
    const result = await runSmartBugsAnalysis(filename, { tool });

    res.status(200).json({
      message: "Analisi completata.",
      runId: result.runId,
      resultsDir: result.resultsDir,
    });
  } catch (error) {
    console.error("Errore durante l'esecuzione di SmartBugs:", error);
    res.status(500).json({
      error: "ANALYSIS_FAILED",
      message:
        error.message || "Errore durante l'esecuzione dell'analisi SmartBugs.",
    });
  }
});

export default router;
