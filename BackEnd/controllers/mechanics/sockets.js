const path = require("path");


const renderSockets = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "..", "..", "FrontEnd", "pages", "socket.html"));    
};




const estadoDoJogo = {
    jogadores: {} 
};

const gerenciarConexoes = (io) => {
    
    io.on("connection", (socket) => {
        console.log(`🎮 Player conectado ao jogo: ${socket.id}`);

        // 1. Cria o quadrado do novo jogador em uma posição aleatória na tela
        // (Ajustei para nascer entre x:50-500 e y:50-400 para caber bem na arena)
        estadoDoJogo.jogadores[socket.id] = {
            x: Math.floor(Math.random() * 450) + 50,
            y: Math.floor(Math.random() * 350) + 50,
            hp: 100,
            socketId: socket.id
        };

        // Assim que ele entra, envia o estado do jogo para TODO MUNDO ver o novo quadrado
        io.emit("atualizar_jogadores", estadoDoJogo.jogadores);

        //  evento de movimento 
        socket.on("player_move", (direcao) => {
            const player = estadoDoJogo.jogadores[socket.id];
            
            // Se o player não existir na memória ou já tiver morrido, ignora o comando
            if (!player || player.hp <= 0) return;

            const PASSO = 4;

            if (direcao === "up")    player.y -= PASSO;
            if (direcao === "down")  player.y += PASSO;
            if (direcao === "left")  player.x -= PASSO;
            if (direcao === "right") player.x += PASSO;


            io.emit("atualizar_jogadores", estadoDoJogo.jogadores);
            
            io.emit("atualizar_jogadores", estadoDoJogo.jogadores);
        });

        // VENTO DE ATAQUE / HIT  
        socket.on("player_attack", () => {
            const atacante = estadoDoJogo.jogadores[socket.id];
            if (!atacante || atacante.hp <= 0) return;

            console.log(`⚔️ O jogador ${socket.id} apertou espaço para atacar!`);

            // Varre todos os outros jogadores da sala para verificar se o ataque acertou alguém
            Object.keys(estadoDoJogo.jogadores).forEach((idVitima) => {
                if (idVitima === socket.id) return; // Não pode se auto-atacar

                const vitima = estadoDoJogo.jogadores[idVitima];
                if (vitima.hp <= 0) return; // Alvo já está morto

                // Calcula a distância matemática em linha reta entre o quadrado atacante e a vítima
                const dx = atacante.x - vitima.x;
                const dy = atacante.y - vitima.y;
                const distanciaReal = Math.sqrt(dx * dx + dy * dy);

                const ALCANCE_ATAQUE = 70; 

                if (distanciaReal < ALCANCE_ATAQUE) {
                    vitima.hp -= 10; 
                    console.log(`💥 HIT CONFIRMADO! Player ${idVitima} tomou dano e está com ${vitima.hp} HP.`);

                    if (vitima.hp <= 0) {
                        console.log(`💀 Player ${idVitima} foi de arrasta.`);
                    }
                }
            });

            //renderizar o HP novo de quem tomou o tapa
            io.emit("atualizar_jogadores", estadoDoJogo.jogadores);
        });

        // TRATA A DESCONEXÃO
        socket.on("disconnect", () => {
            console.log(`❌ Player desconectou: ${socket.id}`);
            
            // Remove o quadrado dele da lista do servidor
            delete estadoDoJogo.jogadores[socket.id];
            
            io.emit("atualizar_jogadores", estadoDoJogo.jogadores);
        });
    });
};

module.exports = {
    gerenciarConexoes,
    renderSockets
};

