import { McEdGetPointWorldDrawObject, MrxDbgUiPrPoint, MxDbRegularPolygon, MxFun } from "mxdraw";
import { addShapeGui } from "../drawShape/addShapeGui";
import { createGui, GuiParam } from "../GUI";

export default function() {
	const point = new MrxDbgUiPrPoint();
	const mxDraw = MxFun.getCurrentDraw();
	const worldDrawComment = new McEdGetPointWorldDrawObject();
	const mxRegularPolygon = new MxDbRegularPolygon();
	mxRegularPolygon.sidesNumber = 8;

	point.setMessage("\n点击开始绘制多边形:");
	point.go(() => {
		mxRegularPolygon.centerPoint = point.value();
		point.setUserDraw(worldDrawComment);
		worldDrawComment.setDraw(
			(
				currentPoint
			) => {
				// 动态绘制three.js物体对象
				mxRegularPolygon.otherPoint = currentPoint;
				worldDrawComment.drawCustomEntity(mxRegularPolygon);
			}
		);
		point.setMessage("\n再次点击结束绘制多边形:");
		point.go(() => {
			mxDraw.addMxEntity(mxRegularPolygon);
			const gui = createGui();
			gui.addColor(mxRegularPolygon, 'color');
			gui.add(mxRegularPolygon, 'opacity', 0, 1, 0.1);
			gui.add(mxRegularPolygon, 'visible');
			gui.add(mxRegularPolygon, 'sidesNumber', 3, 10);
			gui.add(mxRegularPolygon, 'sidesNumber', 3, 10);
		});
	});
}
