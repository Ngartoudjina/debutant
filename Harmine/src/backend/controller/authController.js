const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(import.meta.env.VITE_APP_GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: import.meta.env.VITE_APP_GOOGLE_CLIENT_ID, // Remplacez par votre Client ID
    });
    const payload = ticket.getPayload();
    return payload; // Contient les informations de l'utilisateur (nom, e-mail, etc.)
  } catch (error) {
    console.error("Erreur lors de la vérification du token Google :", error);
    throw error;
  }
}

// Exemple de route Express pour gérer la connexion Google
const express = require('express');
const router = express.Router();

router.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;

  try {
    const userInfo = await verifyGoogleToken(token);
    console.log("Informations de l'utilisateur :", userInfo);

    // Ici, vous pouvez enregistrer l'utilisateur dans votre base de données
    // ou créer une session pour l'utilisateur.

    res.status(200).json({ success: true, user: userInfo });
  } catch (error) {
    res.status(400).json({ success: false, message: "Échec de la vérification du token Google" });
  }
});

module.exports = router;