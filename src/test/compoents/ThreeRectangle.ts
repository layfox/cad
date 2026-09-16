import {
	Vector3,
	BufferGeometry,
	Geometry,
	LineBasicMaterial,
	LineLoop,
	LineDashedMaterial,
} from "three";

/**
 * 创建矩形
*/
export function createThreeRectangle(pt1: Vector3, pt3: Vector3) {
	const geometry = new Geometry();
	const material = new LineBasicMaterial({
		color: "#ff0000",
	});
	const pt2 = pt1.clone().set(pt3.x, pt1.y, pt3.z);
	const pt4 = pt3.clone().set(pt1.x, pt3.y, pt1.z);
	geometry.setFromPoints([ pt1,
		pt2,
		pt3,
		pt4]);
	const line = new LineLoop(geometry, material);
	return line;
}

// 计算矩形点位
export function computeRectPoints(pt1: Vector3, pt3: Vector3) {
	const pt2 = pt1.clone().set(pt3.x, pt1.y, pt3.z);
	const pt4 = pt3.clone().set(pt1.x, pt3.y, pt1.z);
	return [pt1, pt2, pt3, pt4];
}

export function createThreeDashedRectangle(pt1: Vector3, pt3: Vector3) {

	const geometry = new Geometry();
	geometry.setFromPoints(computeRectPoints(pt1, pt3));
	const line = new LineLoop(geometry, new LineDashedMaterial({
		color: 0x208CA6, // 线段的颜色
		dashSize: 3,
		gapSize: 1,
	}));
	line.computeLineDistances(); // 不可或缺的，若无，则线段不能显示为虚线
	// console.log(pt1,pt3)
	return line;
}





