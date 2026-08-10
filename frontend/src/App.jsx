import { useState, useEffect } from "react";
import { createClient } from "@remixproject/plugin-webview";
import "./App.css";

// Inizializza il client in modo sicuro
const client = createClient();

function App() {
  const [status, setStatus] = useState("In attesa di connessione...");

  useEffect(() => {
    const initClient = async () => {
      try {
        await client.onload();
        setStatus("Connesso a Remix IDE!");
      } catch (error) {
        console.error("Errore:", error);
        setStatus("Non connesso a Remix.");
      }
    };
    initClient();
  }, []);

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
        onClick={() => alert("Presto leggeremo il codice!")}
      >
        Analizza Contratto
      </button>
    </div>
  );
}

export default App;
