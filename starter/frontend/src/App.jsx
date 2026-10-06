import { useState } from 'react';

// A bare starting point. Build the upload screen out from here: let the user pick a
// CSV, POST it to /api/products/import, and show the outcome.
export default function App() {
  const [file, setFile] = useState(null);

  async function handleUpload() {
    // TODO: send the file and render the result.
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '3rem auto' }}>
      <h1>Bulk product import</h1>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={!file}>Upload</button>
    </main>
  );
}
