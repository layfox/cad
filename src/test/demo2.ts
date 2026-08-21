///////////////////////////////////////////////////////////////////////////////
//通过使用本软件、其文档或相关材料
///////////////////////////////////////////////////////////////////////////////
import * as THREE from "three";
import { McGiWorldDraw, MrxDbgUiPrPoint, MxDbLine, MxDbSVG, MxDbSVGText, MxFun, MxType } from "mxdraw";

enum MouseButton {
    kInvalid = -1,
    kLeft = 0,
    kMid = 1,
    kRight = 2,
}

// 注册鼠标事件.
let isRegistMouseEvent = false;
function registMouseEvent() {
    if (isRegistMouseEvent) {
        return;
    }
    isRegistMouseEvent = true;

    MxFun.addWindowsEvent((type: string, event: any) => {
        if (type == "mousedown") {
            // 如果当前有命令在运行，就不处理鼠标事件。
            if (MxFun.isRunningCommand()) {
                return 0;
            }

            // 只处理鼠标左键按下事件.
            // if (event.button != MouseButton.kLeft) {
            if (event.button != MouseButton.kRight) {
                return 0;
            }

            var srcElement = event.srcElement;
            if (srcElement && srcElement.tagName == "CANVAS") {
                let mxobj = MxFun.getCurrentDraw();
                let pt = new THREE.Vector3(event.offsetX, event.offsetY, 0);
                pt = mxobj.screenCoord2Doc(pt.x, pt.y);
                let aryFind = mxobj.findMxEntityAtPoint(pt);

                if (aryFind.length) {
                    event.preventDefault();
                    if (aryFind[0].getTypeName() == "MxDbSVG") {
                        let tag: MxDbSVG = aryFind[0] as MxDbSVG;
                        let txt: MxDbSVGText | null = tag.getText(0);
                        if (txt) {
                            mxobj.resetThreeJSControls();
                            alert(txt.txt);
                        }
                    }
                }

                return 1;
            }
        }
        return 0;
    });
}

let iDrawTagCount = 0;

export async function Mx_DrawImageTag() {
    registMouseEvent();

    let material = await MxFun.loadImageMaterial(`models/svg/mark.png`);
    if (!material) return;

    // 点取第一点.
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定第一点:");
    getPoint.go((status) => {
        if (status != 0) {
            return;
        }
        const pt = getPoint.value();
        let iSize = 50;
        let svgSize = MxFun.screenCoordLong2Doc(iSize);
        let pty = pt.y;
        for (let index = 0; index < 10; index++) {
            pt.x += svgSize * 1.2;
            pt.y = pty;
            for (let index2 = 0; index2 < 3; index2++) {
                pt.y += svgSize * 1.2;
                let svg = new MxDbSVG();
                svg.setImagePath(`models/svg/mark.png`, material as any);
                svg.useSvgColor = true;

                svg.setSvgPostion(pt);
                svg.svgMargin.x = 0.0;
                svg.svgMargin.y = 0.0;
                svg.setSvgAlignmentRatio(new THREE.Vector2(0.5, 0.5));
                svg.setRenderOrder(MxType.MxDefaultRenderOrder.kMxEntityRenderOrder + 1);

                // 非固定屏幕尺寸文字.

               
                svg.setSvgSize(new THREE.Vector2(svgSize, 0));

                 /*let lTextH = MxFun.screenCoordLong2Doc(30);
                let svgTxt2: MxDbSVGText = new MxDbSVGText();
                svgTxt2.txt = "B" + iDrawTagCount;
                svgTxt2.txtPos = new THREE.Vector3(pt.x, pt.y + svgSize * 0.5 + lTextH * 0.4, 0);
                svgTxt2.txtHeight = lTextH;
                svg.addText(svgTxt2);
                svg.color = 0xff0000;
*/
                // 固定屏幕尺寸文字.
                /*
    let iSize = 50;
    svg.setSvgSize(new THREE.Vector2(iSize, 0));
    svg.fixedSize = true;
    iDrawTagCount++;
    */

                MxFun.getCurrentDraw().addMxEntity(svg);
            }
        }
    });
}

export function Mx_DrawTag() {
    registMouseEvent();
    // 点取第一点.
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定第一点:");
    getPoint.go((status) => {
        if (status != 0) {
            return;
        }
        const pt = getPoint.value();

        let svg = new MxDbSVG();
        svg.setSvgPath(`models/svg/mark.svg`);
        //svg.setSvgPath(`models/svg/12.svg`, true);
        svg.useSvgColor = true;
        //svg.useSvgColor = false;

        // 精确设置svg图片中，每个元素的颜色.
        svg.setSvgChildColor([0x0000ff, 0x00ff00, 0x00ff00, 0x00ff00]);

        svg.setSvgPostion(pt);
        svg.svgMargin.x = 0.09;
        svg.svgMargin.y = 0.09;
        svg.setSvgAlignmentRatio(new THREE.Vector2(0.5, 0.5));

        svg.setRenderOrder(MxType.MxDefaultRenderOrder.kMxEntityRenderOrder + 1);
        //svg.setRenderOrder(MxType.MxDefaultRenderOrder.kCADCurveRenderOrder - 1);
        let iSize = 50;
        let svgSize = MxFun.screenCoordLong2Doc(iSize);

        svg.setSvgSize(new THREE.Vector2(svgSize, 0));
        iDrawTagCount++;

        let svgTxt1: MxDbSVGText = new MxDbSVGText();
        svgTxt1.txt = "A" + iDrawTagCount;
        let lTextH = MxFun.screenCoordLong2Doc(30);
        svgTxt1.txtPos = new THREE.Vector3(pt.x, pt.y - svgSize * 0.5 - lTextH, 0);
        svgTxt1.txtHeight = lTextH;
        svgTxt1.move = true;
        svgTxt1.drawConnectingLine = true;
        svgTxt1.underline = true;
        svgTxt1.fontStyle = "bold";
        svg.addText(svgTxt1);

        let svgTxt2: MxDbSVGText = new MxDbSVGText();
        svgTxt2.txt = "B" + iDrawTagCount;
        svgTxt2.txtPos = new THREE.Vector3(pt.x, pt.y + svgSize * 0.5 + lTextH * 0.4, 0);
        svgTxt2.txtHeight = lTextH;
        svg.addText(svgTxt2);

        svg.color = 0xff0000;

        svg.userData = { data: "xxxx" };

        /*
        let text = svg.getText(0);
        if(text){
            text.txt = "xxxx";
            text.color = 0X00FF00;
        }*/

        MxFun.getCurrentDraw().addMxEntity(svg);
        /*
    setTimeout(() => {
      svg.setSvgChildColor([0x000044, 0x00ff44, 0x00ff44, 0x00ff44]);
      MxFun.getCurrentDraw().resetRenderer();
      MxFun.updateDisplay();
      
    }, 1000);
*/
    });
}

export function Mx_DeleteTag() {
    MxFun.selectEnt("选择删除标记对象", { type: "MxDbSVG" }).then((id: number) => {
        if (id != 0) {
            let mxobj = MxFun.getCurrentDraw();
            mxobj.getMxEntity(id).erase();
        }
    });
}

export function Mx_DeleteEntity(){
    MxFun.selectEnt("选择删除批注对象").then((id: number) => {
        if (id != 0) {
            let mxobj = MxFun.getCurrentDraw();
            mxobj.getMxEntity(id).erase();
        }
    });
}

export function Mx_DeleteTag_A2() {
    let mxobj = MxFun.getCurrentDraw();
    let aryEnt = mxobj.getAllMxEntity();
    aryEnt.forEach((ent) => {
        if (ent.getTypeName() == "MxDbSVG") {
            let tag: MxDbSVG = ent as MxDbSVG;
            let txt: MxDbSVGText | null = tag.getText(0);

            if (txt && txt.txt == "A2") {
                tag.erase();
                mxobj.updateDisplay();
            }
        }
    });
}

let ptSaveView1: THREE.Vector3 | null = null;
let ptSaveView2: THREE.Vector3 | null = null;

export function BR_SaveViewport() {
    let mxobj = MxFun.getCurrentDraw();
    let pt1 = new THREE.Vector3(0, 0, 0);
    let pt2 = new THREE.Vector3(mxobj.getViewWidth(), mxobj.getViewHeight(), 0);
    ptSaveView1 = mxobj.screenCoord2Doc(pt1.x, pt1.y);
    ptSaveView1 = mxobj.docCoord2Cad(ptSaveView1.x,ptSaveView1.y,ptSaveView1.z);
    ptSaveView2 = mxobj.screenCoord2Doc(pt2.x, pt2.y);
    ptSaveView2 = mxobj.docCoord2Cad(ptSaveView2.x,ptSaveView2.y,ptSaveView2.z);
}

export function BR_RestoreViewport() {
    if (ptSaveView1 == null || ptSaveView2 == null) return;
    let mxobj = MxFun.getCurrentDraw();
    mxobj.zoomW(ptSaveView1, ptSaveView2, false);
    mxobj.updateDisplay();
}

export function BR_WriteImage() {
    MxFun.getCurrentDraw().createCanvasImageData(
        (imageData: String) => {
            let newWindow: any = window.open();
            if (newWindow != null) {
                newWindow.document.write('<img src="' + imageData + '"/>');
            }
        },
        {
            width: 1000,
            height: 800,
        }
    );
}

export function BR_DisabledZoom() {
    let mxobj = MxFun.getCurrentDraw();
    mxobj.enableZoom(false);
}

export function BR_DisabledPan() {
    let mxobj = MxFun.getCurrentDraw();
    mxobj.enablePan(false);
}

export async function BR_CreateGroup() {
    let mxobj = MxFun.getCurrentDraw();
    let database = mxobj.getMxDatabase();

    // 创建一个组，组名为MyGroup
    let group = database.addGroup("MyGroup");

    // 下面画两个直线，把它们放到同一个组。
    for (let i = 0; i < 2; i++) {
        const getPoint = new MrxDbgUiPrPoint();
        getPoint.setMessage("\n指定第一点:");
        let pt1: THREE.Vector3 | null = await getPoint.go();
        if (pt1 == null) {
            return;
        }
        getPoint.setUserDraw((curPoint, pDraw) => {
            pDraw.setColor(0x00ff00);
            pDraw.drawLine(pt1 as THREE.Vector3, curPoint);
        });

        getPoint.setMessage("\n指定第二点:");
        let pt2: THREE.Vector3 | null = await getPoint.go();
        if (pt2 == null) {
            return;
        }

        let line = new MxDbLine();
        line.pt1 = pt1;
        line.pt2 = pt2;

        let database = MxFun.getCurrentDatabase();

        database.addLayer("aa");
        database.setCurrentLayer("aa");

        database.addEntity(line);
        group.append(line.objectId());
    }
}

export function BR_DeleteGroup() {
    let mxobj = MxFun.getCurrentDraw();
    let database = mxobj.getMxDatabase();

    // 得到组"MyGroup"
    let group = database.getGroup("MyGroup");
    if (!group) return;

    // 得到组里面所有对象.
    let aryId = group.getAll();

    // 删除组.
    if (aryId.length != 0) {
        aryId.forEach((val) => {
            mxobj.eraseMxEntity(val);
        });
        mxobj.updateDisplay();
    }
    database.deleteGroup("MyGroup");
}


//

export class MyRectSvg extends MxDbSVG {
    constructor() {
      super()
    }
    public worldDraw(pWorldDraw: McGiWorldDraw): void {
        super.worldDraw(pWorldDraw);
        let mxObj = pWorldDraw.getMxObject()
        let rect = this.calcSvgDrawRect(mxObj);
        let pt1 = rect.pt1
        let pt2 = rect.pt3
        let pt3 = rect.pt2
        let pt4 = rect.pt4

        pWorldDraw.drawLine(pt1,pt2);
        pWorldDraw.drawLine(pt2,pt3);
        pWorldDraw.drawLine(pt3,pt4);
        pWorldDraw.drawLine(pt4,pt1);
    }
  }
  


  export async function Mx_DrawRectTag() {
    registMouseEvent();

    // 点取第一点.
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定第一点:");
    getPoint.go((status) => {
        if (status != 0) {
            return;
        }
        const pt = getPoint.value();
        let iSize = 50;
        let svgSize = MxFun.screenCoordLong2Doc(iSize);
        let pty = pt.y;
        for (let index = 0; index < 10; index++) {
            pt.x += svgSize * 1.2;
            pt.y = pty;
            for (let index2 = 0; index2 < 3; index2++) {
                pt.y += svgSize * 2;
                let svg = new MyRectSvg();
                svg.setSvgPostion(pt);
                svg.svgMargin.x = 0.0;
                svg.svgMargin.y = 0.0;
                svg.setSvgAlignmentRatio(new THREE.Vector2(0.5, 0.5));
                svg.setRenderOrder(MxType.MxDefaultRenderOrder.kMxEntityRenderOrder + 1);
                svg.setSvgSize(new THREE.Vector2(svgSize, 0));

                 let lTextH = MxFun.screenCoordLong2Doc(30);
                let svgTxt2: MxDbSVGText = new MxDbSVGText();
                svgTxt2.txt = "B" + iDrawTagCount;
                svgTxt2.txtPos = new THREE.Vector3(pt.x, pt.y + svgSize * 0.5 + lTextH * 0.4, 0);
                svgTxt2.txtHeight = lTextH;
                svg.addText(svgTxt2);
                svg.color = 0xff0000;
                MxFun.getCurrentDraw().addMxEntity(svg);
            }
        }
    });
}