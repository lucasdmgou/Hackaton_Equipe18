const express = require("express");
const router = express.Router();

// Importa o controller correspondente
const socketGameController = require("../controllers/mechanics/socketscontroller.js");

const animGameController = require("../controllers/mechanics/anim.js");

// Em vez de criar a função aqui, você chama a que está no Controller
router.get("/anim", animGameController.renderAnim);

// Rota POST que vai processar os dados enviados pelo formulário
router.post("/socket", socketGameController.renderSockets);

module.exports = router;