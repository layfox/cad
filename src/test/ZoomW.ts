import { McEdGetPointWorldDrawObject, MrxDbgUiPrPoint, MxFun } from "mxdraw";
import * as THREE from "three";
import { Int8BufferAttribute } from "three";

export class ZoomW
{

    
  // 动态绘制尺寸标注 。
  private Draw(pt1:THREE.Vector3,pt2:THREE.Vector3,pWorldDraw: { drawLine: (arg0: THREE.Vector3, arg1: THREE.Vector3) => void; }){

    let pt3 = new THREE.Vector3(pt1.x,pt2.y);
    let pt4 = new THREE.Vector3(pt2.x,pt1.y);
    pWorldDraw.drawLine(pt1,pt3);
    pWorldDraw.drawLine(pt3,pt2);
    pWorldDraw.drawLine(pt2,pt4);
    pWorldDraw.drawLine(pt4,pt1);
  }

  public Do(){

    // 让用户在图上点取第一点.
    let myThis = this;
    const getPoint = new MrxDbgUiPrPoint()
    getPoint.setMessage('\n指定第一点:')
    getPoint.go((status: number) => {
      if (status != 0) {
        return
      }

      
      const pt1 = getPoint.value()
      const drawPoint: THREE.Vector3 = new THREE.Vector3()
      drawPoint.x = pt1.x
      drawPoint.y = pt1.y

      // 在点取第二点时，设置动态绘制.
      const worldDrawComment = new McEdGetPointWorldDrawObject()
      worldDrawComment.setDraw(
        (
          currentPoint: THREE.Vector3,
          pWorldDraw: any
        ) => {
          // 动态绘制调用，在鼠标移动过程，会自动两点的距离实时绘制在图上。
          myThis.Draw(pt1,currentPoint,pWorldDraw);
        }
      )

      getPoint.setBasePt(pt1);
      getPoint.setUseBasePt(false);

      getPoint.setUserDraw(worldDrawComment)
      getPoint.setMessage('\n指定第二点:');

      getPoint.go((status: number)=>{
        if(status != 0)
        {
            console.log(status);
            return;
        }
        // 成功取到第二点.
        const pt2 = getPoint.value()
        
        MxFun.zoomW(pt1.x,pt1.y,pt2.x,pt2.y,false);

    });
    })
  }

}