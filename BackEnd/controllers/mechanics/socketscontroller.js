const { rooms } = require("../../data/memoryStore");

const activeGames = {};

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
        connectedPlayers: {}
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
