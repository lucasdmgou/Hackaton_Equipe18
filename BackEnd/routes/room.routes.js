const express = require("express");
const router = express.Router();

const roomController = require("../controllers/rooms/room.controller");
const requireNickname = require("../middlewares/auth.middleware");

router.post("/rooms/create", requireNickname, roomController.createRoom);
router.post("/rooms/join", requireNickname, roomController.joinRoom);

router.get("/room/:code", requireNickname, roomController.renderRoom);
router.get("/api/rooms/:code", requireNickname, roomController.getRoomData);

module.exports = router;