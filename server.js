const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// Servir archivos estáticos (carpeta "public", raíz y "uploads")
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Subida de archivos
app.post('/upload', upload.array('file', 10), (req, res) => {
  res.json({ message: 'Archivos subidos correctamente' });
});

// Listado de archivos
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).send('Error al leer archivos');
    const data = { audio: [], image: [], video: [] };

    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.mp3') data.audio.push(file);
      else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') data.image.push(file);
      else if (ext === '.mp4') data.video.push(file);
    });

    res.json(data);
  });
});

// Renombrar archivo
app.post('/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ message: 'Faltan datos' });

  const oldPath = path.join(uploadDir, oldName);
  const newPath = path.join(uploadDir, newName);

  if (fs.existsSync(newPath)) return res.status(400).json({ message: 'El nuevo nombre ya existe' });

  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ message: 'Error al renombrar' });
    res.json({ message: 'Archivo renombrado con éxito' });
  });
});

// Eliminar archivo
app.post('/delete', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ message: 'Falta el nombre del archivo' });

  const filePath = path.join(uploadDir, filename);
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ message: 'No se pudo borrar el archivo' });
    res.json({ message: 'Archivo eliminado' });
  });
});

// Archivos subidos
app.use('/uploads', express.static(uploadDir));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
