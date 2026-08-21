import { MrxDbgUiPrPoint, MrxDbgUiPrBaseReturn , MxThreeJS, MxDbEntity, McGiWorldDraw, MxFun } from "mxdraw"
import { CircleGeometry, LineBasicMaterial, LineLoop, Vector3 } from "three";



export default function BR_Circle() {
    const getPoint = new MrxDbgUiPrPoint()
    getPoint.setMessage("\n指定圆心:")
    getPoint.go(async (status)=> {
        if(status === MrxDbgUiPrBaseReturn.kOk) {
           

        }
    })
}