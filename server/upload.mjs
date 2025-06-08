import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Vérifier les variables d'environnement
const requiredEnvVars = [
  'FIREBASE_SERVICE_ACCOUNT_PATH',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Erreur: ${envVar} n'est pas défini dans .env.local`);
    process.exit(1);
  }
}

const sendVerificationEmail = async (email, verificationLink) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Vérifiez votre adresse email - Dynamism Express',
      html: `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
  <h2 style="color: #1f2937; text-align: center;">Bienvenue chez <span style="color: #3B82F6;">Dynamism Express</span> !</h2>
  
  <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
    Merci de vous être inscrit. Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verificationLink}" style="display: inline-block; background-color: #3B82F6; color: white; font-size: 16px; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Vérifier mon email
    </a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; text-align: center;">
    Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.
  </p>
</div>

      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de vérification envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw new Error('Échec de l\'envoi de l\'email de vérification');
  }
};

// Initialiser Firebase Admin
let serviceAccount;
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  if (!serviceAccount.project_id) {
    throw new Error('Service account object must contain a string "project_id" property');
  }
  console.log('Project ID:', serviceAccount.project_id);
} catch (error) {
  console.error('Erreur lors du chargement du compte de service:', error.message);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true }); // Ignore undefined values in Firestore
const auth = getAuth();
const messaging = getMessaging();

// Configuration Express
const app = express();
app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(express.json());

// Configuration Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non supporté'));
    }
    cb(null, true);
  },
});

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware d'authentification
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Token manquant pour:', req.originalUrl);
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expiré',
        details: 'Le token Firebase ID a expiré. Veuillez rafraîchir votre token depuis le client.',
      });
    }
    return res.status(401).json({ error: 'Token invalide', details: error.message });
  }
};

// Middleware pour admins
const restrictToAdmin = async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
  } catch (error) {
    console.error('Erreur vérification rôle:', error);
    return res.status(500).json({ error: 'Erreur lors de la vérification du rôle' });
  }
};

const authenticateUser = verifyToken;

// Utilitaire pour Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const uploadOptions = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      folder: 'coursiers',
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve({ secure_url: result.secure_url, public_id: result.public_id });
    });

    uploadStream.end(file.buffer);
  });
};

// Utilitaire pour supprimer un fichier Cloudinary
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Fichier supprimé de Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`Erreur suppression Cloudinary ${publicId}:`, error);
  }
};

// Utilitaire pour envoyer une notification
const sendNotification = async (userId, title, body, type = 'GENERAL', data = {}) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log(`Utilisateur ${userId} non trouvé`);
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) {
      console.log(`Aucun token FCM pour l'utilisateur ${userId}`);
      return { success: false, error: 'Aucun token FCM disponible' };
    }

    // Convertir les valeurs de data en chaînes pour FCM
    const stringifiedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {});

    const message = {
      notification: { title, body },
      data: stringifiedData,
      token: fcmToken,
    };

    try {
      await messaging.send(message);
      console.log(`Notification envoyée à ${userId}: ${title}`);

      // Enregistrer la notification dans Firestore
      await db.collection('notifications').add({
        userId,
        message: body,
        title,
        type: type || 'GENERAL', // Garantir une valeur par défaut
        data: data || {},
        createdAt: new Date().toISOString(),
        read: false,
      });

      return { success: true };
    } catch (error) {
      console.error(`Erreur envoi notification à ${userId}:`, error);
      if (error.code === 'messaging/registration-token-not-registered') {
        await db.collection('users').doc(userId).update({
          fcmToken: null,
          updatedAt: new Date().toISOString(),
        });
        console.log(`Token FCM invalide supprimé pour ${userId}`);
        return { success: false, error: 'Token FCM invalide, réinitialisé' };
      }
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('Erreur générale envoi notification:', error);
    return { success: false, error: error.message };
  }
};

// Utilitaire pour notifier tous les admins
const notifyAdmins = async (title, body, type = 'GENERAL', data = {}) => {
  try {
    const adminSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    if (adminSnapshot.empty) {
      console.log('Aucun administrateur trouvé');
      return { success: false, error: 'Aucun administrateur trouvé' };
    }

    const notificationPromises = adminSnapshot.docs.map(async (doc) => {
      const adminId = doc.id;
      console.log(`Envoi notification à admin ${adminId}: ${title}`);
      return sendNotification(adminId, title, body, type, data);
    });

    const results = await Promise.all(notificationPromises);
    const successes = results.filter((r) => r.success).length;
    console.log(`Notifications envoyées à ${successes}/${adminSnapshot.size} admins`);
    return { success: true, notified: successes };
  } catch (error) {
    console.error('Erreur notification admins:', error);
    return { success: false, error: error.message };
  }
};

// Route inscription
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, password } = req.body;

    // Validation des champs
    if (!firstName || !lastName || !email || !phone || !address || !password) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email invalide" });
    }

    if (!/^[1-9]\d{1,14}$/.test(phone)) {
      return res.status(400).json({ error: "Numéro de téléphone invalide (ex: +33612345678)" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Vérifier si l'email existe déjà
    try {
      const userRecord = await auth.getUserByEmail(email);
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Créer l'utilisateur dans Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: false, // Par défaut, l'email n'est pas vérifié
      });
      console.log(`Utilisateur créé dans Auth: ${userRecord.uid}`);
    } catch (authError) {
      console.error("Erreur Auth:", authError);
      throw new Error(`Erreur création utilisateur Auth: ${authError.message}`);
    }

    // Enregistrer les données dans Firestore
    try {
      await db.collection("users").doc(userRecord.uid).set({
        firstName,
        lastName,
        email,
        phone,
        address,
        role: "client",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`Utilisateur enregistré dans Firestore: ${userRecord.uid}`);
    } catch (firestoreError) {
      console.error("Erreur Firestore:", firestoreError);
      await auth.deleteUser(userRecord.uid);
      throw new Error(`Erreur enregistrement Firestore: ${firestoreError.message}`);
    }

    // Envoyer l'email de vérification
    try {
      const actionCodeSettings = {
        url: 'http://localhost:5173/login',
        handleCodeInApp: true,
      };
      const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);
      await sendVerificationEmail(email, verificationLink);
      console.log(`Lien de vérification envoyé à ${email}`);

      // TODO: Envoyer l'email via un service comme Nodemailer (voir section 4)
    } catch (emailError) {
      console.error("Erreur envoi email de vérification:", emailError);
      // Ne pas bloquer l'inscription, mais informer l'utilisateur
    }

    res.status(200).json({ message: "Inscription réussie. Veuillez vérifier votre email." });
  } catch (error) {
    console.error("Erreur inscription:", error.message, error.stack);
    res.status(500).json({ error: "Erreur lors de l'inscription", details: error.message });
  }
});

app.get('/api/auth/check-email-verified/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const userRecord = await auth.getUser(uid);
    if (userRecord.emailVerified) {
      // Mettre à jour Firestore
      await db.collection('users').doc(uid).update({
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });
      res.status(200).json({ emailVerified: true });
    } else {
      res.status(200).json({ emailVerified: false });
    }
  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'email', details: error.message });
  }
});

// Route connexion
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      console.error("Erreur recherche utilisateur:", error);
      if (error.code === 'auth/user-not-found') {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
      }
      throw new Error(`Erreur recherche utilisateur: ${error.message}`);
    }

    if (!userRecord.emailVerified) {
      return res.status(403).json({ error: 'Veuillez vérifier votre email avant de vous connecter.' });
    }

    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Données utilisateur non trouvées dans Firestore' });
    }

    const updates = {
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (fcmToken) updates.fcmToken = fcmToken;

    try {
      await db.collection('users').doc(userRecord.uid).set(updates, { merge: true });
      console.log(`Utilisateur mis à jour dans Firestore: ${userRecord.uid}`);
    } catch (firestoreError) {
      console.error("Erreur mise à jour Firestore:", firestoreError);
      throw new Error(`Erreur mise à jour Firestore: ${firestoreError.message}`);
    }

    // Envoyer notification de connexion
    await sendNotification(
      userRecord.uid,
      'Connexion réussie',
      'Vous êtes connecté à votre compte Dynamism Express.',
      'LOGIN'
    );

    const customToken = await auth.createCustomToken(userRecord.uid);
    console.log('Custom token généré pour:', userRecord.uid);

    res.status(200).json({
      message: 'Connexion réussie',
      idToken: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
    });
  } catch (error) {
    console.error('Erreur connexion:', error.message, error.stack);
    let errorMessage = 'Erreur lors de la connexion';
    let statusCode = 500;

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Mot de passe incorrect';
      statusCode = 401;
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Trop de tentatives. Réessayez plus tard.';
      statusCode = 429;
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Ce compte est désactivé';
      statusCode = 403;
    }

    res.status(statusCode).json({ error: errorMessage, details: error.message });
  }
});

// Route connexion Google
app.post('/api/auth/signin-google', async (req, res) => {
  try {
    const { idToken, fcmToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Token Google requis' });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ error: 'Token Google invalide' });
    }

    const uid = decodedToken.uid;
    let userRecord;
    try {
      userRecord = await auth.getUser(uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          uid,
          email: decodedToken.email,
          displayName: decodedToken.name || '',
          photoURL: decodedToken.picture || '',
        });
      } else {
        throw error;
      }
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    const updates = {
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayName: userRecord.displayName || '',
      email: userRecord.email,
      photoURL: userRecord.photoURL || '',
    };
    if (fcmToken) updates.fcmToken = fcmToken;

    if (userDoc.exists) {
      await userRef.update(updates);
    } else {
      const userData = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        role: 'client',
        provider: 'google',
        createdAt: new Date().toISOString(),
        ...updates,
      };
      await userRef.set(userData);
    }

    // Envoyer notification de connexion
    await sendNotification(
      uid,
      'Connexion avec Google',
      'Vous êtes connecté à votre compte via Google.',
      'LOGIN'
    );

    const customToken = await auth.createCustomToken(uid);

    res.status(200).json({
      message: 'Connexion avec Google réussie',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
      idToken: customToken,
    });
  } catch (error) {
    console.error('Erreur connexion Google:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion avec Google', details: error.message });
  }
});

// Route upload fichier
app.post('/api/upload', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const result = await uploadToCloudinary(req.file);
    if (!result) {
      return res.status(400).json({ error: 'Erreur lors du téléchargement vers Cloudinary' });
    }

    res.json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur lors de l’upload', details: error.message });
  }
});

// Créer un coursier
const createCourier = async (req, res, collectionName) => {
  try {
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'experience', 'transport', 'availability', 'motivation'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Le champ ${field} est requis` });
      }
    }

    const fileUrls = {};
    if (req.files) {
      const filePromises = Object.entries(req.files).map(async ([fieldName, files]) => {
        if (files && files.length > 0) {
          const result = await uploadToCloudinary(files[0]);
          fileUrls[fieldName] = { secure_url: result.secure_url, public_id: result.public_id };
        }
      });
      await Promise.all(filePromises);
    }

    const fileFields = ['idDocument', 'drivingLicense', 'profilePicture'];
    fileFields.forEach(field => {
      if (req.body[field] && !fileUrls[field] && typeof req.body[field] === 'string' && req.body[field].startsWith('https://res.cloudinary.com')) {
        fileUrls[field] = { secure_url: req.body[field], public_id: req.body[field].split('/').pop().split('.')[0] };
      }
    });

    const courierData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      experience: req.body.experience,
      transport: req.body.transport,
      availability: req.body.availability,
      motivation: req.body.motivation,
      idDocument: fileUrls.idDocument || null,
      drivingLicense: fileUrls.drivingLicense || null,
      profilePicture: fileUrls.profilePicture || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.uid,
    };

    await db.collection(collectionName).doc(req.user.uid).set(courierData);

    // Notification au candidat
    await sendNotification(
      req.user.uid,
      'Candidature de coursier soumise',
      `Votre candidature en tant que coursier a été reçue et est en cours de traitement.`,
      'COURIER_APPLICATION'
    );

    // Notification aux admins
    await notifyAdmins(
      'Nouvelle candidature de coursier',
      `Une nouvelle candidature de ${courierData.fullName} a été soumise.`,
      'NEW_COURIER',
      { courierId: req.user.uid }
    );

    res.status(201).json({
      message: 'Candidature enregistrée avec succès',
      data: courierData,
    });
  } catch (error) {
    console.error(`Erreur création ${collectionName}:`, error);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de la candidature', details: error.message });
  }
};

// Routes coursiers
app.post(
  '/api/coursiers/createCourier',
  authenticateUser,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
  ]),
  (req, res) => createCourier(req, res, 'coursiers')
);

app.post(
  '/api/coursiers/createtrueCourier',
  authenticateUser,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
  ]),
  (req, res) => createCourier(req, res, 'truecoursiers')
);

// Récupérer un coursier
const getCourier = async (req, res, collectionName) => {
  try {
    const courierId = req.params.id;
    const courierDoc = await db.collection(collectionName).doc(courierId).get();

    if (!courierDoc.exists) {
      return res.status(404).json({ error: `${collectionName} non trouvé` });
    }

    res.status(200).json({
      message: `${collectionName} récupéré avec succès`,
      data: { id: courierDoc.id, ...courierDoc.data() },
    });
  } catch (error) {
    console.error(`Erreur récupération ${collectionName}:`, error);
    res.status(500).json({ error: `Erreur lors de la récupération du ${collectionName}`, details: error.message });
  }
};

// Récupérer tous les coursiers
const getAllCouriers = async (req, res, collectionName) => {
  try {
    const snapshot = await db.collection(collectionName).get();
    const coursiers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      message: `${collectionName} récupérés avec succès`,
      data: coursiers,
    });
  } catch (error) {
    console.error(`Erreur récupération ${collectionName}:`, error);
    res.status(500).json({ error: `Erreur lors de la récupération des ${collectionName}`, details: error.message });
  }
};

// Mettre à jour un coursier
const updateCourier = async (req, res, collectionName) => {
  try {
    const courierId = req.params.id;
    const courierDoc = await db.collection(collectionName).doc(courierId).get();

    if (!courierDoc.exists) {
      return res.status(404).json({ error: `${collectionName} non trouvé` });
    }

    const currentData = courierDoc.data();
    const updates = { ...req.body };

    const fileUrls = {};
    if (req.files) {
      const filePromises = Object.entries(req.files).map(async ([fieldName, files]) => {
        if (files && files.length > 0) {
          const result = await uploadToCloudinary(files[0]);
          fileUrls[fieldName] = { secure_url: result.secure_url, public_id: result.public_id };
          if (currentData[fieldName]?.public_id) {
            await deleteFromCloudinary(currentData[fieldName].public_id);
          }
        }
      });
      await Promise.all(filePromises);
    }

    const updatedData = {
      fullName: updates.fullName || currentData.fullName,
      email: updates.email || currentData.email,
      phone: updates.phone || currentData.phone,
      address: updates.address || currentData.address,
      experience: updates.experience || currentData.experience,
      transport: updates.transport || currentData.transport,
      availability: updates.availability || currentData.availability,
      motivation: updates.motivation || currentData.motivation,
      idDocument: fileUrls.idDocument || currentData.idDocument,
      drivingLicense: fileUrls.drivingLicense || currentData.drivingLicense,
      profilePicture: fileUrls.profilePicture || currentData.profilePicture,
      updatedAt: new Date().toISOString(),
      userId: currentData.userId,
      status: updates.status || currentData.status,
    };

    await db.collection(collectionName).doc(courierId).set(updatedData, { merge: true });

    res.status(200).json({
      message: `${collectionName} mis à jour avec succès`,
      data: updatedData,
    });
  } catch (error) {
    console.error(`Erreur mise à jour ${collectionName}:`, error);
    res.status(500).json({ error: `Erreur lors de la mise à jour du ${collectionName}`, details: error.message });
  }
};

// Supprimer un coursier
const deleteCourier = async (req, res, collectionName) => {
  try {
    const courierId = req.params.id;
    const courierDoc = await db.collection(collectionName).doc(courierId).get();

    if (!courierDoc.exists) {
      return res.status(404).json({ error: `${collectionName} non trouvé` });
    }

    const courierData = courierDoc.data();
    const fileFields = ['idDocument', 'drivingLicense', 'profilePicture'];
    const deletePromises = fileFields.map(field => deleteFromCloudinary(courierData[field]?.public_id));

    await Promise.all(deletePromises);
    await db.collection(collectionName).doc(courierId).delete();

    res.status(200).json({
      message: `${collectionName} supprimé avec succès`,
    });
  } catch (error) {
    console.error(`Erreur suppression ${collectionName}:`, error);
    res.status(500).json({ error: `Erreur lors de la suppression du ${collectionName}`, details: error.message });
  }
};

// Routes coursiers
app.get('/api/coursiers/:id', authenticateUser, restrictToAdmin, (req, res) => getCourier(req, res, 'coursiers'));
app.get('/api/coursiers', authenticateUser, restrictToAdmin, (req, res) => getAllCouriers(req, res, 'coursiers'));
app.patch(
  '/api/coursiers/:id',
  authenticateUser,
  restrictToAdmin,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
  ]),
  (req, res) => updateCourier(req, res, 'coursiers')
);
app.delete('/api/coursiers/:id', authenticateUser, restrictToAdmin, (req, res) => deleteCourier(req, res, 'coursiers'));

// Route coursiers disponibles
app.get('/api/truecoursiers/available', async (req, res) => {
  try {
    const snapshot = await db.collection('truecoursiers').where('status', '==', 'ACTIVE').get();
    const coursiers = snapshot.docs.map(doc => ({
      id: doc.id,
      fullName: doc.data().fullName,
      profilePicture: doc.data().profilePicture?.secure_url || null,
      transport: doc.data().transport,
      rating: doc.data().rating || 4.8,
      deliveriesCount: doc.data().deliveriesCount || 0,
    }));

    res.status(200).json({
      message: 'Coursiers disponibles récupérés avec succès',
      data: coursiers,
    });
  } catch (error) {
    console.error('Erreur récupération coursiers disponibles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des coursiers', details: error.message });
  }
});

// Soumettre un avis
app.post('/api/feedback/submit', authenticateUser, async (req, res) => {
  try {
    const { orderId, courierId, rating, comment } = req.body;

    const requiredFields = ['orderId', 'courierId', 'rating'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Le champ ${field} est requis` });
      }
    }

    const orderDoc = await db.collection('commandes').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    const orderData = orderDoc.data();
    if (orderData.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'La commande n\'est pas encore livrée' });
    }
    if (orderData.clientId !== req.user.uid) {
      return res.status(403).json({ error: 'Non autorisé à noter cette commande' });
    }

    const courierDoc = await db.collection('truecoursiers').doc(courierId).get();
    if (!courierDoc.exists) {
      return res.status(404).json({ error: 'Coursier non trouvé' });
    }

    const existingFeedback = await db.collection('feedback')
      .where('orderId', '==', orderId)
      .where('clientId', '==', req.user.uid)
      .get();
    if (!existingFeedback.empty) {
      return res.status(400).json({ error: 'Vous avez déjà soumis un avis pour cette commande' });
    }

    const feedbackData = {
      orderId,
      courierId,
      clientId: req.user.uid,
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };
    const feedbackRef = await db.collection('feedback').add(feedbackData);

    const feedbackSnapshot = await db.collection('feedback').where('courierId', '==', courierId).get();
    const ratings = feedbackSnapshot.docs.map(doc => doc.data().rating);
    ratings.push(feedbackData.rating);
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    await db.collection('truecoursiers').doc(courierId).update({
      rating: averageRating,
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Avis soumis avec succès',
      data: { id: feedbackRef.id, ...feedbackData },
    });
  } catch (error) {
    console.error('Erreur soumission avis:', error);
    res.status(500).json({ error: 'Erreur lors de la soumission de l\'avis', details: error.message });
  }
});

// Commandes utilisateur
app.get('/api/commandes/user', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection('commandes')
      .where('clientId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      message: 'Commandes récupérées avec succès',
      data: orders,
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes', details: error.message });
  }
});

// Commande spécifique
app.get('/api/commandes/:id', authenticateUser, async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderDoc = await db.collection('commandes').doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.status(200).json({
      message: 'Commande récupérée avec succès',
      data: { id: orderDoc.id, ...orderDoc.data() },
    });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande', details: error.message });
  }
});

// Routes truecoursiers
app.get('/api/truecoursiers/:id', authenticateUser, restrictToAdmin, (req, res) => getCourier(req, res, 'truecoursiers'));
app.get('/api/truecoursiers', authenticateUser, restrictToAdmin, (req, res) => getAllCouriers(req, res, 'truecoursiers'));
app.patch(
  '/api/truecoursiers/:id',
  authenticateUser,
  restrictToAdmin,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
  ]),
  (req, res) => updateCourier(req, res, 'truecoursiers')
);
app.delete('/api/truecoursiers/:id', authenticateUser, restrictToAdmin, (req, res) => deleteCourier(req, res, 'truecoursiers'));

// Toutes les commandes
app.get('/api/commandes', authenticateUser, restrictToAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startAt = (page - 1) * limit;

    const snapshot = await db.collection('commandes')
      .orderBy('createdAt', 'desc')
      .offset(startAt)
      .limit(limit)
      .get();

    const totalSnapshot = await db.collection('commandes').get();
    const total = totalSnapshot.size;

    const commandes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      data: commandes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Coursier public
app.get('/api/truecoursiers/:id/public', authenticateUser, async (req, res) => {
  try {
    const courierId = req.params.id;
    const courierDoc = await db.collection('truecoursiers').doc(courierId).get();

    if (!courierDoc.exists) {
      return res.status(404).json({ error: 'Coursier non trouvé' });
    }

    const courierData = courierDoc.data();
    res.status(200).json({
      message: 'Coursier récupéré avec succès',
      data: {
        id: courierDoc.id,
        fullName: courierData.fullName,
        profilePicture: courierData.profilePicture || null,
        transport: courierData.transport,
        rating: courierData.rating || 4.8,
        deliveriesCount: courierData.deliveriesCount || 0,
      },
    });
  } catch (error) {
    console.error('Erreur récupération coursier:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du coursier', details: error.message });
  }
});

// Créer commande
app.post('/api/commandes/create', authenticateUser, async (req, res) => {
  try {
    const {
      clientId,
      pickupAddress,
      deliveryAddress,
      packageType,
      weight,
      urgency,
      scheduledDate,
      specialInstructions,
      insurance,
      amount,
      status,
      distance,
      estimatedTime,
      courierId,
    } = req.body;

    const requiredFields = [
      'clientId',
      'pickupAddress',
      'deliveryAddress',
      'packageType',
      'weight',
      'urgency',
      'scheduledDate',
      'amount',
      'status',
      'distance',
      'estimatedTime',
      'courierId',
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Le champ ${field} est requis` });
      }
    }

    if (!pickupAddress.lat || !pickupAddress.lng || !deliveryAddress.lat || !deliveryAddress.lng) {
      return res.status(400).json({ error: 'Coordonnées (lat, lng) requises' });
    }
    if (
      typeof pickupAddress.lat !== 'number' ||
      typeof pickupAddress.lng !== 'number' ||
      typeof deliveryAddress.lat !== 'number' ||
      typeof deliveryAddress.lng !== 'number'
    ) {
      return res.status(400).json({ error: 'Coordonnées doivent être des nombres' });
    }

    if (!['small', 'medium', 'large'].includes(packageType)) {
      return res.status(400).json({ error: 'Type de colis invalide' });
    }
    if (!['standard', 'express', 'urgent'].includes(urgency)) {
      return res.status(400).json({ error: 'Urgence invalide' });
    }
    if (!['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    if (typeof weight !== 'number' || weight <= 0) {
      return res.status(400).json({ error: 'Poids invalide' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    if (typeof distance !== 'number' || distance <= 0) {
      return res.status(400).json({ error: 'Distance invalide' });
    }

    if (clientId !== req.user.uid) {
      return res.status(403).json({ error: 'Non autorisé à créer pour un autre utilisateur' });
    }

    const courierDoc = await db.collection('truecoursiers').doc(courierId).get();
    if (!courierDoc.exists || !courierDoc.data().availability) {
      return res.status(400).json({ error: 'Coursier invalide ou non disponible' });
    }

    const orderData = {
      clientId,
      pickupAddress: {
        address: pickupAddress.address || '',
        lat: pickupAddress.lat,
        lng: pickupAddress.lng,
      },
      deliveryAddress: {
        address: deliveryAddress.address || '',
        lat: deliveryAddress.lat,
        lng: deliveryAddress.lng,
      },
      packageType,
      weight,
      urgency,
      scheduledDate,
      specialInstructions: specialInstructions || '',
      insurance: !!insurance,
      amount,
      status,
      distance,
      estimatedTime,
      courierId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orderRef = db.collection('commandes').doc();
    const courierRef = db.collection('truecoursiers').doc(courierId);

    await db.runTransaction(async (transaction) => {
      transaction.set(orderRef, orderData);
      transaction.update(courierRef, {
        deliveriesCount: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });
    });

    // Notification au client
    await sendNotification(
      clientId,
      'Commande créée',
      `Votre commande #${orderRef.id} a été créée avec succès.`,
      'ORDER',
      { orderId: orderRef.id }
    );

    // Notification au coursier
    await sendNotification(
      courierId,
      'Nouvelle commande assignée',
      `Vous avez une nouvelle commande #${orderRef.id} à traiter.`,
      'ORDER',
      { orderId: orderRef.id }
    );

    // Notification aux admins
    await notifyAdmins(
      'Nouvelle commande',
      `Une nouvelle commande #${orderRef.id} a été créée par ${clientId}.`,
      'NEW_ORDER',
      { orderId: orderRef.id }
    );

    const createdOrder = await orderRef.get();
    res.status(201).json({
      message: 'Commande créée avec succès',
      data: { id: orderRef.id, ...createdOrder.data() },
    });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande', details: error.message });
  }
});

// Mettre à jour commande
app.patch('/api/commandes/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const commandeRef = db.collection('commandes').doc(id);
    const doc = await commandeRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    await commandeRef.update({ status, updatedAt: new Date().toISOString() });

    const orderData = doc.data();
    await sendNotification(
      orderData.clientId,
      'Mise à jour de commande',
      `Votre commande #${id} est maintenant ${status}.`,
      'ORDER_UPDATE',
      { orderId: id }
    );

    res.status(200).json({ data: { id, status } });
  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Supprimer commande
app.delete('/api/commandes/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const commandeRef = db.collection('commandes').doc(id);
    const doc = await commandeRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    await commandeRef.delete();
    res.status(200).json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression commande:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Récupérer clients
app.get('/api/clients', [authenticateUser, restrictToAdmin], async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').where('role', '==', 'client').get();
    const clients = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        id: doc.id,
        name: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        email: userData.email || 'Inconnu',
        phone: userData.phoneNumber || 'Inconnu',
        address: userData.address || 'Inconnue',
      };
    });

    res.status(200).json({ data: clients });
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des clients', details: error.message });
  }
});

// Récupérer paramètres
app.get('/api/settings', authenticateUser, restrictToAdmin, async (req, res) => {
  try {
    const settingsDoc = await db.collection('parametres').doc('general').get();
    if (!settingsDoc.exists) {
      return res.status(404).json({ error: 'Paramètres non trouvés' });
    }

    const settingsData = settingsDoc.data();
    const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    const adminUsers = adminUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().displayName || `${doc.data().firstName || ''} ${doc.data().lastName || ''}`,
      email: doc.data().email || 'Inconnu',
    }));

    const responseData = {
      deliveryPrices: settingsData.deliveryPrices || { distance: 0, weight: 0, vehicleType: 'moto' },
      promotion: settingsData.promotion || { code: '', discount: 0, active: false },
      coverageZones: settingsData.coverageZones || [],
      vehicleTypes: settingsData.vehicleTypes || ['moto', 'voiture', 'vélo'],
      companyInfo: settingsData.companyInfo || {
        name: 'Dynamism Express',
        email: 'contact@dynamismexpress.com',
        address: '123 Rue de Paris, France',
      },
      adminUsers,
    };

    res.status(200).json({ data: responseData });
  } catch (error) {
    console.error('Erreur récupération paramètres:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres', details: error.message });
  }
});

// Mettre à jour paramètres
app.patch('/api/settings', authenticateUser, restrictToAdmin, async (req, res) => {
  try {
    const { deliveryPrices, promotion, coverageZones, vehicleTypes, companyInfo } = req.body;

    const settingsData = { updatedAt: new Date().toISOString() };

    if (deliveryPrices) {
      settingsData.deliveryPrices = {
        distance: parseFloat(deliveryPrices.distance) || 0,
        weight: parseFloat(deliveryPrices.weight) || 0,
        vehicleType: deliveryPrices.vehicleType || 'moto',
      };
    }
    if (promotion) {
      settingsData.promotion = {
        code: promotion.code || '',
        discount: parseInt(promotion.discount) || 0,
        active: !!promotion.active,
      };
    }
    if (coverageZones) {
      settingsData.coverageZones = Array.isArray(coverageZones) ? coverageZones : [];
    }
    if (vehicleTypes) {
      settingsData.vehicleTypes = Array.isArray(vehicleTypes) ? vehicleTypes : ['moto', 'voiture', 'vélo'];
    }
    if (companyInfo) {
      settingsData.companyInfo = {
        name: companyInfo.name || 'Dynamism Express',
        email: companyInfo.email || 'contact@dynamismexpress.com',
        address: companyInfo.address || '123 Rue de Paris, France',
      };
    }

    if (Object.keys(settingsData).length <= 1) {
      return res.status(400).json({ error: 'Aucun champ valide fourni pour la mise à jour' });
    }

    await db.collection('parametres').doc('general').set(settingsData, { merge: true });
    res.status(200).json({ message: 'Paramètres mis à jour avec succès', data: settingsData });
  } catch (error) {
    console.error('Erreur mise à jour paramètres:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres', details: error.message });
  }
});

// Commandes client
app.get('/api/clients/:clientId/orders', [authenticateUser, restrictToAdmin], async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ error: 'ID du client requis' });
    }

    const ordersSnapshot = await db.collection('commandes').where('clientId', '==', clientId).get();
    const orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.createdAt || new Date().toISOString(),
        amount: `${(data.amount || 0).toFixed(2)} €`,
        status: data.status || 'Inconnu',
      };
    });

    res.status(200).json({ data: orders });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes', details: error.message });
  }
});

// Approuver coursier
app.post('/api/coursiers/:id/approve', authenticateUser, restrictToAdmin, async (req, res) => {
  try {
    const courierId = req.params.id;
    const courierDoc = await db.collection('coursiers').doc(courierId).get();

    if (!courierDoc.exists) {
      return res.status(404).json({ error: 'Coursier non trouvé dans coursiers' });
    }

    const courierData = courierDoc.data();
    const trueCourierData = {
      ...courierData,
      deliveriesCount: 0,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    await db.collection('truecoursiers').doc(courierId).set(trueCourierData);
    await db.collection('coursiers').doc(courierId).delete();

    res.status(200).json({
      message: 'Coursier transféré vers truecoursiers',
      data: { id: courierId, ...trueCourierData },
    });
  } catch (error) {
    console.error('Erreur transfert coursier:', error);
    res.status(500).json({ error: 'Erreur lors du transfert du coursier', details: error.message });
  }
});

// Info utilisateur
app.get('/api/users/me', authenticateUser, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const userData = userDoc.data();
    res.status(200).json({
      message: 'Utilisateur récupéré avec succès',
      data: {
        uid: userDoc.id,
        displayName: userData.displayName || '',
        email: userData.email || '',
        address: userData.address || '',
        phoneNumber: userData.phoneNumber || '',
        primaryColor: userData.primaryColor || '#3B82F6',
        dashboardLayout: userData.dashboardLayout || [
          'orders',
          'tracking',
          'profile',
          'promotions',
          'stats',
          'quickOrder',
        ],
      },
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur', details: error.message });
  }
});

// Mettre à jour préférences
app.patch('/api/users/preferences', authenticateUser, async (req, res) => {
  try {
    const { primaryColor, dashboardLayout } = req.body;
    const updates = {};

    if (primaryColor) {
      if (!/^#[0-9A-F]{6}$/i.test(primaryColor)) {
        return res.status(400).json({ error: 'primaryColor doit être un code hexadécimal valide (ex: #3B82F6)' });
      }
      updates.primaryColor = primaryColor;
    }

    if (dashboardLayout) {
      if (!Array.isArray(dashboardLayout) || dashboardLayout.length === 0) {
        return res.status(400).json({ error: 'dashboardLayout doit être un tableau non vide' });
      }
      const validLayouts = ['orders', 'tracking', 'profile', 'promotions', 'stats', 'quickOrder'];
      if (!dashboardLayout.every(item => validLayouts.includes(item))) {
        return res.status(400).json({ error: 'dashboardLayout contient des éléments invalides' });
      }
      updates.dashboardLayout = dashboardLayout;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    updates.updatedAt = new Date().toISOString();
    await db.collection('users').doc(req.user.uid).set(updates, { merge: true });

    res.status(200).json({
      message: 'Préférences mises à jour avec succès',
      data: updates,
    });
  } catch (error) {
    console.error('Erreur mise à jour préférences:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des préférences', details: error.message });
  }
});

// Envoyer notification
app.post('/api/notifications/send', authenticateUser, restrictToAdmin, async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    console.log(`📩 Requête /api/notifications/send pour userId: ${userId}, title: ${title}`);

    if (!userId || !title || !message) {
      console.error('❌ Champs manquants dans la requête');
      return res.status(400).json({ error: 'userId, title et message sont requis' });
    }

    if (title.length > 100 || message.length > 500) {
      console.error('❌ Titre ou message trop long');
      return res.status(400).json({ error: 'Le titre ne doit pas dépasser 100 caractères et le message 500 caractères' });
    }

    if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(title) || !/^[a-zA-Z0-9\s.,!?'-]+$/.test(message)) {
      console.error('❌ Caractères non autorisés dans le titre ou le message');
      return res.status(400).json({ error: 'Caractères non autorisés dans le titre ou le message' });
    }

    const result = await sendNotification(userId, title, message, 'ADMIN_MESSAGE');
    if (!result.success) {
      console.error(`❌ Échec envoi notification: ${result.error}`);
      return res.status(400).json({ error: result.error });
    }

    console.log(`✅ Notification envoyée avec succès à ${userId}`);
    res.status(200).json({ message: 'Notification envoyée avec succès' });
  } catch (error) {
    console.error('❌ Erreur générale envoi notification:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification', details: error.message });
  }
});

app.post('/api/notifications/register', authenticateUser, async (req, res) => {
  try {
    const { fcmToken, userId } = req.body;
    const authenticatedUserId = req.user.uid;
    console.log(`📥 Requête /api/notifications/register reçue pour userId: ${userId || 'undefined'}, authenticatedUserId: ${authenticatedUserId}, fcmToken: ${fcmToken || 'null'}`);

    if (userId && userId !== authenticatedUserId) {
      console.error('❌ userId fourni ne correspond pas à l\'utilisateur authentifié');
      return res.status(403).json({ error: 'userId non autorisé' });
    }

    const effectiveUserId = authenticatedUserId;

    const userDoc = await db.collection('users').doc(effectiveUserId).get();
    if (!userDoc.exists) {
      console.error(`❌ Utilisateur ${effectiveUserId} non trouvé dans Firestore`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    await db.collection('users').doc(effectiveUserId).set(
      { fcmToken: fcmToken || null, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    console.log(`✅ Token FCM enregistré dans Firestore pour: ${effectiveUserId}`);
    res.status(200).json({ message: 'Token FCM enregistré avec succès', fcmToken: fcmToken || null });
  } catch (error) {
    console.error('❌ Erreur enregistrement fcmToken:', error.message, error.stack);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du token FCM', details: error.message });
  }
});

// Récupérer notifications
app.get('/api/notifications', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log(`📥 Requête /api/notifications pour userId: ${userId}`);

    const notificationsSnapshot = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const notifications = notificationsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        type: data.type || 'UNKNOWN',
        data: data.data || {},
        createdAt: data.createdAt || new Date().toISOString(),
        read: data.read || false,
      };
    });

    console.log(`✅ ${notifications.length} notifications récupérées pour ${userId}`);
    res.status(200).json({ data: notifications });
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications', details: error.message });
  }
});

// Marquer les notifications comme lues
app.post('/api/notifications/mark-read', authenticateUser, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.uid;
    console.log(`📩 Requête /api/notifications/mark-read pour userId: ${userId}, notificationIds:`, notificationIds);

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      console.error('❌ notificationIds invalide');
      return res.status(400).json({ error: 'notificationIds doit être un tableau non vide' });
    }

    const batch = db.batch();
    for (const id of notificationIds) {
      const notificationRef = db.collection('notifications').doc(id);
      batch.update(notificationRef, { read: true, updatedAt: new Date().toISOString() });
    }

    await batch.commit();
    console.log(`✅ ${notificationIds.length} notifications marquées comme lues pour ${userId}`);
    res.status(200).json({ message: 'Notifications marquées comme lues' });
  } catch (error) {
    console.error('❌ Erreur marquage notifications:', error);
    res.status(500).json({ error: 'Erreur lors du marquage des notifications', details: error.message });
  }
});

// Récupérer interactions
app.get('/api/interactions', authenticateUser, async (req, res) => {
  try {
    const snapshot = await db.collection('interactions')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    const interactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      message: 'Interactions récupérées avec succès',
      data: interactions,
    });
  } catch (error) {
    console.error('Erreur récupération interactions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des interactions', details: error.message });
  }
});

app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      console.error('Email manquant dans la requête');
      return res.status(400).json({ error: 'L\'email est requis' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`Email invalide: ${email}`);
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Check if email already exists
    const userMailRef = db.collection('user-mail');
    const querySnapshot = await userMailRef.where('email', '==', email).get();

    if (!querySnapshot.empty) {
      console.log(`Email déjà inscrit: ${email}`);
      return res.status(400).json({ error: 'Cet email est déjà inscrit à la newsletter' });
    }

    // Add email to Firestore
    await userMailRef.add({
      email,
      createdAt: new Date().toISOString(),
    });

    console.log(`Email inscrit avec succès: ${email}`);
    res.status(201).json({ message: 'Inscription à la newsletter réussie' });
  } catch (error) {
    console.error('Erreur inscription newsletter:', error.message, error.stack);
    res.status(500).json({ error: 'Erreur lors de l\'inscription à la newsletter', details: error.message });
  }
});// Add this route before the server start (app.listen)

// Submit contact form message
app.post('/api/contact/submit', async (req, res) => {
  try {
    const { name, email, message, userId } = req.body;

    // Validate input
    if (!name || !email || !message) {
      console.error('Champs manquants dans la requête:', { name, email, message });
      return res.status(400).json({ error: 'Le nom, l\'email et le message sont requis' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`Email invalide: ${email}`);
      return res.status(400).json({ error: 'Email invalide' });
    }

    if (name.length > 100) {
      console.error(`Nom trop long: ${name}`);
      return res.status(400).json({ error: 'Le nom ne doit pas dépasser 100 caractères' });
    }

    if (message.length > 1000) {
      console.error(`Message trop long: ${message.length} caractères`);
      return res.status(400).json({ error: 'Le message ne doit pas dépasser 1000 caractères' });
    }

    // Use provided userId or default to 'anonymous'
    const validatedUserId = userId && typeof userId === 'string' ? userId.trim() : 'anonymous';

    // Add message to Firestore
    const userSmsRef = db.collection('user-sms');
    await userSmsRef.add({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      userId: validatedUserId,
      createdAt: new Date().toISOString(),
    });

    console.log(`Message enregistré avec succès: ${email}, userId: ${validatedUserId}`);
    res.status(201).json({ message: 'Message envoyé avec succès' });
  } catch (error) {
    console.error('Erreur envoi message:', error.message, error.stack);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message', details: error.message });
  }
});

app.get('/api/messages', verifyToken, async (req, res) => {
  try {
    const messagesSnapshot = await db.collection('user-sms').get();
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Récupération de ${messages.length} messages`);
    res.status(200).json({ data: messages });
  } catch (error) {
    console.error('Erreur récupération messages:', error.message, error.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// Route pour envoyer un email de vérification
app.post('/api/auth/send-verification-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    try {
      const userRecord = await auth.getUserByEmail(email);
      if (userRecord.emailVerified) {
        return res.status(400).json({ error: 'Cet email est déjà vérifié' });
      }

      const actionCodeSettings = {
        url: 'http://localhost:5173/login', // Modifier ici pour rediriger vers /login
        handleCodeInApp: true,
      };

      const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);
      await sendVerificationEmail(email, verificationLink);
      console.log(`Email de vérification envoyé à ${email}`);

      res.status(200).json({ message: 'Email de vérification envoyé' });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur envoi email de vérification:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de vérification', details: error.message });
  }
});

app.use("/", (req, res)=>{
  res.send("Le server est lancé déjà...")
})

// Démarrer serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});