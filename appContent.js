// If the Application has a Top Bar
if (document.getElementById("topBar")) {
    
    // Store it
    const topBar = document.getElementById("topBar");

    // Create the OS box & image to display the creature
    const osBox = topBar.appendChild(document.createElement("div")); osBox.id = "appOS";
    const osImg = osBox.appendChild(document.createElement("img")); osImg.id = "OSimg";
    osImg.src = "assets/images/icons/16x/bombs.png";

    // Opacity changes on hover
    osBox.addEventListener("mouseenter", () => osImg.style.opacity = 1);
    osBox.addEventListener("mouseleave", () => osImg.style.opacity = 0.5);

    // Open Creature Application onclick (once converted)

}