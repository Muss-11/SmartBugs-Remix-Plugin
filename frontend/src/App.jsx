import { useState, useEffect } from "react";
import {
  connectToRemix,
  extractCurrentSolidityFile,
} from "./services/remixClient";
import {
  sendContractToBackend,
  analyzeContract,
} from "./services/backendClient";
import "./App.css";

const ERROR_MESSAGES = {
  NO_FILE_OPEN: "Nessun file aperto nell'editor.",
  NOT_SOLIDITY_FILE: "Il file attivo non è un file Solidity (.sol).",
};

// Mappa impact SmartBugs/Slither -> classe CSS per il colore del badge
const IMPACT_CLASS = {
  High: "badge-high",
  Medium: "badge-medium",
  Low: "badge-low",
  Informational: "badge-info",
  Optimization: "badge-optimization",
};

function App() {
  const [status, setStatus] = useState("In attesa di connessione...");
  const [isConnected, setIsConnected] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [sourceCode, setSourceCode] = useState("");
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [findings, setFindings] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await connectToRemix();
        setStatus("Connesso a Remix IDE!");
        setIsConnected(true);
      } catch (error) {
        console.error("Errore di connessione:", error);
        setStatus("Non connesso a Remix.");
      }
    };
    init();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzeStatus("Lettura del file in corso...");
    setSourceCode("");
    setCurrentFile(null);
    setFindings(null);

    try {
      const { path, content } = await extractCurrentSolidityFile();

      setCurrentFile(path);
      setSourceCode(content);
      setAnalyzeStatus(
        `File letto correttamente: ${path} (${content.length} caratteri). Invio al backend in corso...`,
      );

      const { filename } = await sendContractToBackend(path, content);

      setAnalyzeStatus(
        `File salvato come "${filename}". Analisi SmartBugs in corso (può richiedere qualche minuto)...`,
      );
      setIsAnalyzing(true);

      const result = await analyzeContract(filename);

      setIsAnalyzing(false);
      setFindings(result.findings);

      const count = result.findings?.findings?.length ?? 0;
      setAnalyzeStatus(
        result.findings
          ? `Analisi completata: ${count} segnalazion${count === 1 ? "e" : "i"} trovat${count === 1 ? "a" : "e"}.`
          : "Analisi completata, ma non è stato possibile leggere i risultati dettagliati.",
      );
    } catch (error) {
      setIsAnalyzing(false);
      const knownMessage = ERROR_MESSAGES[error.message];
      const message =
        knownMessage ||
        error.message ||
        "Errore imprevisto. Controlla la console.";
      setAnalyzeStatus(message);
      if (!knownMessage) {
        console.error("Errore durante l'analisi:", error);
      }
    }
  };

  return (
    <div className="app-container">
      <h1>SmartBugs Plugin</h1>

      <div className="status-box">
        <p>
          Stato: <strong>{status}</strong>
        </p>
      </div>

      <button
        className="analyze-btn"
        onClick={handleAnalyze}
        disabled={!isConnected || isAnalyzing}
      >
        {isAnalyzing ? "Analisi in corso..." : "Analizza Contratto"}
      </button>

      {analyzeStatus && (
        <div className="status-box" style={{ marginTop: "15px" }}>
          <p>{analyzeStatus}</p>
        </div>
      )}

      {currentFile && (
        <div className="status-box" style={{ marginTop: "10px" }}>
          <p>
            <strong>File corrente:</strong> {currentFile}
          </p>
          <pre
            style={{
              maxHeight: "200px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              fontSize: "0.8rem",
            }}
          >
            {sourceCode}
          </pre>
        </div>
      )}

      {findings?.findings?.length > 0 && (
        <div className="findings-list">
          {findings.findings.map((finding, index) => (
            <div className="finding-card" key={index}>
              <div className="finding-header">
                <span
                  className={`badge ${IMPACT_CLASS[finding.impact] || "badge-info"}`}
                >
                  {finding.impact}
                </span>
                <span className="finding-name">{finding.name}</span>
                {finding.line != null && (
                  <span className="finding-line">riga {finding.line}</span>
                )}
              </div>
              <p className="finding-message">{finding.message}</p>
            </div>
          ))}
        </div>
      )}

      {findings && findings.findings?.length === 0 && (
        <div className="status-box" style={{ marginTop: "15px" }}>
          <p>
            Nessuna vulnerabilità segnalata da SmartBugs per questo contratto.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
