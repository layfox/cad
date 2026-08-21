import { McEdGetPointWorldDrawObject, MrxDbgUiPrPoint, MxDbCircleArc, MxFun } from "mxdraw"

import { addEllipseShapeGui } from "./BR_MxDbEllipseArc";


/*** 绘制圆弧形状 */
export function BR_MxDbCircleArc() {

    const getPoint = new MrxDbgUiPrPoint()
    const mxObj = MxFun.getCurrentDraw();
    const draw = new McEdGetPointWorldDrawObject()
    let obj = new MxDbCircleArc()
    obj.stroke = "#ff0000"
    getPoint.setUserDraw(draw)
    getPoint.setMessage("\n确定圆弧中点:");
    getPoint.go(async () => {

        // 第一个点确定圆心
        obj.center = getPoint.value()
        // 第二个点确定半径和开始角
        draw.setDraw((v) => {
            draw.drawLine(obj.center, v)
        })
        getPoint.setMessage("\n确定圆弧开始点:");
        obj.startPoint = await getPoint.go() || new THREE.Vector3()
        draw.setDraw((v) => {
            obj.endPoint = v
            draw.drawCustomEntity(obj)
        })
        getPoint.setMessage("\n确定圆弧结束点:");
        // 第三个点确定结束角
        obj.endPoint = await getPoint.go() || new THREE.Vector3()
        draw.setDraw(()=> {})
        mxObj.addMxEntity(obj);
        addEllipseShapeGui(obj);
    })
}