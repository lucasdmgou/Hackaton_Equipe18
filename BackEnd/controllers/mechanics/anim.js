const renderAnim = (req, res) => {
    // Ajustando o caminho para subir 3 níveis (controllers -> BackEnd -> raiz -> FrontEnd)
    res.send("anim funcionando!");
};

module.exports = {
    renderAnim
};

