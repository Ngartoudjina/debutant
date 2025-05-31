const express = require('express');
const { verifyGoogleToken } = require('../controller/authController');
const router = express.Router();

router.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;

  try {
    const userInfo = await verifyGoogleToken(token);
    console.log("Informations de l'utilisateur :", userInfo);
    res.status(200).json({ success: true, user: userInfo });
  } catch (error) {
    res.status(400).json({ success: false, message: "Échec de la vérification du token Google" });
  }
});

module.exports = router;