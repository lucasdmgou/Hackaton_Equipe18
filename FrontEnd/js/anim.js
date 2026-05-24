const player = document.getElementById("player");

let x = 200;
let y = 200;

const speed = 3;

const keys = {};

document.addEventListener("keydown", (e)=>{
    keys[e.key] = true;
});

document.addEventListener("keyup", (e)=>{
    keys[e.key] = false;
});

function animate(){

    let moving = false;

    if(keys["a"] || keys["ArrowLeft"]){
        x -= speed;
        player.style.backgroundPositionY = "-16px";
        moving = true;
    }

    if(keys["d"] || keys["ArrowRight"]){
        x += speed;
        player.style.backgroundPositionY = "-32px";
        moving = true;
    }

    if(keys["w"] || keys["ArrowUp"]){
        y -= speed;
        player.style.backgroundPositionY = "-48px";
        moving = true;
    }

    if(keys["s"] || keys["ArrowDown"]){
        y += speed;
        player.style.backgroundPositionY = "0px";
        moving = true;
    }

    player.style.left = x + "px";
    player.style.top = y + "px";

    if(moving){
        player.classList.add("walk");
    }else{
        player.classList.remove("walk");
    }

    requestAnimationFrame(animate);
}

animate();