const gameRoomCode = window.location.pathname.split("/").pop();
const gameRoomCodeElement = document.getElementById("room-code");

if (gameRoomCodeElement) {
    gameRoomCodeElement.innerText = gameRoomCode;
}