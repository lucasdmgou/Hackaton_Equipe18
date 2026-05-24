const questionsListElement = document.getElementById("questions-list");
const questionTemplate = document.getElementById("question-template");
const addQuestionButton = document.getElementById("add-question");

const maxQuestions = 10;
const optionIds = ["A", "B", "C", "D"];

function updateQuestionNames() {
    const cards = [...questionsListElement.querySelectorAll(".question-card")];

    cards.forEach((card, index) => {
        card.querySelector(".question-title").innerText = `Pergunta ${index + 1}`;
        card.querySelector("[data-field='text']").name = `questions[${index}][text]`;
        card.querySelector("[data-field='correctAnswer']").name = `questions[${index}][correctAnswer]`;

        optionIds.forEach(optionId => {
            card.querySelector(`[data-option='${optionId}']`).name = `questions[${index}][options][${optionId}]`;
        });

        card.querySelector(".remove-question").disabled = cards.length === 1;
    });

    addQuestionButton.disabled = cards.length >= maxQuestions;
}

function fillQuestionCard(card, question) {
    card.querySelector("[data-field='text']").value = question?.text || "";
    card.querySelector("[data-field='correctAnswer']").value = question?.correctAnswer || "A";

    optionIds.forEach(optionId => {
        const option = question?.options?.find(item => item.id === optionId);
        card.querySelector(`[data-option='${optionId}']`).value = option?.text || "";
    });
}

function addQuestion(question) {
    if (questionsListElement.children.length >= maxQuestions) {
        return;
    }

    const fragment = questionTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".question-card");

    fillQuestionCard(card, question);

    card.querySelector(".remove-question").addEventListener("click", () => {
        card.remove();
        updateQuestionNames();
    });

    questionsListElement.appendChild(fragment);
    updateQuestionNames();
}

addQuestionButton.addEventListener("click", () => addQuestion());

fetch("/questions/api/setup")
    .then(response => response.json())
    .then(data => {
        const savedQuestions = data.questions || [];

        if (savedQuestions.length > 0) {
            savedQuestions.forEach(addQuestion);
        } else {
            addQuestion();
        }
    })
    .catch(() => addQuestion());
