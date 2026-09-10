///////////////////////////////////////////////////////////////////////////////
// 版权所有（C）2002-2022，成都梦想凯德科技有限公司。
// 本软件代码及其文档和相关资料归成都梦想凯德科技有限公司,应用包含本软件的程序必须包括以下版权声明
// 此应用程序与成都梦想凯德科技有限公司成协议。通过使用本软件、其文档或相关材料
///////////////////////////////////////////////////////////////////////////////
import * as THREE from "three";
import {
	McEdGetPointWorldDrawObject,
	MrxDbgUiPrPoint,
	MxFun,
	MxDbArea,
	McGeTool,
	MxDbHatch,
	MxType,
	McGiWorldDraw,
} from "mxdraw";


export class MyArea extends MxDbArea {
	public getDimText(): string {
		let lArea = McGeTool.calcArea(this.points);
		return lArea.toFixed(2) + "m=2";
	}
  
	public create(): MyArea {
		return new MyArea();
	}
  
	public getTypeName(): string {
		return "MyArea";
	}
	onViewChange() {
		this.setNeedUpdateDisplay(true)
		return true
	}
   
}

  

// 面积自定义实体。
export class MeasureArea {
	public Do() {
		const getPoint = new MrxDbgUiPrPoint();
		getPoint.setMessage("\n指定第一点:");
		getPoint.go((status) => {
			if (status != 0) {
				return;
			}
			const pt1 = getPoint.value();
			let area = new MyArea();
			area.addPoint(pt1);
			const worldDrawComment = new McEdGetPointWorldDrawObject();
			worldDrawComment.setDraw(
				(currentPoint: THREE.Vector3, pWorldDraw) => {
					let tmp:MxDbArea = area.clone() as MxDbArea;
					tmp.addPoint(currentPoint);
					worldDrawComment.drawCustomEntity(tmp);
				}
			);
			getPoint.setUserDraw(worldDrawComment);
			getPoint.setMessage("\n指定下一点:");
			getPoint.goWhile(
				(status) => {
					if (status == 0) {
						const pt2 = getPoint.value();
						area.addPoint(pt2);
					}
				},
				(status) => {
					/*
                    const mxDbHatch = new MxDbHatch()
                    mxDbHatch.setPoints(area.points)
                    mxDbHatch.opacity = 0.7
                    mxDbHatch.color = 0x663244;
                    mxDbHatch.setRenderOrder(MxType.MxDefaultRenderOrder.kMxEntityRenderOrder -2);
                    MxFun.getCurrentDraw().addMxEntity(mxDbHatch);
                    */
					
					area.isFill = true;
					area.fillOpacity = 0.7;
					area.fillColor = 0x663244;
					MxFun.getCurrentDraw().addMxEntity(area);
					
				}
			);
			
		});
	}
}
