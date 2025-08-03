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

// Asegura que haya un archivo data.json inicial
function readData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ paid: 0, payments: [] }));
  return JSON.parse(fs.readFileSync(DATA_FILE));
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
  res.json(data.payments || []);
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// IMPORTANTE: Esto es lo que faltaba
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
