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

// Exporta as funções como um objeto
module.exports = {
    renderLogin,
    handleLogin
};