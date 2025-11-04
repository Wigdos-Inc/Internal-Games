"use strict";

// Theme: Methods of Destruction to sublimate the ice on Mars' poles


// GLOBAL VARIABLES

let game = {
    start : false,

    size  : changeScreen(),

    player: {
        score     : 0,
        merges    : 0,
        power     : 0,
        sublimated: 0
    },

    restart: function() {
    
        this.start = false;
        launch.active = false;
        launch.stage = undefined

        gridSquareArray.forEach(row => row.forEach(item => item.bombChange("remove")));
    
        if (this.player.score > this.player.h_score) this.player.h_score = this.player.score;

        this.player.score = 0;
        this.player.merges = 0;
        this.player.sublimated = 0;
        this.player.power = 0;

        tint(255, 255);
    }
};

if (typeof starData === "undefined") {

    var starData = [];

    var bombs = {
        image: [],
        name : ["Gunpowder", "Molotov", "Grenade", "C4", "Dynamite", "TNT", "Nuke", "Tsar"],
        value: [1, 4, 5, 10, 15, 50, 250, 1000],

        dragging: {
            active   : false,
            bombID   : null,
            og_square: null,
            x_pos    : null,
            y_pos    : null
        }
    };

    var mars = {};
    
    var launch = {};
    var boom;

}




// CLASSES

if (typeof gridSquareArray === "undefined") {

    var gridSquareData = {};
    var gridSquareArray = [];

    var GridSquare = class {

        constructor(x_pos, y_pos) {

            this.x_pos  = x_pos;
            this.y_pos  = y_pos;

            this.edges  = {
                left  : x_pos,
                right : x_pos + gridSquareData.size,
                top   : y_pos,
                bottom: y_pos + gridSquareData.size
            }

            this.bomb = {
                filled: false,
                bombID: undefined
            }
        }

        bombChange(change, bombID) {

            switch (change) {

                case "add":
                    this.bomb.filled = true;
                    this.bomb.bombID = bombID;
                    break;

                case "merge":
                    this.bomb.filled = true;
                    this.bomb.bombID++;
                    break;

                case "remove":
                    this.bomb.filled = false;
                    this.bomb.bombID = undefined;
                    break;
                    
                default:
                    break;
            }
        }

        create() {

            // Opacity Lowers during Launch sequence
            fill(0);
            stroke(255, 255, 255, (launch.active) ? 100 : 255);

            square(this.x_pos, this.y_pos, gridSquareData.size);

            if (this.bomb.filled) {

                image(
                    bombs.image[this.bomb.bombID],  // Bomb Image

                    this.x_pos,                     // Image X-Position
                    this.y_pos,                     // Image Y-Position

                    gridSquareData.size,            // Image Width
                    gridSquareData.size             // Image Height
                );

            }
        }
    }


    var poleStuffData = {};
    var poleStuffArray = [];

    var PoleStuff = class {

        constructor(column, row, x_pos, y_pos) {
            this.column = column;
            this.row = row;

            this.x_pos = x_pos;
            this.y_pos = y_pos;

            this.sublimated = false;
        }
    }

}




// FUNCTIONS

function preload() {

    bombs.name.forEach(bomb => bombs.image.push(loadImage(`assets/images/games/sublimator/bombs/${bomb.toLowerCase()}.png`)));
    boom = loadImage("assets/images/games/sublimator/boom.png");
}

function setup() {

    // Load Game Font
    let gameFont = loadFont("assets/fonts/sci-fi/orbitron.ttf");
    textFont(gameFont);

    // Create canvas
    let canvas = createCanvas(game.size[0], game.size[1]);
    canvas.parent("popupMain");
    background(0);
    
    noStroke();
    frameRate(75);
    tint(255, 255);
    

    // Background stars setup
    starData = [];
    for (let i = 0; i < 500; i++) {
        starData.push({
            size   : [rng(2, false)+1, rng(4, false)+2][game.size[2]],
            x_pos  : rng(width, false),
            y_pos  : rng(height, false),
            colour : color(rng(100, true)+150, rng(100, true)+150, rng(100, true)+150),
            opacity: rng(50, true) 
        });
    }


    // Grid Squares Prep
    gridSquareData = {
        size  : [30, 60][game.size[2]],
        sx_pos: undefined,
        sy_pos: [69.25, 138.5][game.size[2]]
    }
    gridSquareData.sx_pos = (width - gridSquareData.size * 5) / 2;

    gridSquareArray = [];
    for (let row = 0; row < 5; row++) {

        // Reset Row Array
        let rowArray = [];

        // Calculate Y-Position of the Row
        let y_pos = gridSquareData.sy_pos + row * gridSquareData.size;

        for (let col = 0; col < 5; col++) {

            // Calculate X-Position of the Column
            let x_pos = gridSquareData.sx_pos + col * gridSquareData.size;

            // Push Squares into Row Array
            rowArray.push(new GridSquare(x_pos, y_pos));
        }

        // Push the row into the Primary Array
        gridSquareArray.push(rowArray);
    }


    // Mars Circle Setup
    mars = {
        x_pos : width/2,
        y_pos : height * 2.8,

        size  : width*3,
        radius: undefined
    }
    mars.radius = mars.size/2;


    // Background "Ice" Setup
    poleStuffData = {
        size  : [10, 20][game.size[2]],
        sx_pos: width / 2,
        sy_pos: mars.y_pos - mars.size/2,
        gap   : {
            x: undefined,
            y: undefined
        },

        rows  : 20,
        max_w : undefined
    };
    poleStuffData.gap.x = poleStuffData.size/3;
    poleStuffData.gap.y = poleStuffData.size/5;


    // Prepare Launch Object
    launch = {
        active : false,
        stage  : undefined,
        bombs  : [],
        timer  : undefined,
        opacity: 255,

        button : {
            height : poleStuffData.gap.y * poleStuffData.rows * 0.75,
            width  : [100, 200][game.size[2]],

            edges  : {},

            x_pos  : undefined,
            y_pos  : undefined,


            // Draw the Button
            create : function() {

                // Draw Launch Button
                fill((this.overlap(mouseX, mouseY)) ? 200 : 150, 0, 0, 150);
                rect(this.x_pos, this.y_pos, this.width, this.height);

                // Draw Launch Text
                fill("white");
                textSize(20);
                textAlign(CENTER, CENTER);
                text("LAUNCH", this.x_pos + this.width/2, this.y_pos + this.height/2);
            },

            // Check if the User hovers over the Button
            overlap: function(x, y) {

                return (x >= this.x_pos && x <= this.x_pos + this.width && y >= this.y_pos && y <= this.y_pos + this.height) ? true : false;
            }
        },


        // Activate the Launch process and store the existing Bombs
        stage1: function() {

            this.active = true;
            this.stage = 1;

            // Store the Bombs and Remove them from the Squares
            this.bombs = [];
            gridSquareArray.forEach(row => row.forEach(square => {

                if (square.bomb.filled) {

                    this.bombs.push({
                        id   : square.bomb.bombID,
                        x_pos: mars.x_pos + (rng(12, true) - 9) * poleStuffData.gap.x,
                        y_pos: poleStuffArray[2][0].y_pos + (rng(5, true) - 3) * poleStuffData.gap.y
                    });
                    square.bombChange("remove");

                }
            }));
            
            // Sort stored Bombs by their ID
            this.bombs.sort((a, b) => a.id - b.id);

            // Move on to the next stage
            this.stage2();
        },

        // Countdown
        stage2: function() {

            this.stage = 2;

            this.timer = 5;

            let timerInterval = setInterval(() => {
                
                this.timer--;
    
                // When the timer reaches 0, move on to next stage
                if (this.timer <= 0) {
                    clearInterval(timerInterval); // Stop the timer
                    this.stage3(); // Move on to the next Phase
                }
            }, 1000); // Decrease every 1000ms (1 second)
        },

        // Kaboom
        stage3: function() {

            this.stage = 3;

            // Calculate Exlosion Value
            let boomVal = 0;
            this.bombs.forEach(bomb => boomVal += bombs.value[bomb.id]);

            // Debug


            // Calculate Sublimation Amount
            let subScale = Math.min(boomVal / 10000, 1);

            // Sublimation Center and Deviation
            const centH = Math.floor((poleStuffData.rows) / 2); // Center row
            const centW = Math.floor((poleStuffArray[centH].length) / 2 - 2); // Center column of the widest row
            const hDeviation = Math.round(poleStuffData.rows / 2) + 2;
            const wDeviation = Math.round(poleStuffData.max_w / 2) + 3;

            // Calculate how many Rows and Columns should be Sublimated based on the boomVal
            let subRows = Math.max(Math.round(hDeviation * subScale), 1);
            let subCols = Math.max(Math.round(wDeviation * subScale), 1);

            // Sublimate the PoleStuff (this should create an oval shape)
            let sublimated = 0;
            for (let row = centH - subRows; row < centH + subRows; row++) {

                for (let col = centW - subCols; col < centW + subCols; col++) {
                
                    // Ensure we're within bounds and only sublimating valid cells
                    if (row >= 0 && row < poleStuffData.rows && col >= 0 && col < poleStuffArray[row].length) {
                        if (!poleStuffArray[row][col].sublimated) {

                            poleStuffArray[row][col].sublimated = true;
                            sublimated++;
                            
                        }
                    }
                }
            }

            // Post Player Scores
            game.player.power = boomVal;
            game.player.sublimated = sublimated;
            game.player.score = sublimated * 10 + boomVal * Math.max(game.player.merges, 1);

            // Move on to next Stage
            setTimeout(this.stage4(), 2000);
        },

        stage4() {

            this.stage = 4;
            this.opacity = 255;

            let duration = 2000;
            let step = 50;

            let dissipateBoom = setInterval(() => {

                // Reduce Boom-Img's Opacity
                this.opacity -= 255 / (duration / step);
        
                if (this.opacity <= 0) {

                    this.opacity = 0;
                    clearInterval(dissipateBoom);

                    // Move on to next Stage
                    this.stage5();

                }
            }, step);
        },

        stage5() {

            this.stage = 5;
        }
    }
    launch.button.x_pos = width/2 - launch.button.width/2;
    launch.button.y_pos = mars.y_pos - mars.size/2 + [5, 10][game.size[2]];
}

function draw() {

    // Draw the background
    background(0);

    // Draw background stars
    for (let i=0; i < starData.length; i++) {

        // Low opacity
        starData[i].colour.setAlpha(starData[i].opacity/2);
        fill(starData[i].colour);
        circle(starData[i].x_pos, starData[i].y_pos, starData[i].size*2);

        // Medium opacity
        starData[i].colour.setAlpha(starData[i].opacity);
        fill(starData[i].colour);
        circle(starData[i].x_pos, starData[i].y_pos, starData[i].size*1);

        // Full opacity
        starData[i].colour.setAlpha(255);
        fill(starData[i].colour);
        circle(starData[i].x_pos, starData[i].y_pos, starData[i].size*0.5);
    }

    if (game.start) {

        // Draw Mars
        fill(255, 60, 0);
        circle(mars.x_pos, mars.y_pos, mars.size);

        // Draw "Ice"
        fill("white");
        poleStuffArray.forEach(row => row.forEach(item => {

            if (!item.sublimated) circle(item.x_pos, item.y_pos, poleStuffData.size);
        }));
        

        // Draw Grid
        strokeWeight(1);
        gridSquareArray.forEach(row => row.forEach(item => item.create()));
        noStroke();

        
        // Draw Bombs if Dragged by User
        if (bombs.dragging.active) {

            image(
                bombs.image[bombs.dragging.bombID],

                bombs.dragging.x_pos,
                bombs.dragging.y_pos,

                gridSquareData.size,
                gridSquareData.size
            );

        }


        // Draw Launch Button
        if (!launch.active) launch.button.create();
        else {

            // Draw Bombs at new position
            if (launch.stage <= 2) {

                for (let bomb of launch.bombs) {

                    image(
                        bombs.image[bomb.id],

                        bomb.x_pos,
                        bomb.y_pos,

                        gridSquareData.size/2,
                        gridSquareData.size/2
                    );
                }

            }

            // Draw Countdown
            if (launch.stage == 2) {

                textAlign(CENTER, CENTER);
                textSize(100);
                fill(255);
                text(launch.timer, gridSquareData.sx_pos + gridSquareData.size*2.5, gridSquareData.sy_pos + gridSquareData.size*2.5);

            }
            else if (launch.stage == 3 || launch.stage == 4) {

                tint(255, launch.opacity);

                let imgSize = poleStuffData.max_w * poleStuffData.gap.x * 1.5;
                let imgX = width/2 - imgSize/2;
                let imgY = poleStuffArray[poleStuffData.rows/2-1][0].y_pos - imgSize/2;

                image(
                    boom,

                    imgX,
                    imgY,

                    imgSize,
                    imgSize
                );


            }
            else if (launch.stage == 5) {

                // Prep Background Box
                let bg = {
                    w: [120, 240][game.size[2]],
                    h: [100, 200][game.size[2]],

                    x: undefined,
                    y: gridSquareData.sy_pos
                }
                bg.x = width/2 - bg.w/2;

                // Draw Background Box
                fill(0);
                stroke("white");
                strokeWeight(1);

                rect(bg.x, bg.y, bg.w, bg.h);

                noStroke();

                // Draw Text
                fill("white");
                textAlign(LEFT);
                textSize(20);

                text(`Merges: ${game.player.merges}`        , width/2 - bg.w/2 + [10, 20][game.size[2]], bg.y + [10, 20][game.size[2]]);
                text(`Power: ${game.player.power}`          , width/2 - bg.w/2 + [10, 20][game.size[2]], bg.y + [20, 40][game.size[2]]);
                text(`Sublimated: ${game.player.sublimated}`, width/2 - bg.w/2 + [10, 20][game.size[2]], bg.y + [30, 60][game.size[2]]);
                text(`Total Score: ${game.player.score}`    , width/2 - bg.w/2 + [10, 20][game.size[2]], bg.y + [50, 100][game.size[2]]);
                
                text(`Klik voor herstart!`       , width/2 - bg.w/2 + [10, 20][game.size[2]], bg.y + [70, 140][game.size[2]]);

            }
        }
    }


    // Display Title
    fill(0);
    rect(width/2 - [130, 260][game.size[2]], [20, 40][game.size[2]], [260, 520][game.size[2]], [49, 98][game.size[2]]);

    fill('white');
    textSize([25, 50][game.size[2]]);
    textAlign(CENTER, CENTER);
    text("OFES Sublimator", width/2, [40, 80][game.size[2]]);
}


function gameStartSetup() {

    // Initialize PoleStuff

    // Populate the Pole
    poleStuffArray = [];
    let memory = [];
    for (let row = 0; row < poleStuffData.rows; row++) {

        // Debug

        // Reset Row Array
        let rowArray = [];

        // Calculate Y-Position of the Row
        let y_pos = poleStuffData.sy_pos + row * poleStuffData.gap.y;

        // Calculate Mars-Width at current Row (y_pos)
        let distanceFromCenterMars = mars.y_pos - y_pos;
        let marsWidth = 2 * Math.sqrt(Math.pow(mars.radius, 2) - Math.pow(distanceFromCenterMars, 2));

        // Adjust c_cols based on available width
        let cols = (row <= poleStuffData.rows/2) ? Math.floor(marsWidth / poleStuffData.gap.x) : memory[(memory.length-1) - (row - poleStuffData.rows/2)];

        // Colums
        for (let col = 0; col < cols; col++) {

            // Calculate X-Position of the Column
            let x_pos = (poleStuffData.sx_pos - (cols * poleStuffData.gap.x)/2) + col * poleStuffData.gap.x;

            // Create Polestuff Objects
            rowArray.push(new PoleStuff(col, row, x_pos, y_pos));
        }

        // Push Row Array into Primary Array
        poleStuffArray.push(rowArray);

        // Push cols to memory
        if (row <= poleStuffData.rows/2) memory.push(cols);

        // Store Widest Row
        else if (row == poleStuffData.rows/2+1) poleStuffData.max_w = rowArray.length;
    }

    // Spawn 10 Bombs
    spawnBombs(10);    

    // Activate Game Functions
    game.start = true;
}

function spawnBombs(amount) {

    // Get all empty squares
    let emptySquares = [];

    gridSquareArray.forEach((row, rowIndex) => row.forEach((square, colIndex) => {

        if (!square.bomb.filled) emptySquares.push({ row: rowIndex, col: colIndex });
    }));

    // Spawn bombs in random empty squares
    for (let i=0; i < amount && emptySquares.length > 0; i++) {
        
        // Choose a Random empty Square
        const randomIndex = Math.floor(Math.random() * emptySquares.length);
        const randomSquare = emptySquares.splice(randomIndex, 1)[0]; // Remove the selected square to avoid duplication

        // Generate a Bomb
        const randomBombID = rng(2, true);
        gridSquareArray[randomSquare.row][randomSquare.col].bombChange("add", randomBombID);
    }
}


// Change game screen size based on window size
function changeScreen() {

    return (window.innerWidth > 920) ? [800, 600, 1] : [400, 300, 0];
}

// Conditional Random Number Generator
function rng(range, rounded) {

    let number = Math.random() * range;
    if (rounded) number = Math.round(number);

    return number;
}

// Direction Logic Converter
function degreesToRadians(input, invert) {

    return (!invert) ? input * (Math.PI / 180) : input * (180 / Math.PI);
}




// EVENT LISTENERS

function mousePressed() {

    // Start the game if the user clicks on the Game Window
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height && !game.start) {
        gameStartSetup();
        return;
    }


    if (game.start && !launch.active) {

        // Check if the User Clicks/Taps a Bomb-Filled Square
        gridSquareArray.forEach(row => row.forEach(square => {

            if (square.bomb.filled && mouseX >= square.edges.left && mouseX <= square.edges.right && mouseY >= square.edges.top && mouseY <= square.edges.bottom) {

                // Detach the bomb from the Square and Attach it to the user
                bombs.dragging.active = true;
                bombs.dragging.bombID = square.bomb.bombID;
                bombs.dragging.og_square = square;
                bombs.dragging.x_pos = mouseX - gridSquareData.size / 2;
                bombs.dragging.y_pos = mouseY - gridSquareData.size / 2;
                square.bombChange("remove");
                return;

            }
        }));


        // Check if the User Clicks/Taps on the Launch Button
        if (launch.button.overlap(mouseX, mouseY)) launch.stage1();

    }
    else if (game.start && launch.active && launch.stage == 5 && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        game.restart();
        gameStartSetup();
    }
}

function mouseDragged() {

    // Check if the User is Dragging a Bomb
    if (game.start && bombs.dragging.active) {

        bombs.dragging.x_pos = mouseX - gridSquareData.size/2;
        bombs.dragging.y_pos = mouseY - gridSquareData.size/2;

    }
}

function mouseReleased() {

    // Check if User was Dragging a Bomb
    if (game.start && bombs.dragging.active) {

        // Prepare Bomb-Drop Variables
        let validateDrop = false;
        let dropType;
        let target;

        // Check if the Bomb is Dropped on a Square
        gridSquareArray.forEach(row => row.forEach(square => {

            if (mouseX >= square.edges.left && mouseX <= square.edges.right && mouseY >= square.edges.top && mouseY <= square.edges.bottom) {

                target = square;

                if (square.bomb.filled && square.bomb.bombID == bombs.dragging.bombID && bombs.dragging.bombID != bombs.name.length-1) { // Check if Bomb can Merge
                    validateDrop = true;
                    dropType = "merge";
                }
                else if (!square.bomb.filled) { // Check if Bomb can be added to empty Square
                    validateDrop = true;
                    dropType = "add";
                }

            }
        }));

        if (validateDrop) {

            // Add or Merge Bomb on this Square based on Type
            target.bombChange(dropType, bombs.dragging.bombID);

            // Determine how many new Bombs should be Spawned
            let newBombs;

            if (dropType === "add") newBombs = 1;
            else if (dropType === "merge") {

                game.player.merges++;
                
                // Chance of Spawning 0, 1 or 2 new Bombs
                const chance = Math.random();

                if      (chance < 0.5)  newBombs = 0;  // 50% for 0
                else if (chance < 0.8)  newBombs = 1;  // 30% for 1
                else                    newBombs = 2;  // 20% for 2

            }

            // Spawn new Bombs
            spawnBombs(newBombs);

        }
        else bombs.dragging.og_square.bombChange("add", bombs.dragging.bombID);

        // Reset Bomb-Dragging Object
        bombs.dragging.active = false;
        bombs.dragging.bombID = null;
        bombs.dragging.og_square = null;
        bombs.dragging.x_pos = null;
        bombs.dragging.y_pos = null;

    }
}


// Adjust game window size dynamically
window.addEventListener("resize", function() {

    game.size = changeScreen();
    resizeCanvas(game.size[0], game.size[1]);

    game.restart();
});


// Start/Stop the game
document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") game.restart();
    else if (event.key === " " && !game.start) gameStartSetup();
});