import { MxFun, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject, MxDb2LineAngularDimension } from "mxdraw"

// 测量角度
export default function() {
    // 动态点对象 存储顶点数组
	const point = new MrxDbgUiPrPoint()
	// 绘制控件
	const mxDraw = MxFun.getCurrentDraw()
    
    const angleDim = new MxDb2LineAngularDimension()

    // 开启连续点击
    const worldDraw = new McEdGetPointWorldDrawObject()
    point.setMessage("\n指定第一点:");
	point.go((status) => {
        if(status !== 0) {
            return
        }
        point.setMessage("\n指定第二个角度点:");
        angleDim.point1 = point.value()
        worldDraw.setDraw((currentPoint, pWorldDraw)=> {
            angleDim.point2 = currentPoint
            worldDraw.drawLine(angleDim.point1, currentPoint)
        })
        point.setUserDraw(worldDraw)
        point.go((status)=> {
            point.setMessage("\n指定最后一个点:");
            if(status !== 0) {
                return
            }
            angleDim.point2 = point.value()
            worldDraw.setDraw((currentPoint, pWorldDraw)=> {
                angleDim.point3 = currentPoint
                worldDraw.drawCustomEntity(angleDim);
            })
            point.go((status)=> {
                if(status !== 0) {
                    return
                }
                mxDraw.addMxEntity(angleDim)
            })
        })
    })
}