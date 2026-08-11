import { useState, useEffect } from "react";
import {
  connectToRemix,
  extractCurrentSolidityFile,
} from "./services/remixClient";
import "./App.css";

// Messaggi utente per i codici di errore lanciati da remixClient
const ERROR_MESSAGES = {
  NO_FILE_OPEN: "Nessun file aperto nell'editor.",
  NOT_SOLIDITY_FILE: "Il file attivo non è un file Solidity (.sol).",
};

function App() {
  const [status, setStatus] = useState("In attesa di connessione...");
  const [isConnected, setIsConnected] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [sourceCode, setSourceCode] = useState("");
  const [analyzeStatus, setAnalyzeStatus] = useState("");

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

    try {
      const { path, content } = await extractCurrentSolidityFile();

      setCurrentFile(path);
      setSourceCode(content);
      setAnalyzeStatus(
        `File letto correttamente: ${path} (${content.length} caratteri).`
      );

      // Qui, in Fase 2, invieremo "content" al backend Node.js
      console.log("Codice Solidity estratto:", content);
    } catch (error) {
      const message =
        ERROR_MESSAGES[error.message] ||
        "Errore durante la lettura del file. Controlla la console.";
      setAnalyzeStatus(message);
      if (!ERROR_MESSAGES[error.message]) {
        console.error("Errore durante la lettura del file:", error);
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
        disabled={!isConnected}
      >
        Analizza Contratto
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
    </div>
  );
}

export default App;
