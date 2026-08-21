import { McEdGetPointWorldDrawObject, MrxDbgUiPrPoint, MxDbEllipse, MxFun } from "mxdraw"

export default function() {
    const point = new MrxDbgUiPrPoint()
	const mxDraw = MxFun.getCurrentDraw()
	const worldDrawComment = new McEdGetPointWorldDrawObject()
    const mxEllipse = new MxDbEllipse()
    point.setMessage("\n点击开始绘制椭圆:");
	point.go(() => {
        mxEllipse.point1 = point.value()
		
		worldDrawComment.setDraw(
			(
			currentPoint
			) => {
			// 动态绘制three.js物体对象
            mxEllipse.point2 = currentPoint
			worldDrawComment.drawCustomEntity(mxEllipse)
			}
		)
		point.setUserDraw(worldDrawComment)
        point.setMessage("\n再次点击结束绘制椭圆:");
		point.go(()=> {
            mxDraw.addMxEntity(mxEllipse)
        })
		
	})
}