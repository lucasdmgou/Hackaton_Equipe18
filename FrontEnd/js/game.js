const roomCode = window.location.pathname.split("/").pop().toUpperCase();

const roomCodeElement = document.getElementById("room-code");
const heartsElement = document.getElementById("player-hearts");
const scoreElement = document.getElementById("player-score");
const questionCountElement = document.getElementById("question-count");
const questionTextElement = document.getElementById("question-text");
const questionOptionsElement = document.getElementById("question-options");
const questionTimerElement = document.getElementById("question-timer");
const currentAreaElement = document.getElementById("current-area");
const feedbackElement = document.getElementById("answer-feedback");
const scoreToastElement = document.getElementById("score-toast");

const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 320;
const socket = io();
const background = new Image();
background.src = "/assets/maps/arena.webp";
const correctAnswerSound = new Audio("/assets/audio/correct-answer.mp3");
correctAnswerSound.volume = 0.75;
const punchHitSound = new Audio("/assets/audio/punch-hit.mp3");
punchHitSound.volume = 0.8;

const keys = {};
const speed = 2.1;
let currentPlayer = null;
let currentQuestion = null;
let players = [];
let positions = {};
let alreadyAnswered = false;
let gameFinished = false;
let lastSentMove = 0;
let animationFrame = 0;
let viewScale = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;
let highlightedCorrectAnswer = null;
let correctAnswerHighlightStartedAt = 0;
let questionDeadlineAt = 0;
let questionTimerIntervalId = null;
let lastPunchAt = 0;
const activePunches = {};

const correctAnswerHighlightDuration = 2000;
const punchCooldown = 550;
const punchAnimationDuration = 220;
const punchReach = 26;

const answerAreas = [
    // Apenas as 2 áreas superiores do mapa
    { id: "A", label: "A", x: 67, y: 101, width: 120, height: 55 },
    { id: "B", label: "B", x: 292, y: 101, width: 120, height: 55 },
    { id: "C", label: "C", x: 67, y: 213, width: 120, height: 56 },
    { id: "D", label: "D", x: 292, y: 213, width: 120, height: 56 }
];

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

roomCodeElement.innerText = roomCode;

function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const width = Math.max(1, Math.round(wrapper.clientWidth));
    const height = Math.max(1, Math.round(wrapper.clientHeight));

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = false;
    }

    viewScale = Math.min(canvas.width / WORLD_WIDTH, canvas.height / WORLD_HEIGHT);
    viewOffsetX = (canvas.width - WORLD_WIDTH * viewScale) / 2;
    viewOffsetY = (canvas.height - WORLD_HEIGHT * viewScale) / 2;
}

function getColorFromText(text) {
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 45%)`;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function showScoreToast() {
    scoreToastElement.innerText = "+100 pontos!";
    scoreToastElement.classList.remove("is-visible");
    void scoreToastElement.offsetWidth;
    scoreToastElement.classList.add("is-visible");
}

function updateQuestionTimer() {
    if (!questionDeadlineAt || gameFinished) {
        questionTimerElement.innerText = "Tempo: --s";
        return;
    }

    const remainingSeconds = Math.max(0, Math.ceil((questionDeadlineAt - Date.now()) / 1000));
    questionTimerElement.innerText = `Tempo: ${remainingSeconds}s`;

    if (remainingSeconds <= 5) {
        questionTimerElement.classList.add("is-low");
    } else {
        questionTimerElement.classList.remove("is-low");
    }
}

function startQuestionTimerDisplay(timeLimit) {
    questionDeadlineAt = Date.now() + Number(timeLimit || 0) * 1000;

    if (questionTimerIntervalId) {
        clearInterval(questionTimerIntervalId);
    }

    updateQuestionTimer();
    questionTimerIntervalId = setInterval(updateQuestionTimer, 250);
}

function stopQuestionTimerDisplay() {
    questionDeadlineAt = 0;

    if (questionTimerIntervalId) {
        clearInterval(questionTimerIntervalId);
        questionTimerIntervalId = null;
    }

    questionTimerElement.classList.remove("is-low");
}

function playCorrectAnswerSound() {
    correctAnswerSound.currentTime = 0;
    correctAnswerSound.play().catch(() => {
        // The browser may block effects until the player interacts with the page.
    });
}

function playPunchHitSound() {
    punchHitSound.currentTime = 0;
    punchHitSound.play().catch(() => {
        // The browser may block effects until the player interacts with the page.
    });
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

function startPunchAnimation(playerId, direction, hit) {
    if (!playerId) {
        return;
    }

    activePunches[playerId] = {
        direction: direction || "down",
        hit: Boolean(hit),
        startedAt: Date.now()
    };
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

function movePlayerWithCollision(playerPosition, dx, dy) {
    const nextX = clamp(playerPosition.x + dx * speed, 14, WORLD_WIDTH - 14);
    const startedInsideObstacle = hitsObstacle(playerPosition.x, playerPosition.y);

    if (!hitsObstacle(nextX, playerPosition.y) || startedInsideObstacle) {
        playerPosition.x = nextX;
    }

    const nextY = clamp(playerPosition.y + dy * speed, 22, WORLD_HEIGHT - 18);
    const stillInsideObstacle = hitsObstacle(playerPosition.x, playerPosition.y);

    if (!hitsObstacle(playerPosition.x, nextY) || stillInsideObstacle) {
        playerPosition.y = nextY;
    }
}

function getPlayerArea(playerPosition) {
    if (!playerPosition) {
        return null;
    }

    return answerAreas.find(area => {
        return playerPosition.x >= area.x &&
            playerPosition.x <= area.x + area.width &&
            playerPosition.y >= area.y &&
            playerPosition.y <= area.y + area.height;
    });
}

function getDirection(dx, dy, previousDirection) {
    if (dx === 0 && dy === 0) {
        return previousDirection || "down";
    }

    if (dy < 0 && dx < 0) return "up-left";
    if (dy < 0 && dx > 0) return "up-right";
    if (dy > 0 && dx < 0) return "down-left";
    if (dy > 0 && dx > 0) return "down-right";
    if (dy < 0) return "up";
    if (dy > 0) return "down";
    if (dx < 0) return "left";
    if (dx > 0) return "right";

    return previousDirection || "down";
}

function drawAnswerAreas() {
    answerAreas.forEach(area => {
        const highlightElapsed = Date.now() - correctAnswerHighlightStartedAt;
        const shouldHighlight = area.id === highlightedCorrectAnswer &&
            highlightElapsed >= 0 &&
            highlightElapsed <= correctAnswerHighlightDuration;
        const showGreenBorder = shouldHighlight && Math.floor(highlightElapsed / 180) % 2 === 0;

        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(area.x, area.y, area.width, area.height);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = showGreenBorder ? "#39ff6a" : "#5a3418";
        ctx.lineWidth = showGreenBorder ? 5 : 3;
        ctx.shadowColor = showGreenBorder ? "rgba(57, 255, 106, 0.75)" : "transparent";
        ctx.shadowBlur = showGreenBorder ? 8 : 0;
        ctx.strokeRect(area.x, area.y, area.width, area.height);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#fffdf5";
        ctx.strokeStyle = "#3a2a18";
        ctx.lineWidth = 3;
        ctx.font = "bold 20px Verdana";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(area.label, area.x + area.width / 2, area.y + area.height / 2);
        ctx.fillText(area.label, area.x + area.width / 2, area.y + area.height / 2);
        ctx.restore();
    });
}

function drawPixelCharacter(playerPosition) {
    const x = Math.round(playerPosition.x);
    const y = Math.round(playerPosition.y);
    const color = getColorFromText(playerPosition.nickname || playerPosition.id);
    const moving = playerPosition.moving;
    const step = moving ? Math.floor(animationFrame / 10) % 2 : 0;

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(x - 8, y + 10, 16, 4);

    ctx.fillStyle = color;
    ctx.fillRect(x - 6, y - 4, 12, 14);

    ctx.fillStyle = "#ffd6a5";
    ctx.fillRect(x - 5, y - 15, 10, 10);

    ctx.fillStyle = "#3a2a18";

    const direction = playerPosition.direction || "down";

    if (direction.includes("left")) {
        ctx.fillRect(x - 5, y - 11, 2, 2);
    } else if (direction.includes("right")) {
        ctx.fillRect(x + 3, y - 11, 2, 2);
    } else if (direction.includes("up")) {
        ctx.fillRect(x - 3, y - 14, 6, 2);
    } else {
        ctx.fillRect(x - 3, y - 11, 2, 2);
        ctx.fillRect(x + 2, y - 11, 2, 2);
    }

    ctx.fillStyle = color;
    ctx.fillRect(x - 10, y - 1, 4, 8);
    ctx.fillRect(x + 6, y - 1, 4, 8);

    ctx.fillStyle = "#2f6b28";
    ctx.fillRect(x - 5, y + 10, 4, 6 + step);
    ctx.fillRect(x + 1, y + 10, 4, 6 + (step ? 0 : 1));

    ctx.fillStyle = "#3a2a18";
    ctx.font = "bold 9px Verdana";
    ctx.textAlign = "center";
    ctx.fillText(playerPosition.nickname || "Jogador", x, y - 20);

    ctx.restore();
}

function drawPunchEffects() {
    const now = Date.now();

    Object.entries(activePunches).forEach(([playerId, punch]) => {
        const playerPosition = positions[playerId];
        const elapsed = now - punch.startedAt;

        if (!playerPosition || elapsed > punchAnimationDuration) {
            delete activePunches[playerId];
            return;
        }

        const progress = elapsed / punchAnimationDuration;
        const vector = getDirectionVector(punch.direction);
        const startX = playerPosition.x + vector.x * 6;
        const startY = playerPosition.y + vector.y * 6;
        const endX = playerPosition.x + vector.x * (14 + punchReach * progress);
        const endY = playerPosition.y + vector.y * (14 + punchReach * progress);

        ctx.save();
        ctx.globalAlpha = Math.max(0.2, 1 - progress * 0.65);
        ctx.strokeStyle = punch.hit ? "#fffdf5" : "rgba(255, 253, 245, 0.7)";
        ctx.lineWidth = punch.hit ? 4 : 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        if (punch.hit) {
            ctx.fillStyle = "#ffdf6e";
            ctx.strokeStyle = "#5a3418";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(endX, endY, 5 - progress * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    });
}

function drawGame() {
    resizeCanvas();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8fcb62";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(viewScale, 0, 0, viewScale, viewOffsetX, viewOffsetY);

    if (background.complete) {
        ctx.drawImage(background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
        ctx.fillStyle = "#8fcb62";
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    drawAnswerAreas();

    Object.values(positions).forEach(drawPixelCharacter);
    drawPunchEffects();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    animationFrame++;
    requestAnimationFrame(drawGame);
}

function updateCurrentPlayerHud() {
    if (!currentPlayer) {
        return;
    }

    const player = players.find(p => p.id === currentPlayer.id);

    if (!player) {
        return;
    }

    heartsElement.innerText = "❤️".repeat(player.hearts) || "sem vidas";
    scoreElement.innerText = player.score;
}

function updateMovement() {
    if (!currentPlayer || !positions[currentPlayer.id]) {
        requestAnimationFrame(updateMovement);
        return;
    }

    const playerPosition = positions[currentPlayer.id];
    let dx = 0;
    let dy = 0;

    if (keys.ArrowUp || keys.KeyW) dy -= 1;
    if (keys.ArrowDown || keys.KeyS) dy += 1;
    if (keys.ArrowLeft || keys.KeyA) dx -= 1;
    if (keys.ArrowRight || keys.KeyD) dx += 1;

    const moving = dx !== 0 || dy !== 0;

    if (moving && dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
    }

    movePlayerWithCollision(playerPosition, dx, dy);
    playerPosition.direction = getDirection(dx, dy, playerPosition.direction);
    playerPosition.moving = moving;

    const area = getPlayerArea(playerPosition);
    currentAreaElement.innerText = area
        ? `Área atual: resposta ${area.id}`
        : "Área atual: nenhuma";

    const now = Date.now();

    if (now - lastSentMove > 50) {
        socket.emit("playerMove", {
            roomCode,
            playerId: currentPlayer.id,
            x: playerPosition.x,
            y: playerPosition.y,
            direction: playerPosition.direction,
            moving: playerPosition.moving
        });

        lastSentMove = now;
    }

    requestAnimationFrame(updateMovement);
}

function submitCurrentAnswer() {
    if (!currentPlayer || alreadyAnswered || gameFinished) {
        return;
    }

    const playerPosition = positions[currentPlayer.id];
    const area = getPlayerArea(playerPosition);

    if (!area) {
        feedbackElement.innerText = "Fique em cima de uma área de resposta antes de confirmar.";
        return;
    }

    alreadyAnswered = true;
    feedbackElement.innerText = `Resposta ${area.id} enviada. Aguarde...`;

    socket.emit("submitAnswer", {
        roomCode,
        playerId: currentPlayer.id,
        answerId: area.id
    });
}

function submitPunch() {
    if (!currentPlayer || !positions[currentPlayer.id] || gameFinished) {
        return;
    }

    const now = Date.now();

    if (now - lastPunchAt < punchCooldown) {
        return;
    }

    lastPunchAt = now;

    const playerPosition = positions[currentPlayer.id];
    const direction = playerPosition.direction || "down";
    startPunchAnimation(currentPlayer.id, direction, false);

    socket.emit("playerPunch", {
        roomCode,
        playerId: currentPlayer.id
    });
}

window.addEventListener("keydown", event => {
    keys[event.code] = true;

    if (event.code === "Space") {
        event.preventDefault();
        submitCurrentAnswer();
    }

    if (event.code === "KeyF") {
        event.preventDefault();
        submitPunch();
    }
});

window.addEventListener("keyup", event => {
    keys[event.code] = false;
});

socket.on("questionChanged", data => {
    currentQuestion = data.question;
    alreadyAnswered = false;
    gameFinished = false;
    highlightedCorrectAnswer = null;
    correctAnswerHighlightStartedAt = 0;
    scoreToastElement.classList.remove("is-visible");
    scoreToastElement.innerText = "";

    questionCountElement.innerText = `Pergunta ${data.questionIndex} de ${data.totalQuestions}`;
    questionTextElement.innerText = currentQuestion.text;
    questionOptionsElement.innerHTML = currentQuestion.options
        .map(option => `<span><strong>${option.id}</strong>: ${option.text}</span>`)
        .join("");
    startQuestionTimerDisplay(currentQuestion.timeLimit);

    feedbackElement.innerText = "Escolha uma área e pressione Espaço.";
});

socket.on("playersUpdated", data => {
    players = data.players;
    positions = {
        ...positions,
        ...data.positions
    };

    updateCurrentPlayerHud();
});

socket.on("punchResult", data => {
    positions = {
        ...positions,
        ...data.positions
    };

    const hitPlayerIds = data.hitPlayerIds || [];
    startPunchAnimation(data.attackerId, data.direction, hitPlayerIds.length > 0);

    if (hitPlayerIds.length > 0) {
        playPunchHitSound();
    }
});

socket.on("answerResult", data => {
    feedbackElement.innerText = data.isCorrect
        ? "Resposta correta! +100 pontos."
        : `Resposta errada! A correta era ${data.correctAnswer}.`;

    if (data.isCorrect) {
        showScoreToast();
        playCorrectAnswerSound();
    }

    updateCurrentPlayerHud();
});

socket.on("timeEnded", data => {
    players = data.players;
    questionTimerElement.innerText = "Tempo: 0s";
    feedbackElement.innerText = "O tempo acabou! Quem não respondeu perdeu uma vida.";
    updateCurrentPlayerHud();
});

socket.on("questionResolved", data => {
    alreadyAnswered = true;
    stopQuestionTimerDisplay();
    questionTimerElement.innerText = "Tempo: 0s";
    highlightedCorrectAnswer = data.correctAnswer;
    correctAnswerHighlightStartedAt = Date.now();

    if (data.players) {
        players = data.players;
        updateCurrentPlayerHud();
    }
});

socket.on("gameFinished", data => {
    alreadyAnswered = true;
    gameFinished = true;
    stopQuestionTimerDisplay();

    const rankingText = data.ranking
        .map((player, index) => `${index + 1}º ${player.nickname}: ${player.score} pontos`)
        .join("\n");

    questionTextElement.innerText = "Fim de jogo!";
    questionOptionsElement.innerText = "Ranking final:";
    feedbackElement.innerText = "";
    questionCountElement.innerText = "Fim de jogo";
    questionTextElement.innerText = "Ranking final";
    questionOptionsElement.innerHTML = data.ranking
        .map((player, index) => `<span>${index + 1}&ordm; ${player.nickname}: ${player.score} pontos</span>`)
        .join("");
});

socket.on("gameError", message => {
    feedbackElement.innerText = message;
});

fetch(`/api/rooms/${roomCode}`)
    .then(response => response.json())
    .then(room => {
        currentPlayer = room.currentPlayer;

        socket.emit("joinGame", {
            roomCode,
            player: currentPlayer
        });

        drawGame();
        updateMovement();
    })
    .catch(() => {
        feedbackElement.innerText = "Erro ao carregar dados da sala.";
    });
