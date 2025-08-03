const express = require('express');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });
const DATA_FILE = 'data.json';
const TOTAL_DEBT = 600000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Leer el archivo con el monto pagado actual
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ paid: 0 }));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Guardar monto actualizado
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

// Ruta para cargar captura + monto
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

// Ruta para obtener progreso actual
app.get('/progress', (req, res) => {
  const data = readData();
  res.json({ paid: data.paid, total: TOTAL_DEBT });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
