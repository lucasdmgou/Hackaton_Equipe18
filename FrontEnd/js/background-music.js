const backgroundMusic = new Audio("/assets/audio/background-music.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.35;

const musicRequestedKey = "backgroundMusicRequested";
const musicTimeKey = "backgroundMusicTime";

function saveMusicPosition() {
    if (!Number.isNaN(backgroundMusic.currentTime)) {
        sessionStorage.setItem(musicTimeKey, String(backgroundMusic.currentTime));
    }
}

function restoreMusicPosition() {
    const savedTime = Number(sessionStorage.getItem(musicTimeKey));

    if (!Number.isFinite(savedTime) || savedTime <= 0) {
        return;
    }

    const applySavedTime = () => {
        if (backgroundMusic.duration && savedTime < backgroundMusic.duration) {
            backgroundMusic.currentTime = savedTime;
        }
    };

    if (backgroundMusic.readyState >= 1) {
        applySavedTime();
    } else {
        backgroundMusic.addEventListener("loadedmetadata", applySavedTime, { once: true });
    }
}

function playBackgroundMusic() {
    restoreMusicPosition();

    backgroundMusic.play().catch(() => {
        // Browsers often wait for the first player interaction before allowing audio.
    });
}

function rememberMusicWasRequested() {
    sessionStorage.setItem(musicRequestedKey, "true");
    playBackgroundMusic();
}

if (sessionStorage.getItem(musicRequestedKey) === "true") {
    playBackgroundMusic();
}

setInterval(saveMusicPosition, 500);
window.addEventListener("pagehide", saveMusicPosition);
window.addEventListener("beforeunload", saveMusicPosition);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        saveMusicPosition();
    }
});
document.addEventListener("pointerdown", rememberMusicWasRequested, { once: true });
document.addEventListener("keydown", rememberMusicWasRequested, { once: true });
