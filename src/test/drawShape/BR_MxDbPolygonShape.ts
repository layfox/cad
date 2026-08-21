import { McEdGetPointWorldDrawObject, McGiWorldDraw, MrxDbgUiPrPoint, MxDbShape, MxFun } from "mxdraw";
import * as THREE from "three";
import { addShapeGui } from "./addShapeGui";

class MxDbPolygonShape extends MxDbShape {

    getTypeName() {
        return "MxDbPolygonShape"
    }

    points:THREE.Vector3[] = []
    constructor() {
        super()
        this._propertyDbKeys = [...this._propertyDbKeys, 'points']
    }
    
    worldDraw(pWorldDraw: McGiWorldDraw): void {
        if(this.points.length > 2)
        this._draw(pWorldDraw, this.points)
        this._drawStoreLine(pWorldDraw, this.points)
    }

    getGripPoints(): THREE.Vector3[] {
        const box = this.getGeomExtents()
        const center = new THREE.Vector3()
        box?.getCenter(center)
        return [...this.points,center]
    }

    moveGripPointsAt(index: number, offset: THREE.Vector3) {
        if(index === this.points.length) {
            this.points = this.points.map((point)=> {
                return point.add(offset)
            })
        }else {
            this.points[index].add(offset)
        }
        return true
    }

    getGeomExtents(): THREE.Box3 | null {
        return new THREE.Box3().setFromPoints(this.points)
    }
}

export function BR_MxDbPolygonShape() {
    const getPoint = new MrxDbgUiPrPoint()
    const mxObj = MxFun.getCurrentDraw();
    const draw = new McEdGetPointWorldDrawObject()
    getPoint.setUserDraw(draw)
    const worldDraw = new McEdGetPointWorldDrawObject()
    const obj = new MxDbPolygonShape()
    getPoint.setUserDraw(worldDraw)
    getPoint.setMessage("\n确定圆弧开始点:");

    getPoint.goWhile(()=> {
        obj.points.push(getPoint.value())
        worldDraw.setDraw((v)=> {
            obj.closed = false
            if(obj.points.length > 0) {
                worldDraw.drawLine(v, obj.points[obj.points.length - 1])
                worldDraw.drawLine(v, obj.points[0])
                if(obj.points.length === 2) worldDraw.drawLine(obj.points[1], obj.points[0])
            }
            worldDraw.drawCustomEntity(obj)
        })
    }, ()=> {
        obj.closed = true
        mxObj.addMxEntity(obj)
        addShapeGui(obj)
    })
}