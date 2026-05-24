const express = require("express");
const router = express.Router();

// Importa o controller correspondente
const authController = require("../controllers/auth/auth.controller");

// Login routes
router.get("/login", authController.renderLogin);
router.post("/login", authController.handleLogin);

// Register routes
router.get("/register", authController.renderRegister);
router.post("/register", authController.handleRegister);

module.exports = router;