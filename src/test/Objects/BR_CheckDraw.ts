import { MxFun, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject, MrxDbgUiPrBaseReturn, MxThreeJS, MxDbRectBoxLeadComment } from "mxdraw";
import { LineDashedMaterial } from "three";

export default function() {
	const point = new MrxDbgUiPrPoint();
	   const mxDraw = MxFun.getCurrentDraw();
	   const worldDrawComment = new McEdGetPointWorldDrawObject();
	const mxCheckDraw = new MxDbRectBoxLeadComment();

	mxCheckDraw.radius = MxFun.screenCoordLong2Doc(8);
	mxCheckDraw.setLineWidth(3);
	mxCheckDraw.setLineWidthByPixels(true);
	point.setMessage("\n云线框起始点:");
	point.go((status) => {
		if (status != MrxDbgUiPrBaseReturn.kOk) {
			return;
		}
		mxCheckDraw.point1 = point.value();
		worldDrawComment.setDraw((currentPoint) => {
			mxCheckDraw.point2 = currentPoint;
			worldDrawComment.drawCustomEntity(mxCheckDraw);

		});

		point.setUserDraw(worldDrawComment);
		point.setMessage("\n云线框结束点:");
		point.go((status) => {
			if (status != MrxDbgUiPrBaseReturn.kOk) {
				return;
			}
			mxCheckDraw.point2 = point.value();

			worldDrawComment.setDraw((currentPoint) => {
				mxCheckDraw.point3 = currentPoint;
				worldDrawComment.drawCustomEntity(mxCheckDraw);
			});
			mxCheckDraw.text = "审图批注XXXXXXXXXX";

			// mxCheckDraw.text = "审图批注XXTest12345678901234567890123456789111111";
			mxCheckDraw.textWidth = MxFun.screenCoordLong2Doc(200);
			mxCheckDraw.textHeight = MxFun.screenCoordLong2Doc(50);

			mxCheckDraw.fixedSize = true;
			if (mxCheckDraw.fixedSize) {
				mxCheckDraw.textHeight = 20;
				mxCheckDraw.textWidth = 230;
			}


			point.setMessage("\n审图标注点:");
			point.go((status) => {
				if (status != MrxDbgUiPrBaseReturn.kOk) {
					return;
				}
				mxCheckDraw.point3 = point.value();
				mxDraw.addMxEntity(mxCheckDraw);
			});
		});
	});
}
