import * as THREE from "three";

export default function LightObject(isAmbiantLight) {
    if (isAmbiantLight) {
        return new THREE.AmbientLight(0xffffff, 1.4);
    }
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 10);
    return directionalLight;
}
