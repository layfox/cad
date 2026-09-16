
import { MagnifyLens } from "./index";
import { MxFun } from 'mxdraw';
// 测试THREE 放大镜功能
export function magnifyLensTest() {
	const draw = MxFun.getCurrentDraw();
	const renderer = draw.getRenderer();
	const scene = draw.getScene();
	const camera = draw.getCamera();
	const magnify = new MagnifyLens(renderer, scene, camera);
	// 关闭
	//  magnify.close()
}
