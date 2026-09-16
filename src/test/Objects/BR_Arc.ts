// 三点画圆弧

import {MxFun, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject, MrxDbgUiPrBaseReturn, Mx3PointArc } from "mxdraw";
import { createThreePointArc } from "../compoents/ThreePointArc";


// 测量角度
export default function() {
	// 获取动态点对象
	const point = new MrxDbgUiPrPoint();
	// 开启连续点击
 const worldDraw = new McEdGetPointWorldDrawObject();

 const arc = new Mx3PointArc();
 arc.closed = false;
 arc.setColor("#ff0000").setLineWidth(10);
	point.setUserDraw(worldDraw);
 point.setMessage("\n确定圆弧开始点:");
 point.go((status) => {
		if (status === MrxDbgUiPrBaseReturn.kOk) {
			arc.point1 = point.value();

			worldDraw.setDraw((currentPoint) => {
				worldDraw.drawLine(arc.point1, currentPoint);
			});
		}
		point.setMessage("\n确定圆弧结束点:");
		point.go((status) => {
			if (status === MrxDbgUiPrBaseReturn.kOk) {

				arc.point2 = point.value();
				worldDraw.setDraw((currentPoint) => {
					arc.point3 = currentPoint;
					worldDraw.drawCustomEntity(arc);
				});
			}
			point.setMessage("\n确定圆弧上任意一点:");
			point.go((status) => {
				if (status === MrxDbgUiPrBaseReturn.kOk) {
					const mxDraw = MxFun.getCurrentDraw();
					mxDraw.addMxEntity(arc);

					const {radius, angle, arcLength} = createThreePointArc(arc.point1, arc.point2, arc.point3, true);


					console.log("半径:" , radius);

					console.log("圆弧圆心角度:" , angle);
					//  圆弧弧长

					console.log("圆弧弧长:" , arcLength);
					// 圆弧弦长

				}
			});
		});
	});
  }
