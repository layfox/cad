import { MxFun } from "mxdraw";
import { Line, LineDashedMaterial, LineLoop, LineSegments } from "three";
//  解决线宽问题
import { Object3D, BufferGeometry, Vector2, Vector3, Geometry, Material, Color, Float32BufferAttribute } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';



// 保存原本的setFromPoints方法
const _setFromPoints = LineGeometry.prototype.setFromPoints;

/**
 * 基础线段几何体
 * */
export class BasicLineGeometry extends LineGeometry {
	constructor() {
		super();
	}
	/**
     * 将原Line几何体转换为Line2几何体
    */
	public transitionGemetry(geometry: BufferGeometry | Geometry ) {
		let points: number[] | Float32Array = [];
		let colors: number[] | Float32Array = [];
		if ((geometry as Geometry)?.isGeometry) {
			geometry = (geometry as Geometry);
			const pts = geometry.vertices;
			for (let i = 0; i < pts.length; i++) {
				const point: any = pts[i];
				points.push(point?.x, point?.y, point?.z || 0);
			}

		}
		if ((geometry as BufferGeometry)?.isBufferGeometry) {
			geometry = geometry as BufferGeometry;
			points = geometry.attributes?.position?.array as  number[];
			colors = geometry.attributes?.color?.array as  number[];
		}
		this.setPositions(points);
	}

	// 重写方法
	public setFromPoints(points: Vector3[] | Vector2[]): BufferGeometry {
		const positions = [];
		for (let i = 0; i < points.length; i++) {
			positions.push(points[i].x, points[i].y, (points[i] as any)?.z || 0);
		}
		this.setPositions( positions );
		_setFromPoints.call(this, points);
		return this;
	}
}
	// 在绘制时记录当前的大小
let linewidth: number;
/**
 * 基础线段材质
 * */
export class BasicLineMaterial extends LineMaterial {
	constructor(...arr: any) {
		super(...arr);
	}
	/**
     * 将原Line材质转换为Line2材质
    */
	public transitionMaterial(meterial: Material | any) {

		this.color = meterial?.color || new Color();

	// 屏幕坐标长度转THREE.JS坐标长度

		if (!linewidth) { linewidth = MxFun.screenCoordLong2World(10); }
		console.log(linewidth);
		this.linewidth =  10 * linewidth / MxFun.screenCoordLong2World(10);
		console.log(this.linewidth);
		this.transparent = meterial?.transparent || true;

		// 虚线
		// this.dashed = false
		// this.dashScale = MxFun.screenCoordLong2Doc(0.00005)
		// this.dashSize = MxFun.screenCoordLong2Doc(1)
		// this.gapSize = MxFun.screenCoordLong2Doc(1)
		// this.defines.USE_DASH = "";
		// this.precision  = 'lowp'
		// this.needsUpdate = true
		const canvas = MxFun.getCurrentDraw().getCanvas();
		this.resolution.set( canvas.width, canvas.height);
	}

}

/**
 * 基础线段
 * */
export class BasicLine extends Line2 {
	/** @param line 不支持线宽的线对象 */
	constructor(line: Line | LineLoop | LineSegments) {
		super(new BasicLineGeometry(), new BasicLineMaterial());
		const geometry = (this.geometry as BasicLineGeometry);
		const material = (this.material as BasicLineMaterial);
		geometry.transitionGemetry(line.geometry);
		material.transitionMaterial(line.material);
		this.computeLineDistances();
	}
}
