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
