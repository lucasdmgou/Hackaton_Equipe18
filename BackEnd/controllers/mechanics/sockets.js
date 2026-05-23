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

            // Velocidade em pixels a cada clique de tecla
            // Dentro de socket.on("player_move", (direcao) => { ... })

            // Como o cliente envia comandos a quase 60fps, o passo precisa ser menor!
            const PASSO = 4; // Teste entre 3 e 5 para achar a velocidade ideal do seu jogo

            if (direcao === "up")    player.y -= PASSO;
            if (direcao === "down")  player.y += PASSO;
            if (direcao === "left")  player.x -= PASSO;
            if (direcao === "right") player.x += PASSO;

            // Envia o mapa atualizado de volta para todos
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

                // Como os quadrados têm 50px, uma distância de até 65-70px significa que eles estão colados
                const ALCANCE_ATAQUE = 70; 

                if (distanciaReal < ALCANCE_ATAQUE) {
                    vitima.hp -= 10; // Tira 10 de vida do alvo colado
                    console.log(`💥 HIT CONFIRMADO! Player ${idVitima} tomou dano e está com ${vitima.hp} HP.`);

                    if (vitima.hp <= 0) {
                        console.log(`💀 Player ${idVitima} foi mandado para o lobby.`);
                    }
                }
            });

            // Dispara para todo mundo renderizar o HP novo de quem tomou o tapa
            io.emit("atualizar_jogadores", estadoDoJogo.jogadores);
        });

        // 4. TRATA A DESCONEXÃO (Se fechar a aba ou cair a internet)
        socket.on("disconnect", () => {
            console.log(`❌ Player desconectou: ${socket.id}`);
            
            // Remove o quadrado dele da lista do servidor
            delete estadoDoJogo.jogadores[socket.id];
            
            // Atualiza o mapa de todo mundo tirando o fantasma do jogador que saiu
            io.emit("atualizar_jogadores", estadoDoJogo.jogadores);
        });
    });
};

module.exports = {
    gerenciarConexoes,
    renderSockets
};

