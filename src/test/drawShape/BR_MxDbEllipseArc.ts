import { McEdGetPointWorldDrawObject, MrxDbgUiPrPoint, MxDbEllipseArc, MxDbEllipseShape, MxFun } from "mxdraw"
import { addShapeGui } from './addShapeGui'


export const defaultMxDbEllipseArcParams = [
    {
        name: "clockwise",
        label: "clockwise是否顺时针",
        defaultValue: false
    },
    {
        name: "isClosedToCenter",
        label: "isClosedToCenter是否闭合连接圆心",
        defaultValue: true
    }
]

/** 添加椭圆类参数调整GUI */ 
export const addEllipseShapeGui = (obj: MxDbEllipseShape)=> {
    addShapeGui(obj, defaultMxDbEllipseArcParams)
}

/*** 绘制圆弧形状 */
export function BR_MxDbEllipseArc() {

    const getPoint = new MrxDbgUiPrPoint()
    const mxObj = MxFun.getCurrentDraw();
    const draw = new McEdGetPointWorldDrawObject()
    let obj = new MxDbEllipseArc()
    getPoint.setUserDraw(draw)
    getPoint.go(async () => {
        // 第一个点确定圆心
        obj.center = getPoint.value()
        // 第二个点确定半径和开始角
        draw.setDraw((v, pWorldDraw) => {
            obj.startPoint = v
            obj.yRadius = obj.center.distanceTo(v)
            pWorldDraw.drawCustomEntity(obj)
        })
        obj.startPoint = await getPoint.go() || new THREE.Vector3()
        draw.setDraw((v, pWorldDraw) => {
            obj.endPoint = v
            pWorldDraw.drawCustomEntity(obj)
        })
        obj.endPoint = await getPoint.go() || new THREE.Vector3()

        mxObj.addMxEntity(obj);
        addEllipseShapeGui(obj)
    })
}