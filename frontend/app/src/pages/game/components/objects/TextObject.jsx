import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

// mode 0 left score
// mode 1 right score
// mode 2 COUNTDOWN
// mode 3 MESSAGE
// mode 4 middle
export default function TextObject(defaultText, mode, font) {
	const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
	const initialText = new TextGeometry(defaultText, {
		font: font,
		size: 0.2,
		depth: 0.25,
	});

	initialText.center();

	const text = new THREE.Mesh(initialText, textMaterial);

	if (mode === 0) {
        text.position.set(1, 2.4, 0.2);
	}
	if (mode === 1) {
		text.position.set(3, 2.4, 0.2);
	} else if (mode === 2) {
		text.position.set(1, 0.5, 0.2);
		text.visible = false;
	} else if (mode === 3) {
		text.position.set(1, 0.75, 0.2);
		text.visible = false;
	} else if (mode === 4) {
		text.position.set(2, 1.5, 0.2);
		text.rotation.z = Math.PI / 2;
	}

	text.updateText = (newText) => {
		if (text.geometry.parameters.text !== newText) {
			text.geometry.dispose();
			const newGeometry = new TextGeometry(newText, {
				font: font,
				size: 0.2,
				depth: 0.25,
			});

			newGeometry.center();
			text.geometry = newGeometry;
		}
	};

	text.setVisibility = (visible) => {
		if (text.visible !== visible) {
			text.visible = visible;
		}
	};

	return text;
}
