import { McEdGetPointWorldDrawObject, McGiWorldDraw, MrxDbgUiPrPoint, MxDbRingShape, MxFun } from "mxdraw";
import * as THREE from "three";

import { addEllipseShapeGui } from "./BR_MxDbEllipseArc";
class MxDbRingShapeDraw extends MxDbRingShape {
	public innerPoint = new THREE.Vector3();
	public outerPoint = new THREE.Vector3();
	constructor() {
		super();
		this._propertyDbKeys = [...this._propertyDbKeys, 'innerPoint', 'outerPoint'];
	}
	public getGripPoints(): THREE.Vector3[] {
		return [this.center, this.innerPoint, this.outerPoint];
	}
	public moveGripPointsAt(index: number, offset: THREE.Vector3) {
		if (index === 0) { this.center.add(offset), this.innerPoint.add(offset), this.outerPoint.add(offset); }
		if (index === 1) { this.innerPoint.add(offset); }
		if (index === 2) { this.outerPoint.add(offset); }
		return true;
	}
	public worldDraw(pWorldDraw: McGiWorldDraw): void {
		if (this.innerPoint) { this.innerRadius = this.center.distanceTo(this.innerPoint); }
		if (this.outerPoint) { this.outerRadius = this.center.distanceTo(this.outerPoint); }
		super.worldDraw(pWorldDraw);
	}
}
export function BR_MxDbRingShape() {
	const getPoint = new MrxDbgUiPrPoint();
	const mxObj = MxFun.getCurrentDraw();
	const draw = new McEdGetPointWorldDrawObject();
	getPoint.setUserDraw(draw);
	const worldDraw = new McEdGetPointWorldDrawObject();
	const obj = new MxDbRingShapeDraw();
	getPoint.setUserDraw(worldDraw);
	getPoint.setMessage("\n确定圆弧开始点:");

	getPoint.go(async (status) => {
		obj.center = getPoint.value();
		worldDraw.setDraw((v) => {
			worldDraw.drawCircle(obj.center, obj.center.distanceTo(v));
		});
		obj.innerPoint = await getPoint.go() || new THREE.Vector3();
		worldDraw.setDraw((v) => {
			obj.outerPoint = v;
			worldDraw.drawCustomEntity(obj);
		});
		obj.outerPoint = await getPoint.go() || new THREE.Vector3();

		mxObj.addMxEntity(obj);

		addEllipseShapeGui(obj);
	});
}
