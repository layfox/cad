import { McEdGetPointWorldDrawObject, McGiWorldDraw, MrxDbgUiPrPoint, MxDbStarShape, MxFun } from "mxdraw";
import * as THREE from "three";
import { addShapeGui } from "./addShapeGui";
class MxDbStarShapeDraw extends MxDbStarShape {
    innerPoint = new THREE.Vector3();
    outerPoint = new THREE.Vector3();
    constructor() {
        super();
        this._propertyDbKeys = [...this._propertyDbKeys, 'innerPoint', 'outerPoint']
    }
    getGripPoints(): THREE.Vector3[] {
        return [this.center, this.innerPoint, this.outerPoint]
    }
    moveGripPointsAt(index: number, offset: THREE.Vector3) {
        if(index === 0) this.center.add(offset), this.innerPoint.add(offset), this.outerPoint.add(offset)
        if(index === 1) this.innerPoint.add(offset)
        if(index === 2) this.outerPoint.add(offset)
        return true
    }
    worldDraw(pWorldDraw: McGiWorldDraw): void {
        if(this.innerPoint) this.innerRadius = this.center.distanceTo(this.innerPoint)
        if(this.outerPoint) this.outerRadius = this.center.distanceTo(this.outerPoint)
        super.worldDraw(pWorldDraw)
    }
}
export function BR_MxDbStarShape() {
    const getPoint = new MrxDbgUiPrPoint()
    const mxObj = MxFun.getCurrentDraw();
    const draw = new McEdGetPointWorldDrawObject()
    getPoint.setUserDraw(draw)
    const worldDraw = new McEdGetPointWorldDrawObject()
    const obj = new MxDbStarShapeDraw()
    getPoint.setUserDraw(worldDraw)
    getPoint.setMessage("\n确定圆弧开始点:");

    getPoint.go(async (status) => {
        obj.center = getPoint.value()
        worldDraw.setDraw((v)=> {
            obj.innerPoint = v
            worldDraw.drawCircle(obj.center, obj.center.distanceTo(v))
        })
        obj.innerPoint = await getPoint.go() || new THREE.Vector3()
        worldDraw.setDraw((v)=> {
            obj.outerPoint = v
            worldDraw.drawCustomEntity(obj)
        })
        obj.outerPoint = await getPoint.go() || new THREE.Vector3()
        mxObj.addMxEntity(obj)

        addShapeGui(obj)
    })
}