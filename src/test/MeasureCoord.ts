///////////////////////////////////////////////////////////////////////////////
// 版权所有（C）2002-2022，成都梦想凯德科技有限公司。
// 本软件代码及其文档和相关资料归成都梦想凯德科技有限公司,应用包含本软件的程序必须包括以下版权声明
// 此应用程序与成都梦想凯德科技有限公司成协议。通过使用本软件、其文档或相关材料
///////////////////////////////////////////////////////////////////////////////
import * as THREE from "three";
import {
  MrxDbgUiPrPoint,
  MxDbCoord,
  MxFun,
} from "mxdraw";

export class MeasureCoord {
  public Do() {
	// 让用户在图上点取第一点.
	const myThis = this;
	const getPoint = new MrxDbgUiPrPoint();
	getPoint.setMessage("\n指定坐标点:");
	getPoint.go((status) => {
		if (status != 0) {
		return;
		}

		const pt1 = getPoint.value();

		const mxCoord = new MxDbCoord();
		mxCoord.point1 = pt1;
		mxCoord.point2 = pt1.clone();

		getPoint.setBasePt(pt1);
		getPoint.setUseBasePt(true);

		getPoint.setUserDraw((curPoint, pWorldDraw) => {
		mxCoord.point2 = curPoint;
		pWorldDraw.drawCustomEntity(mxCoord);
		});

		getPoint.setMessage("\n指定标注点:");

		getPoint.go((status) => {
		if (status != 0) {
			console.log(status);
			return;
		}
		mxCoord.point2 = getPoint.value();
		MxFun.addToCurrentSpace(mxCoord);
		});
	});
  }
}
