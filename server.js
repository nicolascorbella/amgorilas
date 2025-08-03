const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: '/tmp/uploads' }); // en Vercel usar /tmp para subir
const DATA_FILE = '/tmp/data.json'; // usar /tmp porque Vercel es serverless (cambio temporal)
const TOTAL_DEBT = 600000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Funciones para leer/escribir data en /tmp
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

// Ruta upload
app.post('/upload', upload.single('screenshot'), (req, res) => {
  const amount = parseInt(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send("Monto inválido");
  }

  const data = readData();
  data.paid += amount;
  if (data.paid > TOTAL_DEBT) data.paid = TOTAL_DEBT;
  writeData(data);

  res.redirect('/');
});

// Ruta progress
app.get('/progress', (req, res) => {
  const data = readData();
  res.json({ paid: data.paid, total: TOTAL_DEBT });
});

// Exportar app para Vercel (NO usar app.listen)
module.exports = app;
