const { rooms } = require("../../data/memoryStore");

const activeGames = {};
const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 320;
const PUNCH_RANGE = 34;
const PUNCH_EXTENSION = 22;
const PUNCH_COOLDOWN_MS = 550;
const KNOCKBACK_DISTANCE = 30;

const collisionAreas = [
    { id: "cerca", x: 18, y: 18, width: 76, height: 55 },
    { id: "casa", x: 208, y: 8, width: 68, height: 82 },
    { id: "arvore-esquerda-topo", x: 23, y: 106, width: 23, height: 33 },
    { id: "arvore-esquerda-grande", x: 18, y: 178, width: 50, height: 36 },
    { id: "arvore-centro", x: 207, y: 160, width: 25, height: 23 },
    { id: "arvore-centro-baixo", x: 252, y: 199, width: 28, height: 25 },
    { id: "arvore-direita-topo", x: 441, y: 125, width: 25, height: 35 },
    { id: "arvore-direita-baixo", x: 441, y: 221, width: 25, height: 36 },
    { id: "rocha-inferior", x: 190, y: 270, width: 85, height: 43 },
    { id: "tronco-esquerda", x: 28, y: 291, width: 24, height: 13 },
    { id: "tronco-meio", x: 93, y: 290, width: 25, height: 13 },
    { id: "toco-direita", x: 418, y: 292, width: 14, height: 13 }
];

const playerCollisionBox = {
    offsetX: -7,
    offsetY: -6,
    width: 14,
    height: 20
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getDirectionVector(direction = "down") {
    const vectors = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
        "up-left": { x: -0.7071, y: -0.7071 },
        "up-right": { x: 0.7071, y: -0.7071 },
        "down-left": { x: -0.7071, y: 0.7071 },
        "down-right": { x: 0.7071, y: 0.7071 }
    };

    return vectors[direction] || vectors.down;
}

function getPlayerCollisionBox(x, y) {
    return {
        x: x + playerCollisionBox.offsetX,
        y: y + playerCollisionBox.offsetY,
        width: playerCollisionBox.width,
        height: playerCollisionBox.height
    };
}

function rectanglesOverlap(first, second) {
    return first.x < second.x + second.width &&
        first.x + first.width > second.x &&
        first.y < second.y + second.height &&
        first.y + first.height > second.y;
}

function hitsObstacle(x, y) {
    const playerBox = getPlayerCollisionBox(x, y);
    return collisionAreas.some(area => rectanglesOverlap(playerBox, area));
}

function getKnockbackPosition(playerPosition, vector) {
    const nextX = clamp(playerPosition.x + vector.x * KNOCKBACK_DISTANCE, 14, WORLD_WIDTH - 14);
    const startedInsideObstacle = hitsObstacle(playerPosition.x, playerPosition.y);
    let x = playerPosition.x;
    let y = playerPosition.y;

    if (!hitsObstacle(nextX, y) || startedInsideObstacle) {
        x = nextX;
    }

    const nextY = clamp(y + vector.y * KNOCKBACK_DISTANCE, 22, WORLD_HEIGHT - 18);
    const stillInsideObstacle = hitsObstacle(x, y);

    if (!hitsObstacle(x, nextY) || stillInsideObstacle) {
        y = nextY;
    }

    return { x, y };
}

function getDistance(first, second) {
    const dx = first.x - second.x;
    const dy = first.y - second.y;

    return Math.sqrt(dx * dx + dy * dy);
}

function findRoomByCode(roomCode) {
    return rooms.find(room => room.code === String(roomCode).trim().toUpperCase());
}

function getPublicQuestion(question) {
    return {
        id: question.id,
        text: question.text,
        options: question.options,
        timeLimit: question.timeLimit
    };
}

function getRoomPlayers(room) {
    return room.players.map(player => ({
        id: player.id,
        nickname: player.nickname,
        hearts: player.hearts,
        score: player.score
    }));
}

function getRoomQuestions(room) {
    return room.questions || [];
}

function createGameState(roomCode) {
    return {
        roomCode,
        currentQuestionIndex: 0,
        answeredPlayers: {},
        positions: {},
        questionStartedAt: Date.now(),
        timeoutId: null,
        finished: false,
        resolvingQuestion: false,
        connectedPlayers: {},
        lastPunchAt: {}
    };
}

function emitQuestion(io, roomCode) {
    const state = activeGames[roomCode];
    const room = findRoomByCode(roomCode);

    if (!state || !room || state.finished) {
        return;
    }

    const questions = getRoomQuestions(room);
    const question = questions[state.currentQuestionIndex];

    if (!question) {
        finishGame(io, roomCode);
        return;
    }

    io.to(roomCode).emit("questionChanged", {
        question: getPublicQuestion(question),
        questionIndex: state.currentQuestionIndex + 1,
        totalQuestions: questions.length,
        startedAt: state.questionStartedAt
    });
}

function finishGame(io, roomCode) {
    const room = findRoomByCode(roomCode);
    const state = activeGames[roomCode];

    if (!room || !state) {
        return;
    }

    state.finished = true;
    room.status = "finished";

    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
    }

    const ranking = [...room.players].sort((a, b) => b.score - a.score);

    io.to(roomCode).emit("gameFinished", {
        ranking
    });
}

function startQuestionTimer(io, roomCode) {
    const state = activeGames[roomCode];
    const room = findRoomByCode(roomCode);

    if (!state || !room || state.finished) {
        return;
    }

    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
    }

    const question = getRoomQuestions(room)[state.currentQuestionIndex];

    if (!question) {
        finishGame(io, roomCode);
        return;
    }

    state.timeoutId = setTimeout(() => {
        room.players.forEach(player => {
            const alreadyAnswered = state.answeredPlayers[player.id];

            if (!alreadyAnswered && player.hearts > 0) {
                player.hearts = Math.max(0, player.hearts - 1);
            }
        });

        io.to(roomCode).emit("timeEnded", {
            players: getRoomPlayers(room)
        });

        goToNextQuestion(io, roomCode);
    }, question.timeLimit * 1000);
}

function startQuestion(io, roomCode) {
    const state = activeGames[roomCode];

    if (!state || state.finished) {
        return;
    }

    state.answeredPlayers = {};
    state.questionStartedAt = Date.now();
    state.resolvingQuestion = false;

    emitQuestion(io, roomCode);
    startQuestionTimer(io, roomCode);
}

function goToNextQuestion(io, roomCode) {
    const state = activeGames[roomCode];
    const room = findRoomByCode(roomCode);

    if (!state || !room || state.finished) {
        return;
    }

    if (state.resolvingQuestion) {
        return;
    }

    state.resolvingQuestion = true;

    const currentQuestion = getRoomQuestions(room)[state.currentQuestionIndex];

    if (currentQuestion) {
        io.to(roomCode).emit("questionResolved", {
            correctAnswer: currentQuestion.correctAnswer,
            players: getRoomPlayers(room)
        });
    }

    setTimeout(() => {
        const questions = getRoomQuestions(room);

        if (state.currentQuestionIndex >= questions.length - 1) {
            finishGame(io, roomCode);
            return;
        }

        state.currentQuestionIndex += 1;
        startQuestion(io, roomCode);
    }, 2000);
}

function allActiveAlivePlayersAnswered(room, state) {
    const activeAlivePlayers = room.players.filter(player => {
        return player.hearts > 0 && state.connectedPlayers[player.id];
    });

    if (activeAlivePlayers.length === 0) {
        return true;
    }

    return activeAlivePlayers.every(player => state.answeredPlayers[player.id]);
}

function setupGameSocket(io) {
    io.on("connection", socket => {
        socket.on("joinGame", ({ roomCode, player }) => {
            roomCode = String(roomCode).trim().toUpperCase();
            const room = findRoomByCode(roomCode);

            if (!room || !player) {
                socket.emit("gameError", "Sala ou jogador não encontrado.");
                return;
            }

            socket.join(roomCode);
            room.status = "playing";

            if (!activeGames[roomCode]) {
                activeGames[roomCode] = createGameState(roomCode);
                startQuestion(io, roomCode);
            }

            const state = activeGames[roomCode];
            state.connectedPlayers[player.id] = true;

            if (!state.positions[player.id]) {
                state.positions[player.id] = {
                    id: player.id,
                    nickname: player.nickname,
                    x: 240,
                    y: 170,
                    direction: "down",
                    moving: false
                };
            }

            socket.data.roomCode = roomCode;
            socket.data.playerId = player.id;

            emitQuestion(io, roomCode);

            io.to(roomCode).emit("playersUpdated", {
                players: getRoomPlayers(room),
                positions: state.positions
            });
        });

        socket.on("playerMove", ({ roomCode, playerId, x, y, direction, moving }) => {
            roomCode = String(roomCode).trim().toUpperCase();
            const state = activeGames[roomCode];
            const room = findRoomByCode(roomCode);

            if (!state || !room || !state.positions[playerId]) {
                return;
            }

            state.positions[playerId] = {
                ...state.positions[playerId],
                x,
                y,
                direction,
                moving
            };

            socket.to(roomCode).emit("playersUpdated", {
                players: getRoomPlayers(room),
                positions: state.positions
            });
        });

        socket.on("playerPunch", ({ roomCode, playerId }) => {
            roomCode = String(roomCode).trim().toUpperCase();
            const state = activeGames[roomCode];
            const room = findRoomByCode(roomCode);

            if (!state || !room || !state.positions[playerId]) {
                return;
            }

            const now = Date.now();

            if (state.lastPunchAt[playerId] && now - state.lastPunchAt[playerId] < PUNCH_COOLDOWN_MS) {
                return;
            }

            state.lastPunchAt[playerId] = now;

            const attackerPosition = state.positions[playerId];
            const direction = attackerPosition.direction || "down";
            const vector = getDirectionVector(direction);
            const punchPoint = {
                x: attackerPosition.x + vector.x * PUNCH_EXTENSION,
                y: attackerPosition.y + vector.y * PUNCH_EXTENSION
            };
            const hitPlayerIds = [];

            room.players.forEach(player => {
                if (player.id === playerId || !state.connectedPlayers[player.id]) {
                    return;
                }

                const targetPosition = state.positions[player.id];
                const targetVector = {
                    x: targetPosition ? targetPosition.x - attackerPosition.x : 0,
                    y: targetPosition ? targetPosition.y - attackerPosition.y : 0
                };
                const isInFront = targetVector.x * vector.x + targetVector.y * vector.y >= 0;

                if (!targetPosition || !isInFront || getDistance(punchPoint, targetPosition) > PUNCH_RANGE) {
                    return;
                }

                const knockbackPosition = getKnockbackPosition(targetPosition, vector);
                targetPosition.x = knockbackPosition.x;
                targetPosition.y = knockbackPosition.y;
                targetPosition.moving = false;
                targetPosition.direction = direction;
                hitPlayerIds.push(player.id);
            });

            io.to(roomCode).emit("punchResult", {
                attackerId: playerId,
                direction,
                hitPlayerIds,
                positions: state.positions
            });

            if (hitPlayerIds.length > 0) {
                io.to(roomCode).emit("playersUpdated", {
                    players: getRoomPlayers(room),
                    positions: state.positions
                });
            }
        });

        socket.on("submitAnswer", ({ roomCode, playerId, answerId }) => {
            roomCode = String(roomCode).trim().toUpperCase();
            answerId = String(answerId).toUpperCase();

            const room = findRoomByCode(roomCode);
            const state = activeGames[roomCode];

            if (!room || !state || state.finished || state.answeredPlayers[playerId]) {
                return;
            }

            const player = room.players.find(p => p.id === playerId);
            const question = getRoomQuestions(room)[state.currentQuestionIndex];

            if (!player || !question || player.hearts <= 0) {
                return;
            }

            const isCorrect = question.correctAnswer === answerId;

            if (isCorrect) {
                player.score += 100;
            } else {
                player.hearts = Math.max(0, player.hearts - 1);
            }

            state.answeredPlayers[playerId] = {
                answerId,
                isCorrect
            };

            socket.emit("answerResult", {
                isCorrect,
                correctAnswer: question.correctAnswer,
                player
            });

            io.to(roomCode).emit("playersUpdated", {
                players: getRoomPlayers(room),
                positions: state.positions
            });

            if (allActiveAlivePlayersAnswered(room, state)) {
                if (state.timeoutId) {
                    clearTimeout(state.timeoutId);
                }

                goToNextQuestion(io, roomCode);
            }
        });

        socket.on("disconnect", () => {
            const { roomCode, playerId } = socket.data;
            const state = activeGames[roomCode];

            if (state && playerId) {
                if (state.positions[playerId]) {
                    state.positions[playerId].moving = false;
                }

                delete state.connectedPlayers[playerId];
            }
        });
    });
}

const renderSockets = (req, res) => {
    res.send("sockets funcionando!");
};

module.exports = {
    setupGameSocket,
    renderSockets
};
