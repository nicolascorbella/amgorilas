const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const uploadDir = '/tmp/uploads';
const upload = multer({ dest: uploadDir });
const DATA_FILE = '/tmp/data.json';
const TOTAL_DEBT = 600000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Inicializamos con paid y un array de pagos
      fs.writeFileSync(DATA_FILE, JSON.stringify({ paid: 0, payments: [] }));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    return { paid: 0, payments: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
  } catch {}
}

// POST /upload
app.post('/upload', upload.single('screenshot'), (req, res) => {
  const amount = parseInt(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).send('Monto inválido');
  }

  const data = readData();
  data.paid += amount;
  if (data.paid > TOTAL_DEBT) data.paid = TOTAL_DEBT;

  // Guardamos info del pago
  const payment = {
    amount,
    filename: req.file ? req.file.filename : null,
    originalname: req.file ? req.file.originalname : null,
    date: new Date().toISOString()
  };
  data.payments.push(payment);

  writeData(data);

  res.redirect('/');
});

// GET /progress
app.get('/progress', (req, res) => {
  const data = readData();
  res.json({ paid: data.paid, total: TOTAL_DEBT });
});

// GET /payments - mostrar lista simple de pagos con imágenes
app.get('/payments', (req, res) => {
  const data = readData();

  const htmlPayments = data.payments.map(p => `
    <div style="margin-bottom: 20px; padding:10px; border:1px solid #ccc; border-radius:8px;">
      <strong>Monto:</strong> $${p.amount.toLocaleString()} <br />
      <strong>Fecha:</strong> ${new Date(p.date).toLocaleString()} <br />
      ${p.filename ? `<img src="/uploads/${p.filename}" alt="${p.originalname}" style="max-width:300px; margin-top:10px;" />` : ''}
    </div>
  `).join('');

  res.send(`
    <h1>Listado de pagos</h1>
    <a href="/">Volver</a>
    <div>${htmlPayments || '<p>No hay pagos registrados.</p>'}</div>
  `);
});

// Para todas las demás rutas, servimos el index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
