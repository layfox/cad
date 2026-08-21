import { McEdGetPointWorldDrawObject, MrxDbgUiPrPoint, MxDbCircleArc, MxFun, MxDbArcShapeDraw } from "mxdraw"
import { addEllipseShapeGui } from "./BR_MxDbEllipseArc";

/*** 绘制圆弧形状 */
export function BR_MxDbArcShape() {

    const getPoint = new MrxDbgUiPrPoint()
    const mxobj = MxFun.getCurrentDraw();
    const worldDraw = new McEdGetPointWorldDrawObject()
    let arc = new MxDbArcShapeDraw()
    getPoint.setMessage("\n确定圆弧中点:");
    getPoint.setUserDraw(worldDraw)
    getPoint.go(async () => {
        getPoint.setMessage("\n确定圆弧开始点:");

        arc.center = getPoint.value()
        worldDraw.setDraw((v)=> {
            arc.interRadiusPoint = v
            worldDraw.drawCircle(arc.center, v.distanceTo(arc.center))
        })
        arc.interRadiusPoint = await getPoint.go() || new THREE.Vector3()
        worldDraw.setDraw((v)=> {
            arc.outerRadiusPoint = v
            worldDraw.drawCustomEntity(arc)
        })
        arc.outerRadiusPoint = await getPoint.go() || new THREE.Vector3()
        mxobj.addMxEntity(arc)
        addEllipseShapeGui(arc)

    })
}