const path = require("path");
const { rooms } = require("../../data/memoryStore");

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function findRoomByCode(code) {
    return rooms.find(room => room.code === code.trim().toUpperCase());
}

function addPlayerToRoom(room, player) {
    const alreadyInRoom = room.players.some(p => p.id === player.id);

    if (!alreadyInRoom) {
        room.players.push({
            id: player.id,
            nickname: player.nickname,
            hearts: 3,
            score: 0
        });
    }
}

const createRoom = (req, res) => {
    const player = req.session.player;

    let code = generateRoomCode();

    while (findRoomByCode(code)) {
        code = generateRoomCode();
    }

    const room = {
        id: rooms.length + 1,
        code,
        hostPlayerId: player.id,
        status: "waiting",
        players: []
    };

    addPlayerToRoom(room, player);
    rooms.push(room);

    return res.redirect(`/room/${code}`);
};

const joinRoom = (req, res) => {
    const { code } = req.body;
    const player = req.session.player;

    if (!code || code.trim().length === 0) {
        return res.status(400).send("Informe o código da sala.");
    }

    const room = findRoomByCode(code);

    if (!room) {
        return res.status(404).send("Sala não encontrada.");
    }

    if (room.status !== "waiting") {
        return res.status(400).send("Essa sala já está em andamento.");
    }

    addPlayerToRoom(room, player);

    return res.redirect(`/room/${room.code}`);
};

const renderRoom = (req, res) => {
    const { code } = req.params;
    const player = req.session.player;
    const room = findRoomByCode(code);

    if (!room) {
        return res.status(404).send("Sala não encontrada.");
    }

    addPlayerToRoom(room, player);

    return res.sendFile(path.join(__dirname, "..", "..", "..", "FrontEnd", "pages", "room.html"));
};

const getRoomData = (req, res) => {
    const { code } = req.params;
    const room = findRoomByCode(code);

    if (!room) {
        return res.status(404).json({ error: "Sala não encontrada." });
    }

    return res.json({
        ...room,
        currentPlayer: req.session.player
    });
};

module.exports = {
    createRoom,
    joinRoom,
    renderRoom,
    getRoomData
};