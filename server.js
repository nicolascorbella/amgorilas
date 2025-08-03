const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'public/uploads' });
const DATA_FILE = 'data.json';
const TOTAL_DEBT = 600000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Función corregida para asegurar estructura de data.json
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ paid: 0, payments: [] }));
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    data = { paid: 0, payments: [] };
  }
  if (!Array.isArray(data.payments)) data.payments = [];
  if (typeof data.paid !== 'number') data.paid = 0;
  return data;
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

app.post('/upload', upload.single('screenshot'), (req, res) => {
  const amount = parseInt(req.body.amount);
  if (isNaN(amount) || amount <= 0) return res.status(400).send('Monto inválido');

  const data = readData();
  const payment = {
    amount,
    filename: req.file.filename,
    originalname: req.file.originalname,
    uploadedAt: new Date().toISOString()
  };

  data.paid += amount;
  if (data.paid > TOTAL_DEBT) data.paid = TOTAL_DEBT;
  data.payments.push(payment);

  writeData(data);
  res.redirect('/');
});

app.get('/progress', (req, res) => {
  const data = readData();
  res.json({ paid: data.paid, total: TOTAL_DEBT });
});

app.get('/payments', (req, res) => {
  const data = readData();

  const htmlPayments = data.payments.map(p => `
    <div style="margin-bottom: 20px; padding:10px; border:1px solid #ccc; border-radius:8px;">
      <strong>Monto:</strong> $${p.amount.toLocaleString()} <br />
      <strong>Fecha:</strong> ${new Date(p.uploadedAt).toLocaleString()} <br />
      ${p.filename ? `
        <a href="/uploads/${p.filename}" target="_blank" rel="noopener noreferrer">
          <img src="/uploads/${p.filename}" alt="${p.originalname}" style="max-width:300px; margin-top:10px; cursor:pointer;" />
        </a>
      ` : ''}
    </div>
  `).join('');

  res.send(`
    <h1>Listado de pagos</h1>
    <a href="/">Volver al formulario</a>
    <div>${htmlPayments || '<p>No hay pagos registrados.</p>'}</div>
  `);
});


app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

