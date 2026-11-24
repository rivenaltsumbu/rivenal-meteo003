const questions = [
    {
        question: "Quel est le type d'un fichier JavaScript ?",
        answers: [".ts", ".jsx", ".js", ".json"],
        correctAnswer: 2,
    },
    {
        question: "Quel mot-clé permet de déclarer une constante ?",
        answers: ["let", "const", "var", "static"],
        correctAnswer: 1,
    },
    {
        question: "Quelle méthode transforme un objet en texte JSON ?",
        answers: ["JSON.parse()", "JSON.stringify()", "JSON.object()", "JSON.convert()"],
        correctAnswer: 1,
    },
    {
        question: "Quel symbole sert à écrire un commentaire sur une ligne ?",
        answers: ["<!-- -->", "#", "//", "**"],
        correctAnswer: 2,
    },
    {
        question: "Quel opérateur teste une égalité stricte ?",
        answers: ["=", "==", "===", "!="],
        correctAnswer: 2,
    },
    {
        question: "Que renvoie typeof null en JavaScript ?",
        answers: ["null", "undefined", "object", "number"],
        correctAnswer: 2,
    },
    {
        question: "Quelle méthode vérifie si une valeur est un tableau ?",
        answers: ["Array.isArray()", "Array.check()", "isArray()", "typeofArray()"],
        correctAnswer: 0,
    },
    {
        question: "Quelle méthode ajoute un élément à la fin d'un tableau ?",
        answers: ["shift()", "push()", "unshift()", "pop()"],
        correctAnswer: 1,
    },
    {
        question: "Quel caractère entoure une chaîne de modèle (template literal) ?",
        answers: ["' (apostrophe)", "\" (guillemet)", "` (accent grave)", "/ (barre oblique)"],
        correctAnswer: 2,
    },
    {
        question: "Quelle méthode garde les éléments d'un tableau qui vérifient une condition ?",
        answers: ["map()", "filter()", "findIndex()", "reduce()"],
        correctAnswer: 1,
    },
    {
        question: "Que renvoie Array.isArray([]) ?",
        answers: ["false", "true", "undefined", "[]"],
        correctAnswer: 1,
    },
    {
        question: "Quel est l'index du premier élément d'un tableau ?",
        answers: ["0", "1", "-1", "Il n'a pas d'index"],
        correctAnswer: 0,
    },
    {
        question: "Quelle méthode retire le dernier élément d'un tableau ?",
        answers: ["pop()", "push()", "shift()", "slice()"],
        correctAnswer: 0,
    },
    {
        question: "Quel opérateur logique signifie « ET » ?",
        answers: ["||", "!", "&&", "??"],
        correctAnswer: 2,
    },
    {
        question: "Que renvoie Math.floor(4.8) ?",
        answers: ["5", "4", "4.8", "0"],
        correctAnswer: 1,
    },
];

const PASSING_SCORE = 8;
const QUESTION_TIME_SECONDS = 30;

const welcomeScreen = document.querySelector("#welcome-screen");
const quizScreen = document.querySelector("#quiz-screen");
const resultScreen = document.querySelector("#result-screen");
const welcomeForm = document.querySelector("#welcome-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const questionTitle = document.querySelector("#question-title");
const questionCount = document.querySelector("#question-count");
const timerValue = document.querySelector("#timer-value");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const answersContainer = document.querySelector("#answers");
const nextButton = document.querySelector("#next-button");
const quitButton = document.querySelector("#quit-button");
const homeButton = document.querySelector("#home-button");
const resultName = document.querySelector("#result-name");
const resultEmail = document.querySelector("#result-email");
const resultScore = document.querySelector("#result-score");
const nameNote = document.querySelector("#name-note");
const emailNote = document.querySelector("#email-note");

let currentQuestion = 0;
let score = 0;
let selectedAnswer = null;
let secondsRemaining = 30;
let timerId = null;

function showMissingFieldNoteWhenInvalid(input, note) {
    let attempted = false;

    input.addEventListener("invalid", () => {
        attempted = true;
        note.hidden = Boolean(input.value.trim());
    });

    input.addEventListener("input", () => {
        note.hidden = !attempted || Boolean(input.value.trim());
    });
}

nameInput.addEventListener("input", () => {
    nameInput.setCustomValidity(nameInput.value.trim() ? "" : "Veuillez renseigner votre nom.");
});
showMissingFieldNoteWhenInvalid(nameInput, nameNote);
showMissingFieldNoteWhenInvalid(emailInput, emailNote);

function stopTimer() {
    window.clearInterval(timerId);
    timerId = null;
}

function startQuiz() {
    currentQuestion = 0;
    score = 0;
    welcomeScreen.hidden = true;
    resultScreen.hidden = true;
    quizScreen.hidden = false;
    showQuestion();
}

function showQuestion() {
    stopTimer();
    selectedAnswer = null;
    secondsRemaining = QUESTION_TIME_SECONDS;

    const question = questions[currentQuestion];
    progressTrack.setAttribute("aria-valuemax", QUESTION_TIME_SECONDS);
    questionTitle.textContent = question.question;
    questionCount.textContent = `Question ${currentQuestion + 1}/${questions.length}`;
    timerValue.textContent = secondsRemaining;
    progressTrack.setAttribute("aria-valuenow", secondsRemaining);
    progressFill.style.width = "100%";
    nextButton.disabled = true;
    answersContainer.replaceChildren();

    question.answers.forEach((answer, answerIndex) => {
        const answerButton = document.createElement("button");
        answerButton.className = "answer-option";
        answerButton.type = "button";
        answerButton.setAttribute("aria-pressed", "false");

        const marker = document.createElement("span");
        marker.className = "answer-marker";
        marker.setAttribute("aria-hidden", "true");

        const answerText = document.createElement("span");
        answerText.textContent = answer;

        answerButton.append(marker, answerText);
        answerButton.addEventListener("click", () => selectAnswer(answerIndex, answerButton));
        answersContainer.append(answerButton);
    });

    timerId = window.setInterval(() => {
        secondsRemaining -= 1;
        timerValue.textContent = secondsRemaining;
        progressTrack.setAttribute("aria-valuenow", secondsRemaining);
        progressFill.style.width = `${(secondsRemaining / QUESTION_TIME_SECONDS) * 100}%`;

        if (secondsRemaining === 0) {
            goToNextQuestion();
        }
    }, 1000);
}

function selectAnswer(answerIndex, selectedButton) {
    selectedAnswer = answerIndex;
    answersContainer.querySelectorAll(".answer-option").forEach((button) => {
        button.setAttribute("aria-pressed", String(button === selectedButton));
    });
    nextButton.disabled = false;
}

function goToNextQuestion() {
    stopTimer();

    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
        score += 1;
    }

    currentQuestion += 1;
    if (currentQuestion < questions.length) {
        showQuestion();
        return;
    }

    showResults();
}

function showResults() {
    stopTimer();
    quizScreen.hidden = true;
    resultScreen.hidden = false;
    resultScreen.classList.toggle("is-failure", score < PASSING_SCORE);
    window.scrollTo(0, 0);
    resultName.textContent = nameInput.value.trim();
    resultEmail.textContent = emailInput.value.trim();
    resultScore.textContent = `${score}/${questions.length}`;
}

function returnToWelcome() {
    stopTimer();
    quizScreen.hidden = true;
    resultScreen.hidden = true;
    welcomeScreen.hidden = false;
    welcomeForm.reset();
    window.scrollTo(0, 0);
    nameInput.focus();
}

welcomeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startQuiz();
});

nextButton.addEventListener("click", goToNextQuestion);
quitButton.addEventListener("click", returnToWelcome);
homeButton.addEventListener("click", returnToWelcome);