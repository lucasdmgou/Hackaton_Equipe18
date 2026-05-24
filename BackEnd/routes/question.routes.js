const express = require("express");
const router = express.Router();

const questionController = require("../controllers/questions/question.controller");
const requireNickname = require("../middlewares/auth.middleware");

router.get("/", requireNickname, questionController.renderQuestionForm);
router.post("/", requireNickname, questionController.saveQuestions);
router.get("/api/setup", requireNickname, questionController.getQuestionSetup);

module.exports = router;
