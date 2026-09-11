

// 正多边形
import { Vector3, Geometry, BufferGeometry, Float32BufferAttribute, LineLoop, LineBasicMaterial, Color } from "three";

// 根据中心点和边角一点(圆上任意一点) 计算多边形顶点坐标位置
export function computeRegularPolygonVertices(centerPt = new Vector3(), pt = new Vector3(), segments = 3) {
	const vertices = [];
	segments = Math.max( 3, segments );
	vertices.push(pt);
	const angle = (Math.PI * 2) / segments;
	for (let i = 1; i < segments; i++) {
		const c = Math.cos( angle * i ), s = Math.sin( angle * i );
		const startPt = centerPt.clone();
		const endPt = pt.clone();
		const x = endPt.x - startPt.x;
		const y = endPt.y - startPt.y;
		const point = new  Vector3(x * c - y * s + startPt.x,  x * s + y * c + startPt.y);
		vertices.push(
			point
		);
	}
	return vertices;
}

/**
 * 创建正多边形
 * @param centerPt 中点
 * @param pt 边角一点
 * @param segments 边数
 * */
export  function createThreeRegularPolygon(centerPt = new Vector3(), pt = new Vector3(), segments = 3) {
	const geometry = new Geometry();
	geometry.vertices = computeRegularPolygonVertices(centerPt, pt, segments);
	const material = new LineBasicMaterial({
		color: new Color("#ff0000"),
	});
	return new LineLoop(geometry, material);
}
