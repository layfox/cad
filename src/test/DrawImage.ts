///////////////////////////////////////////////////////////////////////////////
//版权所有（C）2002-2022，成都梦想凯德科技有限公司。
//本软件代码及其文档和相关资料归成都梦想凯德科技有限公司
//应用包含本软件的程序必须包括以下声明
//在版权声明中：
//此应用程序与成都梦想凯德科技有限公司成协议。
//通过使用本软件、其文档或相关材料
///////////////////////////////////////////////////////////////////////////////
import * as THREE from "three";
import { McGiWorldDraw, MrxDbgUiPrPoint, MxDbEntity, MxDbImage, MxFun, MxThreeJS, MxType } from "mxdraw";
// @ts-ignore
import { GIFTexture } from "three-gif-texture";

let objFixImage: any;
let objImageEntity: any;

// 绘制一个图片对象。
export function Mx_DrawImage() {
    // 定义一个取点对象，让用户在图上取点.
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定插入点:");

    // 300,200,是图片的宽高，单位是屏幕像素.
    let w = MxFun.screenCoordLong2Doc(300);
    let h = MxFun.screenCoordLong2Doc(200);
    let mxobj = MxFun.getCurrentDraw();
    getPoint.go((status) => {
        if (status != 0) {
            return;
        }
        // 得到用户点取的坐标。
        const pos = getPoint.value();
        let tmpPoint = MxFun.screenCoord2Doc(10, 10);
        pos.z = tmpPoint.z;

        // 绘制图片对象.
        let image = new MxDbImage();
        image.setRenderOrder(MxType.MxDefaultRenderOrder.kCADMeshRenderOrder -1);
        image.setPoint1(pos);
        let pt2 = new THREE.Vector3(pos.x + w, pos.y + h, pos.z);
        image.setPoint2(pt2);
        image.setImagePath("./models/img/mxcad.jpg");

        let id = mxobj.addMxEntity(image);
        objImageEntity = image;
        image.addEvent("onStartGripEidt",()=>{
            image.visible = false;
            image.setNeedUpdateDisplay();
            return {renderOrder:MxType.MxDefaultRenderOrder.kCADMeshRenderOrder -1};
        });

        image.addEvent("onEndGripEidt",()=>{
            image.visible = true;
            image.setNeedUpdateDisplay();
        });
        image.addEvent("hover", ()=> {
            console.log(22123)
        })
        
        /*
        {

            let ent:any = mxobj.getMxEntity(id);
            let w = Math.abs(ent.getPoint1().x - ent.getPoint2().x)
            let h = Math.abs(ent.getPoint1().y - ent.getPoint2().y) 

            ent.setPoint1(pos);
            ent.setPoint2(new THREE.Vector3(pos.x + w,pos.y + h,pos.z));
            ent.setNeedUpdateDisplay();
        }*/
    });
}

// 绘制一个固定屏幕位置的图片.
export function Mx_DrawFixImage() {
    let mxobj = MxFun.getCurrentDraw();
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n点取插入位置:");
    getPoint.go((status) => {
        if (status != 0) {
            return;
        }
        let pt = getPoint.value();

        let ptView = MxFun.docCoord2Screen(pt.x, pt.y);
        let vy = ptView.y;
        ptView.y = mxobj.getViewHeight() - ptView.y;
        //加载图片
        MxThreeJS.createImage(ptView, 300, 200, "./models/img/mxcad.jpg", (obj) => {
            if (obj) {
                // 图片的旋转角度.
                let lAng = (45 * 3.14159265) / 180.0;
                let matRot = new THREE.Matrix4();
                matRot.makeRotationZ(lAng);

                // 从右到左变换。
                let mat = new THREE.Matrix4().makeTranslation(ptView.x, ptView.y, ptView.z).multiply(matRot).multiply(new THREE.Matrix4().makeTranslation(-ptView.x, -ptView.y, -ptView.z));
                obj.applyMatrix4(mat);

                mxobj.addViewObject(obj);
                mxobj.updateDisplay();
                objFixImage = obj;
                objFixImage["ptx"] = ptView.x;
                objFixImage["pty"] = vy;
                objFixImage["w"] = 300;
                objFixImage["h"] = 200;
                objFixImage["ang"] = lAng;
            }
        });
    });
}

// 把固定屏幕位置的图片转成自定义实体的图片对象.
export function Mx_FixImageToNoFix() {
    if (!objFixImage) return;
    let mxobj = MxFun.getCurrentDraw();

    let image = new MxDbImage();
    image.setRenderOrder(1);
    let pt1 = MxFun.screenCoord2Doc(objFixImage["ptx"] - objFixImage["w"] * 0.5, objFixImage["pty"] + objFixImage["h"] * 0.5);
    image.setPoint1(pt1);
    let pt2 = new THREE.Vector3(objFixImage["ptx"] + objFixImage["w"] * 0.5, objFixImage["pty"] - objFixImage["h"] * 0.5);
    pt2 = MxFun.screenCoord2Doc(pt2.x, pt2.y);
    image.setPoint2(pt2);
    image.setImagePath("./models/img/mxcad.jpg");
    let lAng = objFixImage["ang"];
    image.setAngle(lAng);

    mxobj.addMxEntity(image);

    mxobj.removeViewObject(objFixImage);
    objFixImage = undefined;
    objImageEntity = image;
}

// 把自定义实体的图片对象转成固定屏幕位置的图片
export function Mx_NoFixImageToFix() {
    if (!objImageEntity) return;
    let mxobj = MxFun.getCurrentDraw();
    let image: MxDbImage = objImageEntity;
    let pt1 = image.getPoint1();
    let pt2 = image.getPoint2();
    let lAng = image.getAngle();

    pt1 = MxFun.docCoord2Screen(pt1);
    pt2 = MxFun.docCoord2Screen(pt2);

    let w = pt2.x - pt1.x;
    let h = pt2.y - pt1.y;
    let cenPoint = new THREE.Vector3(pt1.x + w * 0.5, pt1.y + h * 0.5);
    if (w < 0) w = -w;
    if (h < 0) h = -h;

    let ptView = cenPoint;
    let vy = ptView.y;

    ptView.y = mxobj.getViewHeight() - ptView.y;
    MxThreeJS.createImage(ptView, w, h, "./models/img/mxcad.jpg", (obj) => {
        if (obj) {

            let matRot = new THREE.Matrix4();
            matRot.makeRotationZ(lAng);

            // 从右到左变换。
            let mat = new THREE.Matrix4().makeTranslation(ptView.x, ptView.y, ptView.z).multiply(matRot).multiply(new THREE.Matrix4().makeTranslation(-ptView.x, -ptView.y, -ptView.z));
            obj.applyMatrix4(mat);

            mxobj.addViewObject(obj);
            mxobj.updateDisplay();
            objFixImage = obj;
            objFixImage["ptx"] = ptView.x;
            objFixImage["pty"] = vy;
            objFixImage["w"] = w;
            objFixImage["h"] = h;
            objFixImage["ang"] = lAng;
            image.erase();
            objImageEntity = undefined;
        }
    });
}

// 绘制一个图片对象。
export function Mx_DrawGIFImage() {
    // 定义一个取点对象，让用户在图上取点.
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定插入点:");

    // 300,200,是图片的宽高，单位是屏幕像素.
    let w = MxFun.screenCoordLong2Doc(300);
    let h = MxFun.screenCoordLong2Doc(200);
    let mxobj = MxFun.getCurrentDraw();
    getPoint.go((status) => {
        if (status != 0) {
            return;
        }
        // 得到用户点取的坐标。
        const pos = getPoint.value();
        let tmpPoint = MxFun.screenCoord2Doc(10, 10);
        pos.z = tmpPoint.z;

        // 绘制图片对象.
        let image = new MxDbImage();
        image.setRenderOrder(MxType.MxDefaultRenderOrder.kCADMeshRenderOrder -1);
        image.setPoint1(pos);
        let pt2 = new THREE.Vector3(pos.x + w, pos.y + h, pos.z);
        image.setPoint2(pt2);
        mxobj.renderLoop(true);
        // image.setImagePath("./models/img/mxcad.jpg");
        new GIFTexture("https://img.zcool.cn/community/014ec35add6220a80120927bb3b5c6.gif", "autoDraw", (map: any) => {
            const m = new THREE.MeshLambertMaterial({ map })
            image.setMaterial(m)
            let id = mxobj.addMxEntity(image);
            objImageEntity = image;
            image.addEvent("onStartGripEidt",()=>{
                image.visible = false;
                image.setNeedUpdateDisplay();
                return {renderOrder:MxType.MxDefaultRenderOrder.kCADMeshRenderOrder -1};
            });
    
            image.addEvent("onEndGripEidt",()=>{
                image.visible = true;
                image.setNeedUpdateDisplay();
            });
            image.addEvent("hover", ()=> {
                console.log(22123)
            })
        })
       
        /*
        {

            let ent:any = mxobj.getMxEntity(id);
            let w = Math.abs(ent.getPoint1().x - ent.getPoint2().x)
            let h = Math.abs(ent.getPoint1().y - ent.getPoint2().y) 

            ent.setPoint1(pos);
            ent.setPoint2(new THREE.Vector3(pos.x + w,pos.y + h,pos.z));
            ent.setNeedUpdateDisplay();
        }*/
    });
}


let sSaveData = "";
export function Mx_SaveAllMxEntity(param:any) {
    let mxobj = MxFun.getCurrentDraw();
    sSaveData = mxobj.saveMxEntityToJson();
    console.log(sSaveData);

    if (objFixImage) {
        let fixImage: any = {};

        fixImage.ptx = objFixImage["ptx"];
        fixImage.pty = objFixImage["pty"];
        fixImage.w = objFixImage["w"];
        fixImage.h = objFixImage["h"];
        fixImage.path = "./models/img/mxcad.jpg";

        let saveObj = JSON.parse(sSaveData);
        saveObj.fixImage = fixImage;
        sSaveData = JSON.stringify(saveObj);
    }

    MxFun.postMessageToParentFrame(sSaveData);
}

export function Mx_LoadAllMxEntity(param:any) {
   
    console.log(param);
    if (sSaveData.length == 0) return;
    let mxobj = MxFun.getCurrentDraw();
    if (objFixImage) {
        mxobj.removeViewObject(objFixImage);
        objFixImage = null;
    }

    mxobj.loadMxEntityFromJson(sSaveData, ["models/svg/mark.svg"]);

    let saveObj = JSON.parse(sSaveData);
    let fixImage = saveObj["fixImage"];
    if (fixImage) {
        let y = mxobj.getViewHeight() - fixImage.pty;

        MxThreeJS.createImage(new THREE.Vector3(fixImage.ptx, y, 0), fixImage.w, fixImage.h, "./models/img/mxcad.jpg", (obj) => {
            if (obj) {
                mxobj.addViewObject(obj);
                mxobj.updateDisplay();
                objFixImage = obj;
                objFixImage["ptx"] = fixImage.ptx;
                objFixImage["pty"] = fixImage.pty;
                objFixImage["w"] = fixImage.w;
                objFixImage["h"] = fixImage.h;
            }
        });
    }
    mxobj.updateDisplay();
}
