const path = require("path");

const optionIds = ["A", "B", "C", "D"];
const maxQuestions = 10;
const defaultTimeLimit = 20;

function getFieldValue(value) {
    return String(value || "").trim();
}

function normalizeQuestions(body) {
    const incomingQuestions = Array.isArray(body.questions)
        ? body.questions
        : Object.values(body.questions || {});

    return incomingQuestions
        .slice(0, maxQuestions)
        .map((question, index) => {
            const options = optionIds.map(id => ({
                id,
                text: getFieldValue(question.options?.[id])
            }));

            return {
                id: index + 1,
                text: getFieldValue(question.text),
                options,
                correctAnswer: getFieldValue(question.correctAnswer).toUpperCase(),
                timeLimit: defaultTimeLimit
            };
        })
        .filter(question => {
            return question.text &&
                optionIds.includes(question.correctAnswer) &&
                question.options.every(option => option.text);
        });
}

const renderQuestionForm = (req, res) => {
    return res.sendFile(path.join(__dirname, "..", "..", "..", "FrontEnd", "pages", "questions.html"));
};

const saveQuestions = (req, res) => {
    const questions = normalizeQuestions(req.body);

    if (questions.length === 0) {
        return res.status(400).send("Cadastre pelo menos uma pergunta completa.");
    }

    req.session.questions = questions;

    return res.redirect("/lobby");
};

const getQuestionSetup = (req, res) => {
    return res.json({
        maxQuestions,
        questions: req.session.questions || []
    });
};

module.exports = {
    renderQuestionForm,
    saveQuestions,
    getQuestionSetup
};
