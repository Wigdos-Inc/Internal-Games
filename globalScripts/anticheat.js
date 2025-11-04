function stopCheating() {

    const nope = document.body.appendChild(document.createElement("div"));
    nope.style.position = "absolute";
    nope.style.top = 0; nope.style.left = 0;
    nope.style.width = "100vw"; nope.style.height = "100vh";
    nope.style.backgroundColor = "black";
    nope.style.zIndex = 9999;

    nope.style.display = "flex";
    nope.style.justifyContent = "center";
    nope.style.alignItems = "center";

    nope.style.fontSize = "100px";
    nope.style.cursor = "pointer";


    const creature = nope.appendChild(document.createElement("img"));
    creature.src = "assets/images/icons/48x/bombs.png";
    creature.style.position = "absolute"; creature.style.top = "50vh", creature.style.left = "50vw"; creature.style.transform = "translate(-50%, -50%)";
    creature.style.width = "80%";
    creature.style.opacity = "0.05";
    creature.style.userSelect = "none";
    creature.style.transition = "opacity 1s";
    
    creature.onmouseover = () => creature.style.opacity = "0.1";
    creature.onmouseout  = () => creature.style.opacity = "0.05";


    document.body.addEventListener("click", async (event) => {

        if (event.target === nope || event.target === creature) {

            nope.innerHTML = "WHO ARE YOU TRYING TO FOOL";

            // Wait for Error Sound to Finish before Booting User back to Index
            let audio = await playerrorSound();
            setTimeout(() => location.reload(), 1000);
        }
    });
}