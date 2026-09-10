///////////////////////////////////////////////////////////////////////////////
// 版权所有（C）2002-2022，成都梦想凯德科技有限公司。
// 本软件及其文档和相关资料归成都梦想凯德科技有限公司
// 应用包含本软件的程序必须包括以下声明
// 在版权声明中：
// 此应用程序与成都梦想凯德科技有限公司成协议。
// 通过使用本软件、其文档或相关材料
///////////////////////////////////////////////////////////////////////////////
import * as THREE from "three";
import { McEdGetPointWorldDrawObject, McGiWorldDraw, MrxDbgUiPrPoint, MxDbLine, MxDbRect, MxFilters, MxFun } from "mxdraw";
export async function Mx_DrawRect() {
	const getPoint = new MrxDbgUiPrPoint();
	const mxObj = MxFun.getCurrentDraw();

	getPoint.setMessage("\n指定第一点:");
	const pt1 = await getPoint.go();
	if (!pt1) {
		return;
	}

	// 使用 MyRect 实体做动态预览（四条线绘制，无旋转）
	const previewRect = new MyRect();
	previewRect.pt1 = pt1;
	previewRect.ang = 0;  // 正矩形，不旋转
	previewRect.color = new THREE.Color("#ff6600");
	previewRect.dLineWidth = MxFun.screenCoordLong2Doc(2);
	previewRect.lineWidthByPixels = true;

	// 动态预览
	const worldDrawComment = new McEdGetPointWorldDrawObject();
	worldDrawComment.setDraw((currentPoint: THREE.Vector3) => {
		previewRect.pt2 = currentPoint;
		worldDrawComment.drawCustomEntity(previewRect);
	});

	getPoint.setBasePt(pt1);
	getPoint.setUseBasePt(true);
	getPoint.setUserDraw(worldDrawComment);
	getPoint.setMessage("\n指定第二点:");

	const pt2 = await getPoint.go();
	if (!pt2) {
		return;
	}

	// 最终绘制：使用四条 MxDbLine 绘制矩形（保证渲染可靠）
	const lineTop = new MxDbLine();
	lineTop.pt1 = new THREE.Vector3(pt1.x, pt1.y, 0);
	lineTop.pt2 = new THREE.Vector3(pt2.x, pt1.y, 0);
	lineTop.color = new THREE.Color("#ff6600");
	lineTop.setLineWidth(2);
	lineTop.setLineWidthByPixels(true);
	mxObj.addMxEntity(lineTop);

	const lineRight = new MxDbLine();
	lineRight.pt1 = new THREE.Vector3(pt2.x, pt1.y, 0);
	lineRight.pt2 = new THREE.Vector3(pt2.x, pt2.y, 0);
	lineRight.color = new THREE.Color("#ff6600");
	lineRight.setLineWidth(2);
	lineRight.setLineWidthByPixels(true);
	mxObj.addMxEntity(lineRight);

	const lineBottom = new MxDbLine();
	lineBottom.pt1 = new THREE.Vector3(pt2.x, pt2.y, 0);
	lineBottom.pt2 = new THREE.Vector3(pt1.x, pt2.y, 0);
	lineBottom.color = new THREE.Color("#ff6600");
	lineBottom.setLineWidth(2);
	lineBottom.setLineWidthByPixels(true);
	mxObj.addMxEntity(lineBottom);

	const lineLeft = new MxDbLine();
	lineLeft.pt1 = new THREE.Vector3(pt1.x, pt2.y, 0);
	lineLeft.pt2 = new THREE.Vector3(pt1.x, pt1.y, 0);
	lineLeft.color = new THREE.Color("#ff6600");
	lineLeft.setLineWidth(2);
	lineLeft.setLineWidthByPixels(true);
	mxObj.addMxEntity(lineLeft);
}


export class MyRect extends MxDbRect {
	public ang: number = 0;
	public getGripPoints(): THREE.Vector3[] {
		const ret = new THREE.Vector3();
		ret.x = this.pt1.x + (this.pt2.x - this.pt1.x) * 0.5;
		ret.y = this.pt1.y + (this.pt2.y - this.pt1.y) * 0.5;
		return [ret];
	}

	public moveGripPointsAt(index: number, offset: THREE.Vector3): boolean {
		if (index === 0) {
			this.pt1.add(offset);
			this.pt2.add(offset);
		}
		return true;
	}

	public create(): MyRect {
		return new MyRect();
	}

	public getTypeName(): string {
		return "MyRect";
	}

	public worldDraw(pWorldDraw: McGiWorldDraw): void {
		// super.worldDraw(pWorldDraw);
		const cen = new THREE.Vector3(this.pt1.x + (this.pt2.x - this.pt1.x) * 0.5, this.pt1.y + (this.pt2.y - this.pt1.y) * 0.5);

		const mat = new THREE.Matrix4().makeTranslation(cen.x, cen.y, 0).multiply(new THREE.Matrix4().makeRotationZ(this.ang)).multiply(new THREE.Matrix4().makeTranslation(-cen.x, -cen.y, 0));

		const pt1 = new THREE.Vector3(this.pt1.x, this.pt1.y, 0);
		const pt2 = new THREE.Vector3(this.pt1.x, this.pt2.y, 0);
		const pt3 = new THREE.Vector3(this.pt2.x, this.pt2.y, 0);
		const pt4 = new THREE.Vector3(this.pt2.x, this.pt1.y, 0);

		pt1.applyMatrix4(mat);
		pt2.applyMatrix4(mat);
		pt3.applyMatrix4(mat);
		pt4.applyMatrix4(mat);

		pWorldDraw.drawLine(pt1, pt2);
		pWorldDraw.drawLine(pt2, pt3);

		pWorldDraw.drawLine(pt3, pt4);
		pWorldDraw.drawLine(pt4, pt1);
	}

	public dwgIn(obj: any): boolean {
		super.dwgIn(obj);

		this.ang = obj.ang;

		return true;
	}

	public dwgOut(obj: any): object {
		super.dwgOut(obj);
		obj.ang = this.ang;
		return obj;
	}
}


export async function Mx_MyDrawRect() {
	const getPoint = new MrxDbgUiPrPoint();
	getPoint.setMessage("\n指定第一点:");
	const pt1: THREE.Vector3 | null = await getPoint.go();
	if (!pt1) {
		return;
	}

	const rect = new MyRect();
	rect.pt1 = pt1;
	rect.ang = Math.PI * 0.24;

	// 在点取第二点时，设置动态绘制.
	const worldDrawComment = new McEdGetPointWorldDrawObject();
	worldDrawComment.setDraw((currentPoint: THREE.Vector3) => {
		rect.pt2 = currentPoint;
		worldDrawComment.drawCustomEntity(rect);
	});

	getPoint.setBasePt(pt1);
	getPoint.setUseBasePt(true);

	getPoint.setUserDraw(worldDrawComment);
	getPoint.setMessage("\n指定第二点:");

	const pt2: THREE.Vector3 | null = await getPoint.go();
	if (!pt2) {
		return;
	}

	rect.pt2 = getPoint.value();
	rect.color = new THREE.Color("#FF2233");
	rect.opacity = 1;
	rect.renderOrder = 5;
	// rect.isSolidColorFill = true;
	rect.dLineWidth = MxFun.screenCoordLong2Doc(5);
	rect.lineWidthByPixels = false;

	// rect.setRadius(0);
	// rect.setFillImagePath("./models/img/mxcad.jpg");
	// rect.setFilter(new MxFilters().channel({r:33,g:0,b:0}));
	MxFun.getCurrentDraw().addMxEntity(rect);
}
