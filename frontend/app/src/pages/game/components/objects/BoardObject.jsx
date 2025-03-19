import * as THREE from "three";
import { GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT } from "../../../../constants";

export default function BoardObject(BoardColor, BoardOpacity) {
    const width = GAME_SCREEN_WIDTH;
    const height = 0.5;
    const depth = GAME_SCREEN_HEIGHT; // height is depth ?

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
        color: BoardColor,
        roughness: 0.5,
        transparent: true,
        opacity: BoardOpacity,
    });

    const board = new THREE.Mesh(geometry, material);
    board.rotation.x = -Math.PI / 2;
    board.position.y = 0;
    return board;
}
