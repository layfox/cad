import { MxFun, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject, MrxDbgUiPrBaseReturn, MxDbAnyLine } from "mxdraw"

export default function() {
	const point = new MrxDbgUiPrPoint()
	const mxDraw = MxFun.getCurrentDraw()
	const worldDraw = new McEdGetPointWorldDrawObject()
    const anyLine = new MxDbAnyLine()
    point.setUserDraw(worldDraw)
    point.setMessage("\n点击开始画线:");
	point.go((status)=> {
        if(status === MrxDbgUiPrBaseReturn.kOk) {
            anyLine.points.push(point.value())
            
            worldDraw.setDraw((currentPoint)=> {
                anyLine.points.push(currentPoint.clone())
                worldDraw.drawCustomEntity(anyLine)
            })
            
        }
        point.setMessage("\n再次点击结束画线:");
        point.go((status)=> {
            
            if(status === MrxDbgUiPrBaseReturn.kOk) {
                mxDraw.addMxEntity(anyLine)
            }
        })
    })
  }