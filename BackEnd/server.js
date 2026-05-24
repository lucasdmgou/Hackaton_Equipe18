const express = require("express");
const path = require("path");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const gameRoutes = require("./routes/game.routes");
const questionRoutes = require("./routes/question.routes");
const roomRoutes = require("./routes/room.routes");
const requireNickname = require("./middlewares/auth.middleware");
const { setupGameSocket } = require("./controllers/mechanics/socketscontroller");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = Number(process.env.PORT) || 3000;

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
app.use("/questions", questionRoutes);
app.use("/", roomRoutes);

app.get("/game/:code", requireNickname, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "FrontEnd", "pages", "game.html"));
});

setupGameSocket(io);

server.on("error", error => {
    if (error.code === "EADDRINUSE") {
        console.error(`A porta ${PORT} ja esta em uso. Feche o outro servidor ou rode em outra porta com: npm run dev:3001`);
        process.exit(1);
    }

    throw error;
});

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
