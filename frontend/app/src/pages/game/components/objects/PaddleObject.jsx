// https://chriscourses.com/blog/a-comprehensive-guide-to-materials-in-threejs
import * as THREE from "three";
import { GAME_SCREEN_HEIGHT, BALL_RADIUS } from "../../../../constants.jsx"


export default function PaddleObject(isLeftPaddle, color) {
    const paddlePos = 0.3;
    const paddleRadius = 0.05;
    // crop from paddleHeight by BALL_RADIUS / 2 to help user
    const paddleHeight = 0.3 - (BALL_RADIUS / 2);
    const radialSegments = 20;

    const paddleGeometry = new THREE.CylinderGeometry(
        paddleRadius,
        paddleRadius,
        paddleHeight,
        radialSegments
    );

    const paddleMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.6,
    });

    const paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle.castShadow = true;
    paddle.receiveShadow = true;

    if (isLeftPaddle) {
        paddle.position.x = 0 + paddlePos + paddleRadius;
    } else {
        paddle.position.x = 4 - paddlePos - paddleRadius;
    }
    paddle.position.y = 1.5;
    paddle.position.z = 0.40;

    // function to reverse y position fix
    paddle.updateY = (newY) => {
        paddle.position.y = GAME_SCREEN_HEIGHT - newY;  
    };

    return paddle;
}
