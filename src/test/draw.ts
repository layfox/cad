
import { MrxDbgUiPrPoint, MxFun, MxDbText, MxThreeJS, MxDbLine, MxType, McGiWorldDraw } from "mxdraw";

import { BR_Line, BR_Lines } from "./Objects/Line";

import BR_AngleSurveying from "./Objects/BR_AngleSurveying";
import BR_Arc from "./Objects/BR_Arc";
import BR_AnyLine from "./Objects/BR_AnyLine";
import BR_CloudLine from "./Objects/BR_CloudLine";
import BR_CheckDraw from "./Objects/BR_CheckDraw";
import BR_Ellipse from "./Objects/BR_Ellipse";
import BR_ThreeRegularPolygon from "./Objects/BR_ThreeRegularPolygon";
import BR_Circle from "./Objects/BR_Circle";

import { Mx_DrawTag, Mx_DeleteTag, Mx_DeleteTag_A2, BR_DisabledPan, BR_CreateGroup, BR_DeleteGroup, BR_SaveViewport, BR_RestoreViewport, BR_WriteImage, BR_DisabledZoom, Mx_DrawImageTag, Mx_DrawRectTag, Mx_DeleteEntity } from "./demo2";
import { Mx_DrawImage, Mx_DrawFixImage, Mx_FixImageToNoFix, Mx_NoFixImageToFix, Mx_SaveAllMxEntity, Mx_LoadAllMxEntity, Mx_DrawGIFImage } from "./DrawImage";

import { Mx_DrawRect, Mx_MyDrawRect } from "./DrawRect";
import BR_SplineCurve from "./Objects/BR_SplineCurve";

import BR_LeadTag from "./tagPoint/BR_LeadTag";

import { Mx_SaveDwg } from "./SaveDwg";

import { magnifyLensTest } from "./View/MagnifyLens/test";
import { Mx_RoatateImage } from "./TestRotate";
import { createAnyLine, createAnyLine1 } from "./compoents/ThreeAnyLine";


export class MyText extends MxDbText {

  public isDrawUnderline:boolean = true;
  public create(): MyText {
    return new MyText();
  }

  public getTypeName(): string {
    return "MyText";
  }

  public worldDraw(pWorldDraw: McGiWorldDraw): void {
    super.worldDraw(pWorldDraw);
    // 绘制文字下划线。
    if(this.isDrawUnderline){
      const box = new THREE.Box3()
      let bakParent = this.spriteText.parent;
      this.spriteText.parent = null;
      box.expandByObject(this.spriteText)
      this.spriteText.parent = bakParent;
      let linept1 = new THREE.Vector3(box.min.x, box.min.y - this.height * 0.1, 0)
      let linept2 = new THREE.Vector3(box.max.x, box.min.y - this.height * 0.1, 0)
      var lineGeometry = new THREE.Geometry()
      let lineMaterial = new THREE.LineBasicMaterial({
        color: pWorldDraw.getColor(),
        transparent: true,
        depthTest: false
      })
      lineGeometry.vertices.push(linept1, linept2)
      var mLine = new THREE.Line(lineGeometry, lineMaterial)
      pWorldDraw.drawEntity(mLine)
    }
    
  }
}


let iTest = 0;
let isHide = true;
const SampleDrawCommand = {
    async BR_Text() {
        const getPoint = new MrxDbgUiPrPoint();
        getPoint.setMessage("\n 点取文字插入点:");
        let ptVal: THREE.Vector3 | null = await getPoint.go();
        if (ptVal == null) {
            return;
        }

        let text = new MyText();
        text.position = ptVal;
        text.height = MxFun.screenCoordLong2Doc(50);
        text.text = "测试绘制";
        text.color = 0xffffff;
        text.opacity = 0.8;
        let id = MxFun.addToCurrentSpace(text);


        //let box = text.getGeomExtents();
        //if (box) {
        //    console.log("xxxx:" + (box.max.x - box.min.x));
        //}

        //let ent: any = MxFun.getCurrentDraw().getMxEntity(id);
        // ent.position = new THREE.Vector3(100, 100, 0);
        // ent.setNeedUpdateDisplay();
    },

    TestDrawImage() {
        let mxObj = MxFun.getCurrentDraw();
        let viewH = mxObj.getViewHeight();
        let viewW = mxObj.getViewWidth();
        let ptView = new THREE.Vector3(viewW * 0.5, viewH * 0.5, 0);

        //加载图片
        MxThreeJS.createImage(ptView, 300, 200, "./models/img/mxcad.jpg", (obj) => {
            if (obj) {
                mxObj.addViewObject(obj);
                mxObj.updateDisplay();
            }
        });
    },

    BR_OpenFile() {
        //SampleDrawCommand.TestDrawImage();

        MxFun.getCurrentDraw().addEvent("loadComplete", () => {
            SampleDrawCommand.TestDrawImage();
        });

        MxFun.openFile("/demo/buf/test2.dwg?token=123456");
        //MxFun.openFile("/demo/buf/test2.dwg");
    },

    BR_AddLayer() {
        let database = MxFun.getCurrentDatabase();

        database.addLayer("MyLayerName");
        database.setCurrentLayer("MyLayerName");
        alert('添加图层"MyLayerName"成功');
    },

    BR_HideLayer() {
        let database = MxFun.getCurrentDatabase();

        database.getLayer("MyLayerName").setVisible(!isHide);
        isHide = !isHide;
        MxFun.updateDisplay();
    },

    async BR_Test() {

  

        //MxFun.docCoord2Cad
        //  MxFun.sendStringToExecute("BR_DimensionMeasurement");
        //  MxDbLine.Test();
        //MxFun.getCurrentDraw().enableViewControls(false);
        /*
      let aryId = MxFun.getCurrentDraw().getMxCurrentSelect();
      if (aryId.length == 0) {
      return;
      }
  
    let ent: MxDbEntity =  MxFun.getCurrentDraw().getMxEntity(aryId[0]);
    ent.visible = false;
    ent.setNeedUpdateDisplay();
    */

    const getPoint = new MrxDbgUiPrPoint();
      getPoint.setMessage("\n指定第一点:");
      let pt1:THREE.Vector3|null = await getPoint.go();
     
      let _pt2:THREE.Vector3|null = await getPoint.go();
      let _pt3:THREE.Vector3|null = await getPoint.go();
      let _pt4:THREE.Vector3|null = await getPoint.go();
      if(pt1 === null || _pt2 == null || _pt3 === null || _pt4 === null){
        return;
      }
     const obj = createAnyLine([pt1, _pt2, _pt3, _pt4])
      MxFun.getCurrentDraw().addObject(obj)
 
      let cadpt = MxFun.docCoord2Cad(pt1.x,pt1.y,pt1.z);
      console.log("xxx:" + cadpt);


      getPoint.setUserDraw((curPoint,pDraw)=>{
        pDraw.setColor(0x00FF00);
        pDraw.drawLine(pt1 as THREE.Vector3,curPoint);
      });
  
      getPoint.setMessage("\n指定第二点:");
      getPoint.setInputToucheType(MxType.InputToucheType.kGetEnd)
      let pt2:THREE.Vector3|null = await getPoint.go();
      if(pt1 == null || pt2 == null){
        return;
      }
      
      let line  = new MxDbLine() 
      line.pt1 = pt1;
      line.pt2 = pt2;
  
      let database = MxFun.getCurrentDatabase();
  
      database.addLayer("aa");
      database.setCurrentLayer("aa");
  
      database.addEntity(line);
      line.setLayer("0")
      line.setNeedUpdateDisplay()
      console.log(database.getLayer("0"))
      console.log(database)
      
      

        /*
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n点取插入点:");
    let ptVal: THREE.Vector3 | null = await getPoint.go();
    if (ptVal == null) {
      return;
    }

    let pt: THREE.Vector3 = ptVal;

    let svg = new MxDbSVG();

    svg.setSvgPath(`models/svg/62.svg`);
    svg.setSvgPostion(pt);

    
    svg.setRenderOrder(100);
    let iSize = 5000;
    svg.setSvgSize(new THREE.Vector2(iSize, 0 ));
    
    svg.useSvgColor = true;
    svg.setSvgAlignmentRatio(new THREE.Vector2(0.5,0));
    //svg.svgReverse = true;
    //svg.svgMargin.x = 0.2;
    
    svg.color = 0xffffff;
    let svgTxt: MxDbSVGText = new MxDbSVGText();
    svgTxt.txt = "70°";
    let lTextH = 1500;
    svgTxt.txtPos = new THREE.Vector3(
      pt.x + iSize * 0.2,
      pt.y + iSize * 0.5 ,
      0
    );
    svgTxt.txtHeight = lTextH;
    

    svg.addText(svgTxt);
    MxFun.addToCurrentSpace(svg);
    */
        /*
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n点取插入点:");
    let ptVal: THREE.Vector3 | null = await getPoint.go();
    if (ptVal == null) {
      return;
    }

    let pt: THREE.Vector3 = ptVal;

    let svg = new MxDbSVG();
  
    svg.setSvgPath(`models/svg/test.svg`);
    //svg.setSvgPath(`models/svg/people.svg`);
    svg.setSvgPostion(pt);

    
    svg.setRenderOrder(100);
    let iSize = 50;
    svg.setSvgSize(new THREE.Vector2(iSize, 0 ));
    svg.fixedSize = true;
    svg.useSvgColor = true;
    svg.setSvgAlignmentRatio(new THREE.Vector2(0.5,-1));
    svg.svgReverse = true;
    svg.svgMargin.x = 0.2;
    //svg.color = 0xff0000;
    MxFun.addToCurrentSpace(svg);
    */
        /*
    if(iTest == 0)
    {
      const getPoint = new MrxDbgUiPrPoint();
      getPoint.setMessage("\n指定第一点:");
      let pt1:THREE.Vector3|null = await getPoint.go();
      if(pt1 == null){
        return;
      }
      getPoint.setUserDraw((curPoint,pDraw)=>{
        pDraw.setColor(0x00FF00);
        pDraw.drawLine(pt1 as THREE.Vector3,curPoint);
      });
  
      getPoint.setMessage("\n指定第二点:");
      let pt2:THREE.Vector3|null = await getPoint.go();
      if(pt2 == null){
        return;
      }
      
      let line  = new MxDbLine() 
      line.pt1 = pt1;
      line.pt2 = pt2;
  
      let database = MxFun.getCurrentDatabase();
  
      database.addLayer("aa");
      database.setCurrentLayer("aa");
  
      database.addEntity(line);
      iTest = 1;
    }
    else{
      let database = MxFun.getCurrentDatabase();
      database.getLayer("aa").setVisible(false);
      MxFun.updateDisplay();

    }*/
        /*
    let aryPoint: Array<THREE.Vector3> = [];
    aryPoint.push(new THREE.Vector3(0, 0, 0));
    aryPoint.push(new THREE.Vector3(0, 100, 0));
    aryPoint.push(new THREE.Vector3(100, 100, 0));
    aryPoint.push(new THREE.Vector3(100, 0, 0));
    let pt: THREE.Vector3 = new THREE.Vector3(50, 50);
    if (McGeTool.pointInPolyline(pt, aryPoint)) {
      console.log("in");
    }*/
        /*
    let pt = Mxassembly.NewMcGePoint3d();
    let pts = Mxassembly.NewMcGePoint3dArray();
    pt.x = 0;
    pt.y = 0;
    pts.append(pt);

    pt.x = 10;
    pt.y = 0;
    pts.append(pt);

    pt.x = 10;
    pt.y = 10;
    pts.append(pt);

    pt.x = 0;
    pt.y = 10;
    pts.append(pt);

    let area = McGeTool.calcArea(pts);
    console.log(area);
*/
        //MxFun.getCurrentDraw().newFile(0,0,1000,1000);
        //MxFun.getCurrentDraw().updateCanvasSize();
        /*
  const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n点取插入点:");
  let pt:THREE.Vector3|null = await getPoint.go();
  if(!pt){
    return;
  }

  let rect:MxDbRect  = new MxDbRect;
  rect.pt1 = pt;
  let dW = MxFun.screenCoordLong2Doc(100);
  let dH = MxFun.screenCoordLong2Doc(100);
  rect.pt2 = new THREE.Vector3(pt.x + dW,pt.y + dH,0);
  //rect.fillColor = new THREE.Color("#666600");
  //rect.opacity = 0.8;
  rect.renderOrder = 5;
  rect.setRadius(10);
  rect.setFillImagePath("./models/img/mxcad.jpg");
  //rect.setFilter(new MxFilters().channel({r:33,g:0,b:0}));
  MxFun.getCurrentDraw().addMxEntity(rect);
*/
        //let cen = MxFun.getCurrentDraw().getViewCenterDocCoord();
        /*
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n点取插入点:");
    let ptVal: THREE.Vector3 | null = await getPoint.go();
    if (ptVal == null) {
      return;
    }

    let pt: THREE.Vector3 = ptVal;
    let iDrawTagCount = 0;

    await MxThreeJS.loadSVG(`models/svg/mark.svg`);

    let Dist = MxFun.screenCoordLong2Doc(100);
    for (let i = 0; i < 50; i++) {
      let svg = new MxDbSVG();
      svg.setSvgPath(`models/svg/mark.svg`);
      svg.setSvgPostion(pt);

      svg.setSvgAlignmentRatio(new THREE.Vector2(0.57, 0.57));
      svg.setRenderOrder(100);
      let iSize = 50;
      let svgSize = MxFun.screenCoordLong2Doc(iSize);

      svg.setSvgSize(new THREE.Vector2(svgSize, svgSize));
      iDrawTagCount++;

      let svgTxt1: MxDbSVGText = new MxDbSVGText();
      svgTxt1.txt = "A" + iDrawTagCount;
      let lTextH = MxFun.screenCoordLong2Doc(30);
      svgTxt1.txtPos = new THREE.Vector3(
        pt.x,
        pt.y - svgSize * 0.5 - lTextH,
        0
      );
      svgTxt1.txtHeight = lTextH;
      svg.addText(svgTxt1);

      let svgTxt2: MxDbSVGText = new MxDbSVGText();
      svgTxt2.txt = "B" + iDrawTagCount;
      svgTxt2.txtPos = new THREE.Vector3(
        pt.x,
        pt.y + svgSize * 0.5 + lTextH * 0.4,
        0
      );
      svgTxt2.txtHeight = lTextH;
      svg.addText(svgTxt2);

      svg.color = 0xff0000;
      MxFun.getCurrentDraw().addMxEntity(svg);
      pt.x = pt.x + Dist;
    }
    */
        /*
  const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定第一点:");
  let pt:THREE.Vector3|null = await getPoint.go();
  if(pt != null){
    let image = new MxDbImage();
    image.setRenderOrder(100);
    image.setPoint1(pt);
    let size = MxFun.screenCoordLong2Doc(50);
    let pt2 = new THREE.Vector3(pt.x+ size, pt.y + size, pt.z);

    image.setPoint2(pt2);
    image.setImagePath("./image/03-01.png");
    const mxobj = MxFun.getCurrentDraw()
    mxobj.addMxEntity(image);
  }
  */
        /*
  getPoint.go().then((pt:THREE.Vector3)=>{

  });
*/
        /*

	

    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定第一点:");
    getPoint.go((status) => {
        if (status != 0) {
            return;
        }
        const pt1 = getPoint.value();

        
        getPoint.setBasePt(pt1);
        getPoint.setUseBasePt(true);


        getPoint.setMessage("\n指定坐标点:");

        getPoint.go((status) => {
            if (status != 0) {
                console.log(status);
                return;
            }

            const pt2 = getPoint.value();
            //MxFun.zoomW(pt1.x,pt1.y,pt2.x,pt2.y);
      let line = new MxDbLine();
            line.setPoint1(pt1);
            line.setPoint2(getPoint.value());
            MxFun.getCurrentDraw().addMxEntity(line);
    	
        });
    });
*/
        // 重新打开一个新的文件.
        //MxFun.openFile("./demo/buf/$t2.dwg.mxb1.wgh",);
        /*
  const mxobj = MxFun.getCurrentDraw()
	
  let pt = MxFun.screenCoord2Doc(100,100,0);
  let dScale = MxFun.screenCoordLong2Doc(100);
  let dDist = MxFun.screenCoordLong2Doc(10);
    let color = new THREE.Color(0xff4e95);//修改加载svg模型的颜色，undefined则默认svg本身颜色

  MxThreeJS.loadSVG(`models/svg/twinkle.svg`,color,(obj:any,meterials:Array<THREE.MeshBasicMaterial>):any=>{

        if(obj){
          obj.renderOrder = 12000;       
        obj.scale.multiplyScalar(dScale / 500)
                    obj.position.x = pt.x
                    obj.position.y = pt.y
                    obj.scale.y *= -1
        }

    let lX = pt.x;
    for(let i = 0; i < 2000;i++){
      let newObj:THREE.Object3D = obj.clone();
      newObj.position.x = lX;
      mxobj.addObject(newObj,true);
            mxobj.updateDisplay();
      lX += dDist;
    }
      });
    */
        /*
  let aryPoint:Array<THREE.Vector3> = [];
  aryPoint.push(new THREE.Vector3(0,0,0));
  aryPoint.push(new THREE.Vector3(0,100,0));
  aryPoint.push(new THREE.Vector3(100,100,0));
  aryPoint.push(new THREE.Vector3(100,0,0));
	
  let pt:THREE.Vector3 = new THREE.Vector3(150,150);
  if(MxFun.pointInPolyline(pt,aryPoint) ){
    console.log("in");
  }*/
    },

    init() {
        MxFun.addCommand("BR_Line", BR_Line);
        MxFun.addCommand("BR_Lines", BR_Lines);
        MxFun.addCommand("BR_Arc", BR_Arc);
        MxFun.addCommand("BR_AngleSurveying", BR_AngleSurveying);
        MxFun.addCommand("BR_Ellipse", BR_Ellipse);
        MxFun.addCommand("BR_AnyLine", BR_AnyLine);
        MxFun.addCommand("BR_CloudLine", BR_CloudLine);
        MxFun.addCommand("BR_ThreeRegularPolygon", BR_ThreeRegularPolygon);
        MxFun.addCommand("BR_CheckDraw", BR_CheckDraw);
        MxFun.addCommand("BR_Text", this.BR_Text);
        MxFun.addCommand("BR_Test", this.BR_Test);
        MxFun.addCommand("BR_OpenFile", this.BR_OpenFile);

        MxFun.addCommand("BR_Circle", BR_Circle);
        MxFun.addCommand("BR_SplineCurve", BR_SplineCurve);
        MxFun.addCommand("BR_AddLayer", this.BR_AddLayer);
        MxFun.addCommand("BR_HideLayer", this.BR_HideLayer);
    },
};

export function init() {
    MxFun.addCommand("Mx_DrawRect", Mx_DrawRect);
    MxFun.addCommand("Mx_MyDrawRect", Mx_MyDrawRect);
    
    MxFun.addCommand("Mx_DrawTag", Mx_DrawTag);
    MxFun.addCommand("Mx_DrawImageTag", Mx_DrawImageTag);
    MxFun.addCommand("Mx_DrawRectTag", Mx_DrawRectTag);
    MxFun.addCommand("Mx_DrawGIFImage", Mx_DrawGIFImage);

    MxFun.addCommand("Mx_DeleteEntity", Mx_DeleteEntity);
    MxFun.addCommand("Mx_DeleteTag", Mx_DeleteTag);
    MxFun.addCommand("Mx_DeleteTag_A2", Mx_DeleteTag_A2);
    MxFun.addCommand("Mx_DrawImage", Mx_DrawImage);
    MxFun.addCommand("Mx_RoatateImage", Mx_RoatateImage);

    MxFun.addCommand("Mx_DrawFixImage", Mx_DrawFixImage);
    MxFun.addCommand("Mx_FixImageToNoFix", Mx_FixImageToNoFix);
    MxFun.addCommand("Mx_NoFixImageToFix", Mx_NoFixImageToFix);
    MxFun.addCommand("Mx_SaveAllMxEntity", Mx_SaveAllMxEntity);
    MxFun.addCommand("Mx_SaveDwg", Mx_SaveDwg);

    MxFun.addCommand("Mx_LoadAllMxEntity", Mx_LoadAllMxEntity);

    MxFun.addCommand("BR_SaveViewport", BR_SaveViewport);
    MxFun.addCommand("BR_RestoreViewport", BR_RestoreViewport);
    MxFun.addCommand("BR_WriteImage", BR_WriteImage);
    MxFun.addCommand("BR_DisabledZoom", BR_DisabledZoom);
    MxFun.addCommand("BR_DisabledPan", BR_DisabledPan);
    MxFun.addCommand("BR_CreateGroup", BR_CreateGroup);
    MxFun.addCommand("BR_DeleteGroup", BR_DeleteGroup);

    MxFun.addCommand("BR_LeadTag", BR_LeadTag);

    MxFun.addCommand("magnifyLensTest", magnifyLensTest);
    SampleDrawCommand.init();
}
