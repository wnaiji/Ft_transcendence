import { useState, useEffect, useContext, useRef } from "react";
import Container from "react-bootstrap/Container";
import { useNavigate } from "react-router";
import useKeyboard from "../../hooks/useKeyboard.jsx";
import useWindowDimensions from "../../hooks/useWindowDimensions.jsx";
import {
	WSContext,
	CustomizationContext,
} from "../../context/GeneralContext.jsx";
import * as THREE from "three";
import { SceneLoader } from "./components/SceneLoader.jsx";
import {
	GAME_TICK_DEFAULT,
	GAME_COUNTDOWN_DEFAULT,
	GAME_ASPECT_RATIO,
	GAME_BACKEND_HZ_MS,
} from "../../constants.jsx";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

export default function Game() {
	const ws = useContext(WSContext);
	const customization = useContext(CustomizationContext);
	const dimensions = useWindowDimensions();
	// send to websocket keys down/up and return keyboard array
	const keys = useKeyboard(ws);

	const [fontLoaded, setFontLoaded] = useState(false);
	const fontRef = useRef(null);

	const tickUpdateRef = useRef(GAME_TICK_DEFAULT);
	const countdownUpdateRef = useRef(GAME_COUNTDOWN_DEFAULT);

	const divGameRef = useRef(null);
	const sceneRef = useRef(null);
	const cameraRef = useRef(null);
	const rendererRef = useRef(null);
	const gameObjectsRef = useRef(null);
	const animationIdRef = useRef(null);

	// Store the last two positions for the ball:
	const prevBallPosRef = useRef([
		GAME_TICK_DEFAULT.ball_position[0],
		GAME_TICK_DEFAULT.ball_position[1],
	]);
	const currBallPosRef = useRef([
		GAME_TICK_DEFAULT.ball_position[0],
		GAME_TICK_DEFAULT.ball_position[1],
	]);
	const prevLeftPaddlePosRef = useRef(GAME_TICK_DEFAULT.paddle_left);
	const currLeftPaddlePosRef = useRef(GAME_TICK_DEFAULT.paddle_left);
	const prevRightPaddlePosRef = useRef(GAME_TICK_DEFAULT.paddle_right);
	const currRightPaddlePosRef = useRef(GAME_TICK_DEFAULT.paddle_right);

	const lastTickTimeRef = useRef(performance.now());
	const isInCountdown = useRef(false);

	const getRendererSize = () => {
		let newWidth = dimensions.width;
		let newHeight = dimensions.height;

		if (dimensions.width / dimensions.height > GAME_ASPECT_RATIO) {
			newHeight = dimensions.height;
			newWidth = newHeight * GAME_ASPECT_RATIO;
		} else {
			newWidth = dimensions.width;
			newHeight = newWidth / GAME_ASPECT_RATIO;
		}

		return { newWidth, newHeight };
	};

	const initializeGame = (keys) => {
		// if it not associated with the <div> return
		if (!divGameRef.current) return;

		const scene = new THREE.Scene();
		sceneRef.current = scene;

		const { newWidth, newHeight } = getRendererSize();

		const camera = new THREE.PerspectiveCamera(
			75,
			newWidth / newHeight,
			0.1,
			1000
		);

		// for v, b, n support change camera posvn
		if (keys === 1) {
			camera.position.set(0, 0, 3);
		} else if (keys === 2) {
			camera.position.set(0, -1, 3);
		} else if (keys === 3) {
			camera.position.set(0, -4, 3);
		} else {
			camera.position.set(0, 0, 3);
		}

		camera.lookAt(0, 0, 0);
		cameraRef.current = camera;

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
		});
		renderer.setSize(newWidth, newHeight);
		divGameRef.current.appendChild(renderer.domElement);
		rendererRef.current = renderer;

		gameObjectsRef.current = SceneLoader(
			scene,
			fontRef.current,
			customization
		);
	};

	const cleanupGame = () => {
		if (animationIdRef.current) {
			cancelAnimationFrame(animationIdRef.current);
		}

		// added "Dispose of scene objects (geometry/materials)""
		if (sceneRef.current) {
			sceneRef.current.traverse((object) => {
				if (!object.isMesh) return;

				// Dispose of geometry
				if (object.geometry) {
					object.geometry.dispose();
				}

				// Dispose of material(s)
				if (object.material) {
					if (Array.isArray(object.material)) {
						object.material.forEach((mat) => mat.dispose());
					} else {
						object.material.dispose();
					}
				}
			});
		}

		if (rendererRef.current) {
			rendererRef.current.dispose();
			if (divGameRef.current?.contains(rendererRef.current.domElement)) {
				divGameRef.current.removeChild(rendererRef.current.domElement);
			}
		}
		sceneRef.current = null;
		cameraRef.current = null;
		rendererRef.current = null;
		gameObjectsRef.current = null;
	};

	const gameLoop = () => {
		if (gameObjectsRef.current == null) return; //fix
		const { texts, ball, paddles } = gameObjectsRef.current;

		if (!isInCountdown.current) {
			const timeSinceLastTick =
				performance.now() - lastTickTimeRef.current;
			let alpha = timeSinceLastTick / GAME_BACKEND_HZ_MS;
			if (alpha > 1) {
				alpha = 1;
			}
			// Interpolate ball
			let [px, py] = prevBallPosRef.current;
			const [cx, cy] = currBallPosRef.current;

			const dx = Math.abs(cx - px);
			// magic number when the ball is reset dx appx 1.9 so detect
			if (dx > 1.5) {
				prevBallPosRef.current = [cx, cy];
				px = cx;
				py = cy;
			}

			const ballX = px + alpha * (cx - px);
			const ballY = py + alpha * (cy - py);

			ball.position.x = ballX;
			ball.updateY(ballY);

			// Interpolate left paddle
			const leftPaddlePrev = prevLeftPaddlePosRef.current;
			const leftPaddleCurr = currLeftPaddlePosRef.current;
			const leftY =
				leftPaddlePrev + alpha * (leftPaddleCurr - leftPaddlePrev);
			paddles.left.updateY(leftY);

			// Interpolate right paddle
			const rightPaddlePrev = prevRightPaddlePosRef.current;
			const rightPaddleCurr = currRightPaddlePosRef.current;
			const rightY =
				rightPaddlePrev + alpha * (rightPaddleCurr - rightPaddlePrev);
			paddles.right.updateY(rightY);
		} else if (countdownUpdateRef.current.value > 0) {
			texts.counter.updateText(String(countdownUpdateRef.current.value));
			texts.counter.setVisibility(true);
			if (countdownUpdateRef.current.mode == 1) {
				texts.msg.setVisibility(false);
			}
			if (countdownUpdateRef.current.mode == 2) {
				texts.msg.updateText(countdownUpdateRef.current.text);
				texts.msg.setVisibility(true);
			}
		} else if (countdownUpdateRef.current.value == 0) {
			isInCountdown.current = false; // to restart game refresh
			texts.counter.setVisibility(false);
			texts.msg.setVisibility(false);
			countdownUpdateRef.current.value = -1; // to disable if/else if
		}

		texts.score.left.updateText(String(tickUpdateRef.current.points[0]));
		texts.score.right.updateText(String(tickUpdateRef.current.points[1]));

		if (rendererRef.current && sceneRef.current && cameraRef.current) {
			rendererRef.current.render(sceneRef.current, cameraRef.current);
		}

		// requestAnimationFrame(gameLoop);
		animationIdRef.current = requestAnimationFrame(gameLoop);
	};

	// handle three font load (keep it no clear useEffect)
	useEffect(() => {
		if (fontRef.current != null) {
			// to check if useful ?
			setFontLoaded(true);
			return;
		}
		const loader = new FontLoader();
		loader.load(
			"src/assets/fonts/Rye_Regular_three.json",
			(loadedFont) => {
				fontRef.current = loadedFont;
				setFontLoaded(true);
			},
			undefined,
			(error) => {
				console.error(
					"An error occurred while loading the font:",
					error
				);
			}
		);
	}, []);

	// handle game start/responsive/end
	useEffect(() => {
		if (!fontLoaded) return;

		cleanupGame();
		initializeGame(keys);
		animationIdRef.current = requestAnimationFrame(gameLoop);
		return cleanupGame;
	}, [dimensions, fontLoaded, customization.data, keys]);

	// handle websocket
	useEffect(() => {
		if (ws.webSocket) {
			const handleMessage = (event) => {
				const data = JSON.parse(event.data);
				if (data.key === "GAME_TICK") {
					//approxhelper big chat
					// Move “current” to “previous”
					prevBallPosRef.current = currBallPosRef.current;
					prevLeftPaddlePosRef.current = currLeftPaddlePosRef.current;
					prevRightPaddlePosRef.current =
						currRightPaddlePosRef.current;

					// Update “current” positions from server data
					currBallPosRef.current = [
						data.ball_position[0],
						data.ball_position[1],
					];
					currLeftPaddlePosRef.current = data.paddle_left;
					currRightPaddlePosRef.current = data.paddle_right;

					// Record the time of this new tick
					lastTickTimeRef.current = performance.now();
					//end approxhelper

					tickUpdateRef.current = data;
				} else if (data.key === "GAME_COUNTDOWN") {
					isInCountdown.current = true;
					countdownUpdateRef.current = data;
				}
			};
			ws.webSocket.addEventListener("message", handleMessage);
			return () =>
				ws.webSocket.removeEventListener("message", handleMessage);
		}
	}, [ws.webSocket]);

	return (
		<Container
			fluid
			className="d-flex justify-content-center align-items-center p-0"
			style={{
				width: "100vw",
				height: "100vh",
				overflow: "hidden",
				// backgroundColor: "#000", // Add a background color to see the container
			}}
		>
			<div
				style={{
					position: "relative",
					width: `${getRendererSize().newWidth}px`,
					height: `${getRendererSize().newHeight}px`,
					maxWidth: "100%",
					maxHeight: "100%",
				}}
			>
				<div
					ref={divGameRef}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						zIndex: 0,
					}}
				/>
			</div>
		</Container>
	);
}
