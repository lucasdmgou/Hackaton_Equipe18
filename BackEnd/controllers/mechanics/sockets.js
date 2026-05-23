const path = require("path");


const renderSockets = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "..", "..", "FrontEnd", "pages", "socket.html"));    
};




const estadoDoJogo = {
    jogadores: {} // Ex: { "socket_id_1": { x: 100, y: 150 }, "socket_id_2": { x: 200, y: 300 } }
};

const gerenciarConexoes = (io) => {
    io.on("connection", (socket) => {
        console.log(`🎮 Novo jogador conectado ao jogo! ID: ${socket.id}`);

        
        estadoDoJogo.jogadores[socket.id] = {room:0, x: 0, y: 0 };

    
        socket.emit("atualizar_jogadores", estadoDoJogo.jogadores);

       
        socket.on("player_move", (dadosRecebidos) => {
            
            if (estadoDoJogo.jogadores[socket.id]) {
                estadoDoJogo.jogadores[socket.id].x = dadosRecebidos.posX;
                estadoDoJogo.jogadores[socket.id].y = dadosRecebidos.posY;

                socket.broadcast.emit("update_position", {
                    idJogador: socket.id,
                    posX: dadosRecebidos.posX,
                    posY: dadosRecebidos.posY
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`❌ Jogador desconectou: ${socket.id}`);
            delete estadoDoJogo.jogadores[socket.id];
            
            io.emit("jogador_saiu", socket.id);
        });
    });
};

module.exports = {
    gerenciarConexoes,
    renderSockets
};

