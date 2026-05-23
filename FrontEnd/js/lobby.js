const roomCode = window.location.pathname.split("/").pop();

const roomCodeElement = document.getElementById("room-code");
const playersListElement = document.getElementById("players-list");
const startGameElement = document.getElementById("start-game");

if (roomCodeElement && playersListElement && startGameElement) {
    roomCodeElement.innerText = roomCode;
    startGameElement.href = `/game/${roomCode}`;

    fetch(`/api/rooms/${roomCode}`)
        .then(response => response.json())
        .then(room => {
            playersListElement.innerHTML = "";

            room.players.forEach(player => {
                const li = document.createElement("li");

                li.innerHTML = `
                    <span class="tag is-link is-light is-medium">
                        ${player.nickname}
                    </span>
                    <span class="ml-2">
                        ${player.hearts} vidas
                    </span>
                `;

                playersListElement.appendChild(li);
            });
        })
        .catch(() => {
            playersListElement.innerHTML = `
                <li class="has-text-danger">
                    Erro ao carregar jogadores.
                </li>
            `;
        });
}