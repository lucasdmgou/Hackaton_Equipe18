const path = require("path");
const crypto = require("crypto");

const renderLogin = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "..", "..", "FrontEnd", "pages", "login.html"));
};

const handleLogin = (req, res) => {
    const { nickname } = req.body;

    if (!nickname || nickname.trim().length < 2) {
        return res.status(400).send("Digite um apelido com pelo menos 2 caracteres.");
    }

    req.session.player = {
        id: crypto.randomUUID(),
        nickname: nickname.trim()
    };

    return res.redirect("/lobby");
};

const renderRegister = (req, res) => {
    return res.redirect("/auth/login");
};

const handleRegister = (req, res) => {
    return handleLogin(req, res);
};

const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    });
};

module.exports = {
    renderLogin,
    handleLogin,
    renderRegister,
    handleRegister,
    logout
};