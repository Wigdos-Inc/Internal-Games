/* Variables */

// HTML Elements
const element = {
    main  : document.getElementById("appMain"),

    bomb  : {
        numberBox: document.getElementById("numberBox"),
        numbers  : document.getElementsByClassName("digits"),

        buttonBox: document.getElementById("buttonBox"),
        buttons  : document.getElementsByClassName("buttons"),

        ini      : function() {

            // Register Button Presses
            for (let i=0; i < this.buttons.length; i++) this.buttons[i].addEventListener("click", () => this.insert(i+1));
        },

        insert   : function(digit) {

            if (quiz.finished) return;

            // Store User Code
            for (let i=0; i < 15; i++) {
    
                if (this.numbers[i].innerHTML) quiz.uCode[i] ? quiz.uCode[i] = this.numbers[i].innerHTML : quiz.uCode += this.numbers[i].innerHTML;
            }

            // Digit Correction
            if (digit == 11) digit = 0;
            else if (digit == 12) digit = 11;

            // Digit Handling
            if (digit < 10) {

                // Insert Digit
                this.numbers[quiz.index].innerHTML = digit;

            }
            else if (digit == 10) {

                // Remove Timer
                clearTimeout(quiz.timer);

                // Return to Previous Question (or show Results)
                if (quiz.completionCheck()) quiz.index = (quiz.index == 0 ? 15 : quiz.index - 1);
                else quiz.index = (quiz.index == 0 ? 14 : quiz.index - 1);
                quiz.display();

            }
            else if (digit == 11) {

                // Remove Timer
                clearTimeout(quiz.timer);

                // Continue to Next Question (or show Results)
                if (quiz.completionCheck()) quiz.index = (quiz.index == 14 ? 15 : quiz.index + 1)
                else quiz.index = (quiz.index == 14 ? 0 : quiz.index + 1);
                quiz.display();

            }
            
        }
    },

    sticky: {
        pBox : document.getElementById("stickyBox"),
        qBox : document.getElementById("stickyQbox"),
        aBox : {
            element: document.getElementById("stickyAbox"),
            multi  : {
                element: document.getElementById("multiAnswerBox"),
                labels : document.getElementsByTagName("label"),
                input  : document.getElementsByClassName("answers")
            },
            open   : document.getElementById("openAnswerBox"),
            output : document.getElementById("digitOutput")
        },
        nBox : document.getElementById("stickyNbox"),
        qnr  : document.getElementById("qnr"),

        notes:
        [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]
    },

    results: function() {

        // Lock the Quiz
        quiz.finished = true;

        // Calculate how many Answers were Correct
        let correct = 0;
        for (let i=0; i < quiz.code.length; i++) {

            if (quiz.uCode[i] == quiz.code[i]) correct++;
        }

        // Lock Answer Boxes
        for (let i = 0; i < 4; i++) {

            element.sticky.aBox.multi.input[i].disabled = true;
        }
        element.sticky.aBox.open.disabled = true;

        // Hide Answer Boxes
        element.sticky.aBox.multi.element.style.display = "none";
        element.sticky.aBox.open.style.display = "none";
        element.sticky.aBox.output.style.display = "none";
        element.sticky.qnr.innerHTML = "Fin";
        element.sticky.nBox.style.display = "none";

        // Styling Changes
        document.getElementById("bombus").style.transition = "all 0.5s ease";
        element.bomb.buttonBox.style.transition = "all 0.5s ease";
        element.bomb.numberBox.style.transition = "all 0.5s ease";
        document.getElementById("sticky").style.transition = "all 0.5s ease";
        element.sticky.pBox.style.transition = "all 0.5s ease";

        document.getElementById("bombus").style.opacity = 0.5;
        element.bomb.buttonBox.style.opacity = 0.5;
        element.bomb.buttonBox.style.pointerEvents = "none";
        element.bomb.numberBox.style.opacity = 0.5;
        element.bomb.numberBox.style.pointerEvents = "none";

        document.getElementById("sticky").style.left = "50%";
        element.sticky.pBox.style.left = "50%";


        // Display Result
        element.sticky.qBox.innerHTML = "You finished!";
        element.sticky.aBox.element.innerHTML = 
        `
            Results: <br/><br/>

            Defusal Code: ${quiz.code} <br/>
            Your Code: ${quiz.uCode} <br/><br/>

            Correct: ${correct}/${quiz.code.length}
        `;
    }
}

// Quiz Info
const quiz = {
    finished: false,
    index   : 0,
    timer   : null,

    code    : "",
    uCode   : "",

    question: 
    [
        "What does neurodivergence mean?",
        "What is NOT considered a form of neurodivergence?",
        "What does ADHD stand for?",
        "What's the difference between ADD and ADHD?",
        "Which of these is a common symptom of Autism?",
        "What does masking mean?",
        "What does sensory overload mean?",
        "What neurodivergence deals with obsessive thoughts?",
        "What is time blindness?",
        "What does body doubling mean?",
        "What type of neurodivergence perceives numbers, letters or words in colour?",
        "Is epilepsy considered a neurodivergence?",
        "What do you call repetitive behaviours that people with ASD often engage in?",
        "What is the full name of ASD?",
        "What does autism have to do with vaccines?"
    ],

    answers: {
        multi:  {
            option: [
                [
                    "A neurological condition that differs from typical people.",
                    "Being extremely intelligent.",
                    "A neurological condition that causes difficulty in focusing.",
                    "Permanent brain damage."
                ],
                [
                    "ADHD",
                    "Dyslexia",
                    "ASD",
                    "BPD"
                ],
                [
                    "Awareness Divergent Hyperactivity Disorder",
                    "Attention Defecit Hyperactivity Disorder",
                    "Attention Defecit High-functioning Disorder",
                    "Active Development Hyperfocus Disorder"
                ],
                [
                    "Ability to function",
                    "High energy levels",
                    "Ability to hyperfocus",
                    "Increased motivation"
                ],
                [
                    "Lack of emotions",
                    "Lack of social awareness",
                    "Lack of empathy",
                    "Special Talents"
                ],
                [
                    "Avoiding eye contact.",
                    "Conforming to social norms.",
                    "Avoiding social situations.",
                    "Putting on a mask to avoid sensory overload."
                ],
                [
                    "Stress caused by excessive input.",
                    "Ability to filer senses.",
                    "Increase in energy.",
                    "An increased ability to focus on a sense."
                ],
                [
                    "BPD",
                    "ADD",
                    "OCD",
                    "TS"
                ],
                [
                    "Being unable to read a clock.",
                    "Not being able to tell how much time has passed.",
                    "Being acutely aware of every passing second.",
                    "Looking at clocks causes sensory overload."
                ],
                [
                    "Needing the presence of another to finish a task.",
                    "The ability to copy behaviours",
                    "Mimicing emotions you don't actually feel",
                    "A technique to remember physical movements better"
                ]
            ],
            correct: [0, 3, 1, 1, 1, 1, 0, 2, 1, 0],
            output :
            [
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0],
                [0,0,0,0]
            ],
            input  : [null, null, null, null, null, null, null, null, null, null]
        },
        open : {
            correct:
            [
                "Synesthesia",
                "Yes",
                "Stimming",
                "Autism Spectrum Disorder",
                "Nothing"
            ],
            input  : [null, null, null, null, null],
            output : [null, null, null, null, null],
            pOutput: [null, null, null, null, null]
        }
    },

    ini    : function() {

        // Generate a Correct Defusal Code
        for (let i=0; i < 15; i++) {

            // Create Correct Code
            const digit = Math.floor(Math.random() * 10);
            this.code += digit;
            
            if (i < 10) {

                for (let i2=0; i2 < 4; i2++) {

                    // Insert Wrong Digits
                    this.answers.multi.output[i][i2] = Math.floor(Math.random() * 10);
                }

                // Insert Single Correct Digit per Question
                this.answers.multi.output[i][this.answers.multi.correct[i]] = digit;

            }
            else {

                this.answers.open.output[i-10] = digit;

            }
        }

        console.log(this.code);


        // Multi-Choice Question Answer Recognition
        for (let i=0; i < 4; i++) {

            if (this.finished) return;

            element.sticky.aBox.multi.input[i].addEventListener("click", () => {

                // Display Output if Checked
                if (element.sticky.aBox.multi.input[i].checked) element.sticky.aBox.output.innerHTML = `Digit: ${this.answers.multi.output[this.index][i]}`;

                // Make sure only one can be checked at a time
                for (let i2 = 0; i2 < 4; i2++) {

                    if (!quiz.finished) element.sticky.aBox.multi.input[i2].checked = false;
                }

                element.sticky.aBox.multi.input[i].checked = true;

                // Store User Input
                this.answers.multi.input[this.index] = i;
            });
        }


        // Open Answer Typing Recognition
        element.sticky.aBox.open.addEventListener("keydown", () => {

            if (this.finished) return;

            // Remove Previous Timer
            clearTimeout(this.timer);

            // Start Timer for Validation
            this.timer = setTimeout(() => {

                // Store Input & Answer without Spaces
                const input = element.sticky.aBox.open.value.replaceAll(" ", "");
                const cAnswer = this.answers.open.correct[this.index-10].replaceAll(" ", "");
                let correct = {
                    full : cAnswer.length,
                    total: 0,

                    calc : function() {

                        return Math.round(this.total / this.full * 100);
                    }
                };

                console.log(input);

                if (input != "") {

                    // Validate Answer
                    for (let i=0; i < input.length; i++) {

                        if (cAnswer[i] && input[i] == cAnswer[i]) correct.total++;
                    }

                    // Store & Display Digit
                    console.log(correct.calc());
                    const digit = `Digit: ${correct.calc() >= 80 ? this.answers.open.output[this.index-10] : Math.floor(Math.random() * 10)}`;
                    element.sticky.aBox.output.innerHTML = digit;

                    // Store User Answer & Received Digit
                    this.answers.open.input[this.index-10] = element.sticky.aBox.open.value;
                    this.answers.open.pOutput[this.index-10] = digit;

                }
            }, 1000);
        });
    },
        
    display: function() {

        // If the Quiz isn't finished yet
        if (this.index < 15) {

            // Highlight Active Digit Box
            for (let i=0; i < element.bomb.numbers.length; i++) element.bomb.numbers[i].classList.remove("highlight");
            element.bomb.numbers[this.index].classList.add("highlight");

            element.sticky.qnr.innerHTML = this.index+1;
            element.sticky.qBox.innerHTML = `<strong>${this.question[this.index]}</strong>`;

            // Empty Digit Output
            element.sticky.aBox.output.innerHTML = "Digit: ";

            if (this.index < 10) {

                element.sticky.aBox.open.style.display = "none";
                element.sticky.aBox.multi.element.style.display = "unset";

                // Display Multiple Choice Answers
                for (let i=0; i < 4; i++) {

                    // Uncheck Boxes
                    element.sticky.aBox.multi.input[i].checked = false;

                    // Display Answers
                    element.sticky.aBox.multi.labels[i].innerHTML = this.answers.multi.option[this.index][i];
                }

                // Check previously Checked Box
                if (this.answers.multi.input[this.index]) {

                    element.sticky.aBox.multi.input[this.answers.multi.input[this.index]].checked = true;
                    element.sticky.aBox.output.innerHTML = `Digit: ${this.answers.multi.output[this.index][this.answers.multi.input[this.index]]}`;

                }

            }
            else {

                element.sticky.aBox.multi.element.style.display = "none";
                element.sticky.aBox.open.style.display = "unset";


                // Empty/Refill the Textarea & Output
                element.sticky.aBox.open.value = this.answers.open.input[this.index-10] ? this.answers.open.input[this.index-10] : "";
                if (this.answers.open.pOutput[this.index-10]) element.sticky.aBox.output.innerHTML = this.answers.open.pOutput[this.index-10];

            }

            // Display Notes
            //element.sticky.nBox.value = element.sticky.notes[this.index];

        }
        else element.results();
    },

    completionCheck: function() {

        // AI (Needs to be replaced)
        return Array.from(element.bomb.numbers)
                .slice(0, 15)
                .every(digitBox => digitBox.innerHTML.trim() !== "");
    }
}



element.bomb.ini();
quiz.ini();
quiz.display();


document.addEventListener("keydown", (event) => {

    if (quiz.finished) return;

    switch (event.key) {
        case "1": element.bomb.insert(1); break;
        case "2": element.bomb.insert(2); break;
        case "3": element.bomb.insert(3); break;
        case "4": element.bomb.insert(4); break;
        case "5": element.bomb.insert(5); break;
        case "6": element.bomb.insert(6); break;
        case "7": element.bomb.insert(7); break;
        case "8": element.bomb.insert(8); break;
        case "9": element.bomb.insert(9); break;
        case "0": element.bomb.insert(0); break;
        
        case "ArrowLeft": element.bomb.insert(10); break;
        case "ArrowRight": element.bomb.insert(12); break;
    
        default: break;
    }
});