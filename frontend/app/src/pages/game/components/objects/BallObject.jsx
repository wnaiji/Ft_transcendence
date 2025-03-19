// https://chriscourses.com/blog/a-comprehensive-guide-to-materials-in-threejs
import * as THREE from "three";
import { GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT, BALL_RADIUS } from "../../../../constants.jsx"

export default function BallObject(color) {
    const ballSegments = 16;
    const ballGeometry = new THREE.SphereGeometry(
        BALL_RADIUS,
        ballSegments,
        ballSegments
    );
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.7,
    });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.castShadow = true;
    ball.receiveShadow = true;

    ball.position.set(GAME_SCREEN_WIDTH / 2.0, GAME_SCREEN_HEIGHT / 2.0, 0.4);

    // function to reverse y position fix
    ball.updateY = (newY) => {
        ball.position.y = GAME_SCREEN_HEIGHT - newY;  
    };

    return ball;
}
