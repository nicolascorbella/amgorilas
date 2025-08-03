const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

// Configuramos multer para guardar en /tmp/uploads (temporal en Vercel)
const uploadDir = '/tmp/uploads';
const upload = multer({ dest: uploadDir });

const DATA_FILE = '/tmp/data.json';
const TOTAL_DEBT = 600000;

app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (css, js, img, index.html) desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Servir las imágenes subidas para que se puedan ver en el navegador
app.use('/uploads', express.static(uploadDir));

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ paid: 0 }));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    return { paid: 0 };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
  } catch {}
}

// POST /upload - recibimos monto + captura
app.post('/upload', upload.single('screenshot'), (req, res) => {
  const amount = parseInt(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send('Monto inválido');
  }

  const data = readData();
  data.paid += amount;
  if (data.paid > TOTAL_DEBT) data.paid = TOTAL_DEBT;
  writeData(data);

  // URL para mostrar la imagen subida (nombre generado por multer)
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  // Respondemos con mensaje y foto subida
  res.send(`
    <h1>Subida exitosa!</h1>
    <p>Monto actualizado: $${data.paid} / $${TOTAL_DEBT}</p>
    ${imageUrl ? `<img src="${imageUrl}" alt="Comprobante" style="max-width:300px;"/>` : ''}
    <p><a href="/">Volver</a></p>
  `);
});

// GET /progress - devolver progreso como JSON
app.get('/progress', (req, res) => {
  const data = readData();
  res.json({ paid: data.paid, total: TOTAL_DEBT });
});

// Para cualquier otra ruta, servir index.html (SPA)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
