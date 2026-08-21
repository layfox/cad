import * as THREE from "three";
import { Int8BufferAttribute } from "three";
import { MxThreeJS, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject } from "mxdraw";
export class Arrow {

  public Do() {

	// 让用户在图上点取第一点.
	const myThis = this;
	const getPoint = new MrxDbgUiPrPoint();
	getPoint.setMessage('\n指定第一点:');
	getPoint.go((status) => {
		if (status != 0) {
		return;
		}


		const pt1 = getPoint.value();
		const drawPoint: THREE.Vector3 = new THREE.Vector3();
		drawPoint.x = pt1.x;
		drawPoint.y = pt1.y;

		// 在点取第二点时，设置动态绘制.
		const worldDrawComment = new McEdGetPointWorldDrawObject();

		worldDrawComment.setDraw(
		(
			currentPoint: THREE.Vector3,
			pWorldDraw: McEdGetPointWorldDrawObject
		) => {
			pWorldDraw.setColor(0xFF0000);
			// 动态绘制调用，在鼠标移动过程，会自动两点的距离实时绘制在图上。
			myThis.Draw(pt1, currentPoint, pWorldDraw);
		}
		);

		getPoint.setBasePt(pt1);
		getPoint.setUseBasePt(true);

		getPoint.setUserDraw(worldDrawComment);
		getPoint.setMessage('\n指定第二点:');

		getPoint.go((status) => {
		if (status != 0) {
			console.log(status);
			return;
		}

		getPoint.drawReserve((ent: THREE.Object3D) => {
			// console.log(ent);
		});

	});
	});
  }

  // 获得标注方向
  private getDirection(v2ndPtTo1stPt: THREE.Vector3, i3DFirstPt: THREE.Vector3, i3DSecondPt: THREE.Vector3) {
		const vDirection = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0);

		const mXnormal = new THREE.Vector3(1, 0, 0);
		const fAngle = v2ndPtTo1stPt.angleTo(mXnormal);

		// 标尺与X的角度接近PI 靠近X轴；第二个点在右 或 标尺与X的角度接近0 靠近X轴；第二个点在左
		let fMarkDirAnlge = -1;
		if ((fAngle < (Math.PI * 7 / 18)) || (fAngle > (Math.PI * 10 / 18))) {
			if (i3DFirstPt.x > i3DSecondPt.x) {
				fMarkDirAnlge = 1;
			}
		}

		const rotationWorldMatrix = new THREE.Matrix4();
		rotationWorldMatrix.makeRotationZ(Math.PI / 2 * fMarkDirAnlge);
		vDirection.applyMatrix4(rotationWorldMatrix);

		return vDirection;
  }

  // 动态绘制尺寸标注 。
  private Draw(pt1: THREE.Vector3, pt2: THREE.Vector3, pWorldDraw: { drawEntity: (arg0: THREE.Sprite | THREE.Line | THREE.Mesh | THREE.Points | null) => void; }) {

		// 标注的三条线
		let line1;
		let mTriangle2;

		const v2ndPtTo1stPt = new THREE.Vector3(
		pt1.x - pt2.x,
		pt1.y - pt2.y,
			0);

		const vDirection = this.getDirection(v2ndPtTo1stPt, pt1, pt2);


		const scaleWorldMatrix = new THREE.Matrix4();
		scaleWorldMatrix.makeScale(0.01, 0.01 , 0.01);
		const vTemp = new THREE.Vector3(vDirection.x, vDirection.y, 0);
		vTemp.applyMatrix4(scaleWorldMatrix);

		const mTopPt1 = new THREE.Vector3(pt1.x , pt1.y , 0);
		const mTopPt2 = new THREE.Vector3(pt2.x , pt2.y , 0);

		const color = 0xFF0000;


		// 画线
		{
			scaleWorldMatrix.identity();
			scaleWorldMatrix.makeScale(0.2, 0.2, 0);
			const vTemp1 = new THREE.Vector3(vDirection.x, vDirection.y, 0);
			vTemp1.applyMatrix4(scaleWorldMatrix);

			scaleWorldMatrix.identity();
			scaleWorldMatrix.makeScale(0.02, 0.02, 0);
			const vTemp2 = new THREE.Vector3(vDirection.x, vDirection.y, 0);
			vTemp2.applyMatrix4(scaleWorldMatrix);

			line1 = MxThreeJS.createLine(mTopPt1, mTopPt2, color);

		}



		// 画三角形  箭头
		{
			scaleWorldMatrix.identity();
			scaleWorldMatrix.makeScale(0.08, 0.08, 0.08);

			const rotationWorldMatrix = new THREE.Matrix4();
			rotationWorldMatrix.makeRotationZ(Math.PI * 17 / 18);
			let vTrianglePt1Dir = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0);
			vTrianglePt1Dir.applyMatrix4(scaleWorldMatrix);
			vTrianglePt1Dir.applyMatrix4(rotationWorldMatrix);

			rotationWorldMatrix.identity();
			rotationWorldMatrix.makeRotationZ(-Math.PI * 17 / 18);
			let vTrianglePt2Dir = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0);
			vTrianglePt2Dir.applyMatrix4(scaleWorldMatrix);
			vTrianglePt2Dir.applyMatrix4(rotationWorldMatrix);

			// let pts1:Array<THREE.Vector3> = new Array<THREE.Vector3>();
			// pts1.push(new THREE.Vector3(mTopPt1.x, mTopPt1.y, 0),
			// new THREE.Vector3(mTopPt1.x + vTrianglePt1Dir.x, mTopPt1.y + vTrianglePt1Dir.y, 0),
			new THREE.Vector3(mTopPt1.x + vTrianglePt2Dir.x, mTopPt1.y + vTrianglePt2Dir.y, 0);

		//  mTriangle1 = MxThreeJS.createTriangle(
		//   pts1,color
		//  );

			rotationWorldMatrix.identity();
			rotationWorldMatrix.makeRotationZ(Math.PI / 18);
			vTrianglePt1Dir = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0);
			vTrianglePt1Dir.applyMatrix4(scaleWorldMatrix);
			vTrianglePt1Dir.applyMatrix4(rotationWorldMatrix);

			rotationWorldMatrix.identity();
			rotationWorldMatrix.makeRotationZ(-Math.PI / 18);
			vTrianglePt2Dir = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0);
			vTrianglePt2Dir.applyMatrix4(scaleWorldMatrix);
			vTrianglePt2Dir.applyMatrix4(rotationWorldMatrix);

			const pts2: THREE.Vector3[] = new Array<THREE.Vector3>();
			pts2.push( new THREE.Vector3(mTopPt2.x, mTopPt2.y, 0),
			new THREE.Vector3(mTopPt2.x + vTrianglePt1Dir.x, mTopPt2.y + vTrianglePt1Dir.y, 0),
			new THREE.Vector3(mTopPt2.x + vTrianglePt2Dir.x, mTopPt2.y + vTrianglePt2Dir.y, 0));

			mTriangle2 = MxThreeJS.createTriangle(
			pts2, color
			);
		}


		pWorldDraw.drawEntity(line1);

		pWorldDraw.drawEntity(mTriangle2);

  }

}
