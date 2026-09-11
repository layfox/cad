///////////////////////////////////////////////////////////////////////////////
// 版权所有（C）2002-2022，成都梦想凯德科技有限公司。
// 本软件及其文档和相关资料归成都梦想凯德科技有限公司
// 应用包含本软件的程序必须包括以下声明
// 在版权声明中：
// 此应用程序与成都梦想凯德科技有限公司成协议。
// 通过使用本软件、其文档或相关材料
///////////////////////////////////////////////////////////////////////////////
import { McEdGetPointWorldDrawObject, MrxDbgUiPrPoint, MrxDbgUtils, MxDbImage, MxFun, MxType} from "mxdraw";
import * as THREE from "three";

function drawRect(pt1: THREE.Vector3, pt2: THREE.Vector3, dAng: number, worldDraw: McEdGetPointWorldDrawObject) {
	pt1.z = 0;
	pt2.z = 0;
	const pt3 = new THREE.Vector3(pt1.x, pt2.y, 0);
	const pt4 = new THREE.Vector3(pt2.x, pt1.y, 0);

	const vec = new THREE.Vector3();
	vec.subVectors(pt2, pt1);
	vec.multiplyScalar(0.5);
	const cenPt = pt1.clone();
	cenPt.add(vec);

	const matRot = new THREE.Matrix4().makeRotationZ(dAng);

	const mat = new THREE.Matrix4()
		.makeTranslation(cenPt.x, cenPt.y, cenPt.z)
		.multiply(matRot)
		.multiply(new THREE.Matrix4().makeTranslation(-cenPt.x, -cenPt.y, -cenPt.z));

	pt1.applyMatrix4(mat);
	pt2.applyMatrix4(mat);
	pt3.applyMatrix4(mat);
	pt4.applyMatrix4(mat);

	worldDraw.drawLine(pt1, pt3);
	worldDraw.drawLine(pt3, pt2);
	worldDraw.drawLine(pt2, pt4);
	worldDraw.drawLine(pt4, pt1);
}

export async function Mx_RoatateImage() {
	const ids: number[] = await MrxDbgUtils.selectEnt("select image", {type: "MxDbImage"});
	if (ids.length == 0) { return; }

	const ent = MxFun.getMxEntity(ids[0]);
	if (!ent) { return; }
	const image = ent as MxDbImage;

	const pt1 = image.getPoint1();
	const pt2 = image.getPoint2();
	const ang = image.getAngle();

	const vec = new THREE.Vector3();
	vec.subVectors(pt2, pt1);
	vec.multiplyScalar(0.5);
	const cenPt = pt1.clone();
	cenPt.add(vec);
	cenPt.z = 0;
	const getPoint = new MrxDbgUiPrPoint();

	const tmpImage = image.clone() as MxDbImage;
	image.visible = false;
	image.setNeedUpdateDisplay();
	tmpImage.loadMaterial();
	const worldDrawComment = new McEdGetPointWorldDrawObject();
	let newAng = ang;
	worldDrawComment.setDraw((currentPoint: THREE.Vector3) => {
		currentPoint.z = 0;
		const vecFx = new THREE.Vector3();
		vecFx.subVectors(currentPoint, cenPt);
		const xA = new THREE.Vector3(1, 0, 0);

		let dAng = vecFx.angleTo(xA);
		if (vecFx.cross(xA).z > 0) {
			dAng = 2 * 3.14159265 - dAng;
		}

		newAng = ang + dAng;
		drawRect(pt1.clone(), pt2.clone(), newAng, worldDrawComment);
		tmpImage.setAngle(newAng);
		worldDrawComment.drawCustomEntity(tmpImage, MxType.MxDefaultRenderOrder.kCADMeshRenderOrder - 1);

	});

	getPoint.setBasePt(cenPt);
	getPoint.setUseBasePt(true);

	getPoint.setUserDraw(worldDrawComment);
	getPoint.setMessage("\n旋转图片:");

	const newpt: THREE.Vector3 | null = await getPoint.go();
	if (!newpt) {
		return;
	}

	image.visible = true;
	image.setAngle(newAng);
	image.setNeedUpdateDisplay();
}
