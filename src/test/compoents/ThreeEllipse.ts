import {
    Vector3,
    LineBasicMaterial,
    EllipseCurve,
    Geometry,
    BufferGeometry,
    Line
} from "three"
/**
 * 绘制椭圆 */ 
export function createThreeEllipse(pt1: Vector3, pt3: Vector3) {
    const pt2 = pt1.clone().set(pt3.x, pt1.y, pt3.z)
    const pt4 = pt3.clone().set(pt1.x, pt3.y, pt1.z)
    const xRadius = pt1.distanceTo(pt2) / 2
    const yRadius = pt1.distanceTo(pt4) / 2

    const isDirectionX = pt1.x > pt3.x
    const isDirectionY = pt1.y > pt3.y
    const curve  = new EllipseCurve(isDirectionX ? pt1.x - xRadius: pt1.x + xRadius, isDirectionY ?  pt1.y - yRadius : pt1.y + yRadius, - xRadius, - yRadius,0, 2 * Math.PI, false, 0)
    const points = curve.getPoints( 50 )
    const gemoetry = new Geometry().setFromPoints(points)
    const material = new LineBasicMaterial({ color: "#ff0000" })
    const ellipse = new Line(gemoetry, material)
    return ellipse
}   