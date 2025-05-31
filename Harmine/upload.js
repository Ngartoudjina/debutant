// server.js
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import multer from 'multer';
import { Readable } from 'stream';

const app = express();
app.use(cors());
app.use(express.json());

// Configuration de Multer pour gérer les fichiers
const upload = multer({ storage: multer.memoryStorage() });

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddwo6zreg',
  api_key: process.env.CLOUDINARY_API_KEY || '795417627442342',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'rwN2aHvHYD35ZZ4hQYvZs4HoFCY',
});

// Route pour l'upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const uploadOptions = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      folder: 'mon_dossier',
    };

    // Créer un stream lisible à partir du buffer
    const stream = Readable.from(req.file.buffer);

    // Retourne une promesse pour pouvoir utiliser await
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      stream.pipe(uploadStream);
    });

    res.json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

app.listen(5000, () => {
  console.log('Serveur démarré sur http://localhost:5000');
});