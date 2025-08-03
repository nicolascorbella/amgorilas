const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ruta que devuelve todos los pagos
app.get('/payments', (req, res) => {
  try {
    const data = fs.readFileSync('data.json', 'utf8');
    const json = JSON.parse(data);
    res.json(json.payments || []);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer data.json' });
  }
});

// ✅ Ruta para subir comprobante
app.post('/upload', upload.single('screenshot'), (req, res) => {
  const amount = parseFloat(req.body.amount);
  const screenshot = req.file;

  if (!screenshot || isNaN(amount)) {
    return res.status(400).send('Datos inválidos');
  }

  let data = { total: 20000, payments: [] };

  try {
    const file = fs.readFileSync('data.json', 'utf8');
    data = JSON.parse(file);
  } catch (err) {
    // Si no existe data.json lo crea
  }

  const newPayment = {
    amount,
    file: screenshot.filename,
    originalName: screenshot.originalname,
    date: new Date().toISOString(),
  };

  data.payments.push(newPayment);

  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

  res.redirect('/');
});

// ✅ Progreso visual
app.get('/progress', (req, res) => {
  try {
    const file = fs.readFileSync('data.json', 'utf8');
    const data = JSON.parse(file);
    const paid = data.payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({ paid, total: data.total });
  } catch (err) {
    res.json({ paid: 0, total: 0 });
  }
});

// ✅ Archivos públicos (después de las rutas dinámicas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
