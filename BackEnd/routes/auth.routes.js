const express = require("express");
const router = express.Router();

// Importa o controller correspondente
const authController = require("../controllers/auth/auth.controller");

// Em vez de criar a função aqui, você chama a que está no Controller
router.get("/login", authController.renderLogin);

// Rota POST que vai processar os dados enviados pelo formulário
router.post("/login", authController.handleLogin);

module.exports = router;