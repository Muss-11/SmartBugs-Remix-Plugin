import { Router } from "express";
import { saveSolidityFile } from "../utils/tempFile.js";

const router = Router();

router.post("/", async (req, res) => {
  const { path: originalPath, content } = req.body ?? {};

  if (!originalPath || typeof content !== "string") {
    return res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: 'Richiesti i campi "path" (string) e "content" (string).',
    });
  }

  if (!originalPath.endsWith(".sol")) {
    return res.status(400).json({
      error: "NOT_SOLIDITY_FILE",
      message: "Il file deve avere estensione .sol.",
    });
  }

  try {
    const { filename, filePath } = await saveSolidityFile(
      originalPath,
      content,
    );

    res.status(201).json({
      message: "File salvato correttamente.",
      filename,
      filePath,
    });
  } catch (error) {
    console.error("Errore nel salvataggio del file:", error);
    res.status(500).json({
      error: "SAVE_FAILED",
      message: "Errore durante il salvataggio del file sul server.",
    });
  }
});

export default router;
