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
    <div class="payment-card">
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
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Listado de pagos</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f0f4ff;
          padding: 20px;
          margin: 0;
          color: #222;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        h1 {
          color: #305EF2;
          text-align: center;
          margin-bottom: 30px;
        }
        a.back-link {
          display: inline-block;
          margin-bottom: 20px;
          color: #305EF2;
          text-decoration: none;
          font-weight: bold;
        }
        a.back-link:hover {
          text-decoration: underline;
        }
        .payment-card {
          background: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 3px 8px rgba(48, 94, 242, 0.2);
          margin-bottom: 20px;
        }
        .payment-card img {
          max-width: 100%;
          margin-top: 10px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(48, 94, 242, 0.3);
          transition: transform 0.2s ease;
        }
        .payment-card img:hover {
          transform: scale(1.05);
        }
        @media (max-width: 480px) {
          body {
            padding: 10px;
          }
          .payment-card {
            padding: 12px;
          }
        }
      </style>
    </head>
    <body>
      <h1>Listado de pagos</h1>
      <a href="/" class="back-link">&larr; Volver al formulario</a>
      ${htmlPayments || '<p>No hay pagos registrados.</p>'}
    </body>
    </html>
  `);
});


app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});



