import "dotenv/config";
import express from "express";
import cors from "cors";
import contractsRouter from "./src/routes/contracts.js";
import analyzeRouter from "./src/routes/analyze.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS aperto: il frontend gira dentro un iframe caricato da Remix IDE
// (un'origine diversa da localhost:4000), quindi serve abilitare le richieste cross-origin.
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Endpoint di health check, utile per verificare rapidamente che il server sia raggiungibile
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/contracts", contractsRouter);
app.use("/api/analyze", analyzeRouter);

app.listen(PORT, () => {
  console.log(`Backend SmartBugs in ascolto su http://localhost:${PORT}`);
});
