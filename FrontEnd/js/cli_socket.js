// Abre a conexão WebSocket com o servidor automaticamente
const socket = io();

// Executa assim que a conexão for estabelecida com sucesso
socket.on("connect", () => {
    console.log("Conectado ao servidor via WebSocket com o ID:", socket.id);
});

// Exemplo: Enviando dados de movimentação para o servidor (pode disparar isso no loop do seu jogo)
function enviarMovimento(x, y) {
    socket.emit("player_move", { posX: x, posY: y });
}

// Exemplo: Escutando atualizações de outros jogadores vindas do servidor
socket.on("update_position", (data) => {
    console.log("Outro jogador se moveu:", data);
    // Aqui você atualizaria a posição do boneco do outro player na tela
});




