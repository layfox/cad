import {
    ArcCurve,
    Line,
    LineBasicMaterial,
    BufferGeometry,
    Vector3,
    Color,
    MathUtils
} from "three"


/**
 * 计算圆弧原点
 * 三个点坐标计算出原点(圆心点)
*/
function calculateArcOrigin(pt1: Vector3, pt2: Vector3, pt3: Vector3) {
     // 三个点的坐标
     const x1 = pt1.x, x2 = pt2.x, x3 = pt3.x, y1 = pt1.y, y2 = pt2.y, y3 = pt3.y

     // 三个点连接的直线及衍生线距离
     const a = x1 - x2
     const b = y1 - y2
     const c = x1 - x3
     const d = y1 - y3
     const e = ((x1 * x1 - x2 * x2) + (y1 * y1 - y2 * y2)) / 2.0
     const f = ((x1 * x1 - x3 * x3) + (y1 * y1 - y3 * y3)) / 2.0
 
     const det = b * c - a * d;

     const x0 = -(d * e - b * f) / det
     const y0 = -(a * f - c * e) / det
     return new Vector3(x0, y0, 0)
}

/**
 * 计算圆弧半径
 * @param pt1 圆弧任意一点
 * @param origin 原点（圆心点）
*/
function calculateRadiusArc(pt1: Vector3, origin: Vector3) {
    const x1 = pt1.x, y1 = pt1.y,  x0 = origin.x, y0 = origin.y
    const radius = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0))
    return radius
}

/**
 * 计算圆弧任意点到原点的的各种角度
 * @param pt1 圆弧任意一点
 * @param origin 原点（圆心点）
 * @param radius 半径
*/
export function calculateArcAngle(pt1: Vector3 ,origin: Vector3,radius:number) {
    const x1 = pt1.x, x0 = origin.x,  y1 = pt1.y, y0 = origin.y
    let sinValue, cosValue, angle
    sinValue = (y1 - y0) / radius
    cosValue = (x1 - x0) / radius
    if (cosValue >= 0.99999) cosValue = 0.99999;
    if (cosValue <= -0.99999) cosValue = -0.99999;
    angle = Math.acos(cosValue)
    angle = angle / Math.PI * 180;
    if (sinValue < -0.05) angle = 360 - angle;
    return {
        sin: sinValue,
        cos: cosValue,
        angle
    }
}

/**
 * 判断圆弧渲染方向
 * @param angle1 第一个点的角度值
 * @param angle2 第二个点的角度值
 * @param angle3 第三个点的角度值
 * 圆弧三个在圆弧上的角度判断圆弧按照顺时针或者逆时针渲染 true 为顺时针
*/
function judgementArcRenderDirection(angle1:number, angle2:number, angle3:number) {
    // 顺时针 or 逆时针
    let Delta13
    if (angle1 < angle3) {
        Delta13 = angle3 - angle1;
    } else {
        Delta13 = angle3 - angle1 + 360;
    }
    let Delta12
    if (angle1 < angle2) {
        Delta12 = angle2 - angle1;
    }
    else {
        Delta12 = angle2 - angle1 + 360;
    }
    return  Delta12 > Delta13
}

/**
 * 三点创建圆弧
 * @param pt1 开始点
 * @param pt2 圆弧任意一点
 * @param pt3 结束点
 * @param isRule 默认 false pt1是圆弧起始点 pt2圆弧任意一点 pt3是圆弧结束点 否则 pt1是圆弧起始点 pt2是圆弧结束点 pt3是圆弧任意一点 
 * @param alwaysClockwise 默认 false 圆弧根据三个点的角度关系自动确定是顺时针渲染函数逆时针方向渲染 否则为true始终顺时针方向渲染
 * @param color 颜色值
*/
export function createThreePointArc(pt1: Vector3, pt2: Vector3, pt3: Vector3, isRule = false, alwaysClockwise = false, color = new Color("#ff0000")) {

        // 圆心点
        const origin = calculateArcOrigin(pt1, pt2, pt3)
        const x0 = origin.x
        const y0 = origin.y
        // 半径
        const radius = calculateRadiusArc(pt1, origin)
        const ArcAngle1 = calculateArcAngle(pt1, origin, radius)
        const ArcAngle2 = calculateArcAngle(pt2, origin, radius)
        const ArcAngle3 = calculateArcAngle(pt3, origin, radius)
        // 三个点的角度
        let angle1 = ArcAngle1.angle
        let angle2= ArcAngle2.angle
        let angle3= ArcAngle3.angle   
        // 顺时针 or 逆时针
        

        let aClockwise = judgementArcRenderDirection(angle1, angle2, angle3)
        if(alwaysClockwise) {
            // 永远顺时针
            aClockwise = true
        }

        let angle
        let curve
        if(isRule) {
            
            /**
             * 规则: 第一个点位是圆弧起始点 第二个点是圆弧结束点 第三点是圆弧任意一点
             * */ 
            curve = new ArcCurve(x0, y0, radius,  MathUtils.degToRad(angle1),  MathUtils.degToRad(angle2), !aClockwise);
           
            // 圆弧圆心角度
            if (aClockwise) {
                if (angle2 > angle1) {
                    angle = MathUtils.radToDeg(curve.aEndAngle - curve.aStartAngle)
                }
                else {
                    angle = 360 - Math.abs(MathUtils.radToDeg(curve.aEndAngle - curve.aStartAngle))
                }
            } else {
                if (angle1 > angle2) {
                    angle = Math.abs(MathUtils.radToDeg(curve.aEndAngle - curve.aStartAngle))
                } else {
                    angle = 360 - MathUtils.radToDeg(curve.aEndAngle - curve.aStartAngle)
                }
            }
        }else {
            /**
         * 规则: 第一个点位是圆弧起始点 第二个点是圆弧任意一点 第三点是圆弧结束点
         * */ 
        curve = new ArcCurve(x0, y0, radius, MathUtils.degToRad(angle1), MathUtils.degToRad(angle3), aClockwise);
        //  圆弧圆心角度：
      
        if (aClockwise) {
            if (angle3 > angle1) {
             
                angle = 360 - MathUtils.radToDeg(curve.aEndAngle - curve.aStartAngle)
            }
            else {
                // 角度：
                angle = Math.abs(MathUtils.radToDeg(curve.aEndAngle - curve.aStartAngle))
            }
        } else {
            if (angle1 > angle3) {
                // 角度：
                angle = 360 + MathUtils.radToDeg(curve.aEndAngle - curve.aStartAngle)
            } else {
                // 角度：
                angle = MathUtils.radToDeg(curve.aEndAngle - curve.aStartAngle)
            }
        }
        }

     
        //  圆弧弧长
        const arcLength = (angle * Math.PI * radius)  / 180
       
        // 圆弧弦长
        const arcChordLength = 2 * (radius * Math.sin(angle / 2)) 
       
        const geometry = new BufferGeometry().setFromPoints(curve.getPoints(50));
        const material = new LineBasicMaterial({ color })

        
        const arc = new Line(geometry, material)
        return {arc,radius,angle,arcLength,arcChordLength};
}