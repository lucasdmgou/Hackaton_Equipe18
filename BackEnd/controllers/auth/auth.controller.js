const path = require("path");

// Função para renderizar a página de login
const renderLogin = (req, res) => {
    // Ajustando o caminho para subir 3 níveis (controllers -> BackEnd -> raiz -> FrontEnd)
    res.sendFile(path.join(__dirname, "..", "..","..", "FrontEnd", "pages", "login.html"));
};



// Exemplo de função que processaria o envio do formulário de login (POST)
const handleLogin = (req, res) => {
    const { email, password } = req.body;
    
    // Aqui iria a sua lógica de autenticação (verificar banco de dados, etc.)
    if (email === "admin@email.com" && password === "123") {
        return res.json({ message: "Login realizado com sucesso!" });
    }
    
    return res.status(401).json({ error: "Credenciais inválidas" });
};

// Função para renderizar a página de registro
const renderRegister = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "..", "..", "FrontEnd", "pages", "register.html"));
};

// Função que processa o envio do formulário de registro (POST)
const handleRegister = (req, res) => {
    const { email, password, confirmPassword } = req.body;
    
    // Aqui iria a sua lógica de registro (verificar banco de dados, etc.)
    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Senhas não correspondem" });
    }
    
    return res.json({ message: "Registro realizado com sucesso!" });
};

// Exporta as funções como um objeto
module.exports = {
    renderLogin,
    handleLogin,
    renderRegister,
    handleRegister
};