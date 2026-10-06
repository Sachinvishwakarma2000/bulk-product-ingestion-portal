import { useState, useEffect, useRef } from 'react';

const CLEAN_CSV_SAMPLE = `sku,name,price,stock,category
SKU-1001,Wireless Mouse,799,120,Accessories
SKU-1002,Mechanical Keyboard,2499,45,Accessories
SKU-1003,USB-C Hub,1299,80,Accessories
SKU-1004,Laptop Stand,1499,60,Office
SKU-1005,Webcam 1080p,3299,30,Electronics
SKU-1006,Desk Mat,599,200,Office
SKU-1007,Monitor Arm,2199,25,Office
SKU-1008,HDMI Cable 2m,299,340,Accessories`;

const MESSY_CSV_SAMPLE = `sku,name,price,stock,category
SKU-1001,Wireless Mouse Pro,899,100,Accessories
SKU-1002,Mechanical Keyboard,2599,40,Accessories
SKU-2001,Noise-Cancelling Headphones,"1,199.00",25,Audio
SKU-2001,Noise-Cancelling Headphones,1299,25,Audio
SKU-2002,Desk Lamp,₹3499,15,Office
SKU-2003,Standing Desk,12.9.9,10,Office
SKU-2004,Budget Cable,0,500,Accessories
SKU-2005,Gold Plated Cable,99999999,5,Accessories
SKU-2006,Ergonomic Chair,8999,-5,Furniture
SKU-2007,Sticky Notes,49,3.5,Stationery
SKU-2008,Whiteboard Marker,99,,Stationery
,Orphan Product,199,20,Misc
  SKU-2009  ,  Trailing Space Widget  ,299,30,Accessories
SKU-2010,Café Crème Mug,349,40,
SKU-2011,Naïve Notebook,159,60,Stationery
SKU-2012,Too Few Columns,199
SKU-2013,日本語キーボード,4999,12,Electronics`;

export default function App() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [activeTab, setActiveTab] = useState('catalogue');
  const [errorSearch, setErrorSearch] = useState('');
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [banner, setBanner] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch initial catalogue state on load
  useEffect(() => {
    fetchCatalogue();
  }, []);

  async function fetchCatalogue() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setCatalogue(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch catalogue:', err);
    }
  }

  function handleFileDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setBanner({ type: 'info', message: `Selected: ${droppedFile.name}` });
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setBanner({ type: 'info', message: `Selected: ${selected.name}` });
    }
  }

  function loadSampleFile(name, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const sampleFile = new File([blob], name, { type: 'text/csv' });
    setFile(sampleFile);
    setBanner({ type: 'info', message: `Loaded sample fixture: ${name}` });
  }

  async function handleUpload() {
    if (!file) return;

    setIsUploading(true);
    setBanner(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setBanner({
          type: 'error',
          message: data.error || 'Import failed. Please check the CSV format.',
        });
        setIsUploading(false);
        return;
      }

      setUploadResult(data);
      await fetchCatalogue();

      // Switch to errors tab if any rows were rejected, else catalogue
      if (data.errors && data.errors.length > 0) {
        setActiveTab('errors');
        setBanner({
          type: 'success',
          message: `Import processed: ${data.summary.validCount} valid products imported, ${data.summary.invalidCount} invalid rows flagged.`,
        });
      } else {
        setActiveTab('catalogue');
        setBanner({
          type: 'success',
          message: `All ${data.summary.validCount} products imported successfully!`,
        });
      }
    } catch (err) {
      setBanner({
        type: 'error',
        message: `Network error during upload: ${err.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleClearCatalogue() {
    if (!window.confirm('Clear all products from catalogue?')) return;
    try {
      const res = await fetch('/api/products/clear', { method: 'POST' });
      if (res.ok) {
        setCatalogue([]);
        setUploadResult(null);
        setFile(null);
        setBanner({ type: 'info', message: 'Catalogue reset successfully.' });
      }
    } catch (err) {
      console.error('Failed to clear catalogue:', err);
    }
  }

  // Filtered views
  const filteredErrors = (uploadResult?.errors || []).filter((err) => {
    if (!errorSearch) return true;
    const q = errorSearch.toLowerCase();
    return (
      err.sku.toLowerCase().includes(q) ||
      err.errors.some((e) => e.toLowerCase().includes(q)) ||
      String(err.rowNumber).includes(q)
    );
  });

  const filteredCatalogue = catalogue.filter((prod) => {
    if (!catalogueSearch) return true;
    const q = catalogueSearch.toLowerCase();
    return (
      prod.sku.toLowerCase().includes(q) ||
      prod.name.toLowerCase().includes(q) ||
      prod.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div>
          <h1>Bulk Product Import</h1>
          <p>Catalogue Operations Portal · Validate and import product feeds</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="header-badge">
            Catalogue: <strong>{catalogue.length}</strong> items
          </span>
          {catalogue.length > 0 && (
            <button className="btn-danger" onClick={handleClearCatalogue}>
              Reset Store
            </button>
          )}
        </div>
      </header>

      {/* Banner */}
      {banner && (
        <div
          className={`alert ${
            banner.type === 'error'
              ? 'alert-error'
              : banner.type === 'success'
              ? 'alert-success'
              : 'alert-success'
          }`}
        >
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Box */}
      <div className="upload-card">
        <div
          className={`dropzone ${isDragging ? 'active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div className="dropzone-icon">📁</div>
          <div className="dropzone-text">
            {file ? file.name : 'Click to select CSV file, or drag and drop here'}
          </div>
          <div className="dropzone-subtext">
            Expected headers: <code>sku, name, price, stock, category</code>
          </div>
        </div>

        <div className="upload-actions">
          <div className="sample-buttons">
            <span>Quick fixtures:</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => loadSampleFile('products-clean.csv', CLEAN_CSV_SAMPLE)}
            >
              products-clean.csv
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => loadSampleFile('products-messy.csv', MESSY_CSV_SAMPLE)}
            >
              products-messy.csv
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Validating & Importing...' : 'Import Products'}
          </button>
        </div>
      </div>

      {/* Outcome Metrics */}
      {uploadResult && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Rows in File</div>
            <div className="metric-value">{uploadResult.summary.totalRows}</div>
          </div>
          <div className="metric-card success">
            <div className="metric-label">Valid Imported</div>
            <div className="metric-value">{uploadResult.summary.validCount}</div>
          </div>
          <div className="metric-card danger">
            <div className="metric-label">Rejected / Invalid</div>
            <div className="metric-value">{uploadResult.summary.invalidCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Live Catalogue Size</div>
            <div className="metric-value">{uploadResult.summary.catalogueTotal}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-nav">
        {uploadResult?.errors?.length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'errors' ? 'active' : ''}`}
            onClick={() => setActiveTab('errors')}
          >
            Rejected Rows
            <span className="tab-badge">{uploadResult.errors.length}</span>
          </button>
        )}
        <button
          className={`tab-btn ${activeTab === 'catalogue' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalogue')}
        >
          Catalogue Inventory
          <span className="tab-badge">{catalogue.length}</span>
        </button>
      </div>

      {/* Tab 1: Rejected Rows */}
      {activeTab === 'errors' && uploadResult?.errors && (
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">
              Rejected Rows & Validation Failures ({uploadResult.errors.length})
            </h2>
            <input
              type="text"
              className="search-input"
              placeholder="Search errors or SKU..."
              value={errorSearch}
              onChange={(e) => setErrorSearch(e.target.value)}
            />
          </div>

          {filteredErrors.length === 0 ? (
            <div className="empty-state">
              <p>No rejection errors matched your search.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Row #</th>
                    <th style={{ width: 140 }}>SKU</th>
                    <th>Validation Reason</th>
                    <th>Raw Row Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredErrors.map((err, idx) => (
                    <tr key={idx}>
                      <td><strong>L{err.rowNumber}</strong></td>
                      <td>
                        <span className="sku-badge">{err.sku}</span>
                      </td>
                      <td>
                        {err.errors.map((msg, i) => (
                          <div key={i} className="error-pill">
                            ⚠️ {msg}
                          </div>
                        ))}
                      </td>
                      <td>
                        <code className="raw-data-code">
                          {Array.isArray(err.raw) ? err.raw.join(',') : JSON.stringify(err.raw)}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Catalogue */}
      {activeTab === 'catalogue' && (
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">
              Current Catalogue Products ({catalogue.length})
            </h2>
            <input
              type="text"
              className="search-input"
              placeholder="Search catalogue..."
              value={catalogueSearch}
              onChange={(e) => setCatalogueSearch(e.target.value)}
            />
          </div>

          {catalogue.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem' }}>📦</div>
              <p>No products in catalogue yet. Upload a CSV file to get started.</p>
            </div>
          ) : filteredCatalogue.length === 0 ? (
            <div className="empty-state">
              <p>No products found matching "{catalogueSearch}".</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Stock</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogue.map((item) => (
                    <tr key={item.sku}>
                      <td>
                        <span className="sku-badge">{item.sku}</span>
                      </td>
                      <td><strong>{item.name}</strong></td>
                      <td>
                        <span className="badge-tag">{item.category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {item.stock}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        ${item.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
