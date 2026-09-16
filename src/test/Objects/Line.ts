
import { McEdGetPointWorldDrawObject, MrxDbgUiPrPoint, MxDbLine, MxDbPolyline, MxFun } from "mxdraw";
import { Vector3} from "three";

// 画连续线段
export function BR_Lines() {
	const getPoint = new MrxDbgUiPrPoint();
	   getPoint.setMessage('\n指定第一点:');
	   const objLines = new MxDbPolyline();
	// 最开始的点
	let startPt: Vector3;
	   getPoint.go((status) => {
		if (status != 0) {
		   return;
		}

		const pt = getPoint.value();
  if (!startPt) {startPt =  pt.clone(); }
  let endPt = pt;
		const worldDrawComment = new McEdGetPointWorldDrawObject();
		worldDrawComment.setDraw(
		(
			currentPoint,
			pWorldDraw: McEdGetPointWorldDrawObject
		) => {
			pWorldDraw.setColor(0xFF0000);
   pWorldDraw.drawLine(endPt, currentPoint);
			pWorldDraw.drawCustomEntity(objLines);
		}
		);

		getPoint.setUserDraw(worldDrawComment);
		getPoint.setMessage('\n指定下一点:');

		let iCount = 0;
		objLines.addVertexAt(pt);
		getPoint.goWhile((status) => {
		if (status == 0) {
			endPt = getPoint.value();

   objLines.addVertexAt(endPt);

			iCount++;

			if (iCount >= 2) {
			getPoint.setMessage('\n指定下一点:');
			getPoint.setKeyWords('[闭合(C)/放弃(U)]');
			} else if (iCount > 0) {
			getPoint.setMessage('\n指定下一点:');
			getPoint.setKeyWords('[放弃(U)]');
			} else {
			getPoint.setMessage('\n指定第一点:');
			getPoint.setKeyWords('');
			}
		} else if (status == 1) {

			// 输入关键字.
			if (getPoint.isKeyWordPicked('C')) {
			// 闭合

			return { exit: true };
			} else if (getPoint.isKeyWordPicked('U')) {

			// 回退
			console.log('Mx_Line undo....');
			}
		}

		// 退出goWhile
		// return {"exit":true};

		}, () => {

			MxFun.getCurrentDraw().addMxEntity(objLines);
		});
	});
}

// 画线
export async function BR_Line() {

	const getPoint = new MrxDbgUiPrPoint();
	getPoint.setMessage("\n指定第一点:");
	   const pt1: THREE.Vector3|null = await getPoint.go();
	   if (pt1 == null) {
		return;

	}
	getPoint.setBasePt(pt1.clone());
	getPoint.setUseBasePt(true);
	getPoint.setMessage("\n指定第二点:");
	const pt2: THREE.Vector3|null = await getPoint.go();
	   if (pt2 == null) {
		return;
	}

	const line  = new MxDbLine();
	line.pt1 = pt1;
	line.pt2 = pt2;

	   line.setDashLineDisplay(true);
	   line.setLineWidth(10);
	   line.setLineWidthByPixels(true);

	MxFun.addToCurrentSpace(line);
  }
