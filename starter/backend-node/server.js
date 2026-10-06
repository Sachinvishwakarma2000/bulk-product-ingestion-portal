const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// TODO: implement the bulk product import.
// Accepts a CSV upload (field name "file"), validates rows, persists the valid ones,
// and returns a useful outcome to the caller.
app.post('/api/products/import', upload.single('file'), (req, res) => {
  res.status(501).json({ error: 'not implemented' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`listening on :${PORT}`));
