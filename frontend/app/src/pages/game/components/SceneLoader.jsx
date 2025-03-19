import * as THREE from "three";
import BoardObject from "./objects/BoardObject.jsx";
import LightObject from "./objects/LightObject.jsx";
import PaddleObject from "./objects/PaddleObject.jsx";
import BallObject from "./objects/BallObject.jsx";
import TextObject from "./objects/TextObject.jsx";

import { GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT } from "../../../constants.jsx";

export function SceneLoader(scene, font, customization) {
	console.log("customisation changed", customization.data);
	const board = BoardObject(
		customization.data.board_color,
		customization.data.board_opacity
	);
	const ambLight = LightObject(true);
	const dirLight = LightObject(false);

	const group_center_coord = new THREE.Group();
	const leftScore = TextObject("0", 0, font);
	const RightScore = TextObject("0", 1, font);
	const counterText = TextObject("CNT", 2, font);
	const msgText = TextObject("MSG", 3, font);
	const delimiterText = TextObject(
		"- - - - - - - - - - - - - - - -",
		4,
		font
	);
	const leftPaddle = PaddleObject(true, customization.data.paddle_color_left);
	const rightPaddle = PaddleObject(
		false,
		customization.data.paddle_color_right
	);
	const ball = BallObject(customization.data.ball_color);

	group_center_coord.add(leftScore);
	group_center_coord.add(RightScore);
	group_center_coord.add(counterText);
	group_center_coord.add(msgText);
	group_center_coord.add(delimiterText);
	group_center_coord.add(leftPaddle);
	group_center_coord.add(rightPaddle);
	group_center_coord.add(ball);

	group_center_coord.position.set(
		-(GAME_SCREEN_WIDTH / 2.0),
		-(GAME_SCREEN_HEIGHT / 2.0),
		0
	);

	scene.add(board);
	scene.add(ambLight);
	scene.add(dirLight);
	scene.add(group_center_coord);

	return {
		texts: {
			score: { left: leftScore, right: RightScore },
			counter: counterText,
			msg: msgText,
		},
		paddles: {
			left: leftPaddle,
			right: rightPaddle,
		},
		ball,
	};
}
