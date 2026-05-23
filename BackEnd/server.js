const express = require("express");
const path = require("path");

// 1. Importa os arquivos de rotas
const authRoutes = require("./routes/auth.routes");
const gameRoutes = require("./routes/game.routes");

const app = express();
const PORT = 3000;

// Middleware para parsear dados JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Permite acessar arquivos estáticos (CSS, JS do FrontEnd)
// Ajustado para apontar para a sua pasta FrontEnd real
app.use(express.static(path.join(__dirname, "..", "FrontEnd")));

// Rota base de teste
app.get("/server", (req, res) => {
    res.send("Servidor funcionando!");
});

// 2. Vincula as rotas ao servidor
// Opcional: Adicionei "/auth" como prefixo para organizar melhor
app.use("/auth", authRoutes); // O login vai virar http://localhost:3000/auth/login
app.use("/game", gameRoutes);    // O game vai virar http://localhost:3000/game

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});