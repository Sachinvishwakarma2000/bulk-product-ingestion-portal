const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for this service
});

app.use(express.json());

// In-memory persistent store keyed by SKU
// In a full system, this would be SQLite or Postgres
const productsStore = new Map();

// Helper to validate and normalize a single CSV row
function validateRow(rowObj, rowNumber, columnCount) {
  const errors = [];

  // Check column count mismatch
  if (columnCount < 5) {
    errors.push(`Malformed row: expected 5 columns, found ${columnCount}`);
    return { isValid: false, errors, product: null };
  }

  const rawSku = (rowObj.sku || '').trim();
  const rawName = (rowObj.name || '').trim();
  const rawPrice = (rowObj.price || '').trim();
  const rawStock = (rowObj.stock || '').trim();
  const rawCategory = (rowObj.category || '').trim();

  // 1. SKU validation
  if (!rawSku) {
    errors.push('SKU is required and cannot be empty');
  }

  // 2. Name validation
  if (!rawName) {
    errors.push('Product name is required and cannot be empty');
  }

  // 3. Price validation
  let parsedPrice = null;
  if (!rawPrice) {
    errors.push('Price is required and cannot be empty');
  } else {
    // Check for currency symbols or letters (e.g. ₹3499, $20, 12.9.9)
    if (/[^\d.,\s-]/.test(rawPrice)) {
      errors.push(`Price contains non-numeric currency characters or symbols: "${rawPrice}"`);
    } else {
      // Remove comma thousand-separators if formatted like 1,199.00
      const sanitizedPrice = rawPrice.replace(/,/g, '');
      const num = Number(sanitizedPrice);

      if (isNaN(num) || !isFinite(num)) {
        errors.push(`Price is not a valid number: "${rawPrice}"`);
      } else if (num <= 0) {
        errors.push(`Price must be strictly positive (> 0): "${rawPrice}"`);
      } else {
        parsedPrice = Math.round(num * 100) / 100;
      }
    }
  }

  // 4. Stock validation
  let parsedStock = null;
  if (!rawStock && rawStock !== '0') {
    errors.push('Stock is required and cannot be empty');
  } else {
    const stockNum = Number(rawStock);
    if (isNaN(stockNum) || !Number.isInteger(stockNum)) {
      errors.push(`Stock must be a valid whole integer: "${rawStock}"`);
    } else if (stockNum < 0) {
      errors.push(`Stock cannot be negative: "${rawStock}"`);
    } else {
      parsedStock = stockNum;
    }
  }

  // 5. Category validation
  if (!rawCategory) {
    errors.push('Category is required and cannot be empty');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      product: null
    };
  }

  return {
    isValid: true,
    errors: [],
    product: {
      sku: rawSku,
      name: rawName,
      price: parsedPrice,
      stock: parsedStock,
      category: rawCategory,
      updatedAt: new Date().toISOString()
    }
  };
}

// Endpoint: POST /api/products/import
app.post('/api/products/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a CSV file with key "file".' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    if (!csvContent.trim()) {
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }

    // Parse CSV with RFC-4180 compliance, allowing lenient column counts so malformed rows don't crash parser
    let rawRecords;
    try {
      rawRecords = parse(csvContent, {
        relax_column_count: true,
        skip_empty_lines: true,
        trim: false
      });
    } catch (parseErr) {
      return res.status(400).json({
        error: `CSV Parsing error: ${parseErr.message}`
      });
    }

    if (!rawRecords || rawRecords.length === 0) {
      return res.status(400).json({ error: 'No data rows found in CSV.' });
    }

    // Detect header row
    const rawHeader = rawRecords[0].map(h => (h || '').trim().toLowerCase());
    const expectedHeaders = ['sku', 'name', 'price', 'stock', 'category'];
    const headerMap = {};

    expectedHeaders.forEach(col => {
      headerMap[col] = rawHeader.indexOf(col);
    });

    // Check if essential headers exist
    const missingHeaders = expectedHeaders.filter(col => headerMap[col] === -1);
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: `CSV missing required headers: ${missingHeaders.join(', ')}. Found: ${rawHeader.join(', ')}`
      });
    }

    const validRows = [];
    const errorRows = [];
    let insertedCount = 0;
    let updatedCount = 0;

    // Process data rows starting from row 2 (index 1)
    for (let i = 1; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const rowNumber = i + 1; // 1-indexed line number in CSV

      const rowObj = {
        sku: row[headerMap.sku] !== undefined ? row[headerMap.sku] : '',
        name: row[headerMap.name] !== undefined ? row[headerMap.name] : '',
        price: row[headerMap.price] !== undefined ? row[headerMap.price] : '',
        stock: row[headerMap.stock] !== undefined ? row[headerMap.stock] : '',
        category: row[headerMap.category] !== undefined ? row[headerMap.category] : ''
      };

      const result = validateRow(rowObj, rowNumber, row.length);

      if (result.isValid) {
        validRows.push({
          rowNumber,
          data: result.product
        });

        // Upsert into persistent store by SKU
        if (productsStore.has(result.product.sku)) {
          updatedCount++;
        } else {
          insertedCount++;
        }
        productsStore.set(result.product.sku, result.product);
      } else {
        errorRows.push({
          rowNumber,
          sku: (rowObj.sku || '').trim() || '(missing)',
          raw: row,
          errors: result.errors
        });
      }
    }

    return res.status(200).json({
      summary: {
        filename: req.file.originalname,
        totalRows: rawRecords.length - 1,
        validCount: validRows.length,
        invalidCount: errorRows.length,
        insertedCount,
        updatedCount,
        catalogueTotal: productsStore.size
      },
      validRows: validRows.map(v => v.data),
      errors: errorRows
    });
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ error: `Internal server error during import: ${err.message}` });
  }
});

// Endpoint: GET /api/products
app.get('/api/products', (req, res) => {
  const products = Array.from(productsStore.values());
  res.json({
    total: products.length,
    products
  });
});

// Endpoint: POST /api/products/clear
app.post('/api/products/clear', (req, res) => {
  productsStore.clear();
  res.json({ ok: true, message: 'Catalogue cleared', total: 0 });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Product import server listening on :${PORT}`));
