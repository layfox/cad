import { MxFun, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject, MxDbCloudLine } from "mxdraw";

export default function() {
	const point = new MrxDbgUiPrPoint();
	const mxDraw = MxFun.getCurrentDraw();
	const worldDrawComment = new McEdGetPointWorldDrawObject();

	// 屏幕坐标半径
 const radius = MxFun.screenCoordLong2Doc(16);

 point.setMessage("\n点击开启绘制云线:");

 point.go(() => {
		let  pt =  point.value();
		// 云线实例
		const mxCloudLine = new MxDbCloudLine();
		mxCloudLine.setRadius(radius);
		mxCloudLine.addPoint(pt);
		worldDrawComment.setDraw((
			currentPoint,
			) => {
				if (pt.distanceTo(currentPoint) > radius) {
					pt = currentPoint.clone();
					mxCloudLine.addPoint(currentPoint, true);
				}

				worldDrawComment.drawCustomEntity(mxCloudLine);
		});
		point.setUserDraw(worldDrawComment);
		point.setMessage("\n再次点击结束绘制云线:");
		point.go(() => {
			mxDraw.addMxEntity(mxCloudLine);
		});
	});

  }
