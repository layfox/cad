import Mx, { MxDbArrow, MxFun } from "mxdraw";
import { addShapeGui } from "./addShapeGui";
export function getScreenPixel(pixel: number, isFontSize?: boolean): number {
	let _pixel = Mx.MxFun.screenCoordLong2World(isFontSize ? pixel : pixel - pixel / 3);
	_pixel = Mx.MxFun.worldCoordLong2Doc(_pixel);
	return _pixel;
}
export function BR_Arrow() {
	const worldDraw = new Mx.McEdGetPointWorldDrawObject();
	const lines = new MxDbArrow();
	const mxDraw = MxFun.getCurrentDraw();
	const point = new Mx.MrxDbgUiPrPoint();
	point.setUserDraw(worldDraw);
	lines.setLineWidth(10);
	lines.innerOffset = getScreenPixel(10);
	lines.outerOffset = getScreenPixel(22);
	lines.topOffset = getScreenPixel(36);
	point.go(() => {

		lines.startPoint = point.value();
		worldDraw.setDraw((v) => {
			lines.endPoint = v;
			worldDraw.drawCustomEntity(lines);
		});
		point.go(async (status) => {
			lines.endPoint = point.value();

			mxDraw.addMxEntity(lines);
			addShapeGui(lines, [{
				name: "topOffset",
				label: "topOffset箭头顶部偏移量",
				box: {
					min: 0,
					max: 10000,
				},
			},
			{
				name: "innerOffset",
				label: "innerOffset箭头内部部偏移量",
				box: {
					min: 0,
					max: 10000,
				},
			},
			{
				name: "outerOffset",
				label: "outerOffset箭头外部偏移量",
				box: {
					min: 0,
					max: 10000,
				},
			},
			{
				name: "isSharpCorner",
				label: "isSharpCorner是否为底部尖角箭头",
			},
			]);
		});
	});
}
