import { Color, Scene } from "three";

/**
 * 设置Scene背景色
*/
export function setSenceColor(scene: Scene, color: string | Color | number) {
	scene.background = new Color(color);
}
