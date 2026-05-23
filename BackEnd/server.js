const express = require("express");
const path = require("path");
const session = require("express-session");

const authRoutes = require("./routes/auth.routes");
const gameRoutes = require("./routes/game.routes");
const roomRoutes = require("./routes/room.routes");
const requireNickname = require("./middlewares/auth.middleware");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "segredo-hackathon-equipe18",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, "..", "FrontEnd")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "FrontEnd", "pages", "Index.html"));
});

app.get("/server", (req, res) => {
    res.send("Servidor funcionando!");
});

app.get("/lobby", requireNickname, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "FrontEnd", "pages", "lobby.html"));
});

app.use("/auth", authRoutes);
app.use("/game", gameRoutes);
app.use("/", roomRoutes);

app.get("/game/:code", requireNickname, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "FrontEnd", "pages", "game.html"));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});