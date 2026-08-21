import {
  McEdGetPointWorldDrawObject,
  MrxDbgUiPrBaseReturn,
  MrxDbgUiPrPoint,
  MxDbSVG,
  MxDbSVGText,
  MxFun,
  MxThreeJS,
} from "mxdraw";
import * as THREE from "three";

let aryTwinkleMeterials: Array<any> = []; //存放闪烁动画材质的数组

let aryAnimation:MxDbSVG[] = [];

let lAnimationTime = 0;

const SampleDrawCommand = {
  //绘制svg，可随底图移动不随底图缩放
  async BR_ModelFixed() {
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定一点:");
    let pt: THREE.Vector3 | null = await getPoint.go();
    if (!pt) {
      return;
    }
    let svg = new MxDbSVG();
    svg.setSvgPath(`models/svg/target.svg`);
    svg.setSvgPostion(pt);

    // 先把图标旋转，然后在旋转后显示效果的基础，再调整它插入基点。
    //svg.svgRotate = 3.14159265;

    svg.svgReverse = true;
    svg.svgMargin.x = 0.2;

    // 默认插入基点，在图片的左下角，通过来设置新的插入基点。
    svg.setSvgAlignmentRatio(new THREE.Vector2(0.5, -1));

    
    svg.setRenderOrder(100);
    let iSize = 50;
    svg.setSvgSize(new THREE.Vector2(iSize, 0));
    svg.fixedSize = true;
    let svgTxt1: MxDbSVGText = new MxDbSVGText();
    svgTxt1.txt = "A1";
    let lTextH = 30;

    //  如果是固定屏幕大小，txtPos的值是相对SvgPostion位置，然后偏移的屏幕像素.
    svgTxt1.txtPos = new THREE.Vector3(0, -lTextH, 0);
    svgTxt1.txtHeight = lTextH;
    svg.addText(svgTxt1);
    
    svg.color = 0x00FF11;
    MxFun.addToCurrentSpace(svg);
    
  },

  async BR_Animation2(){
    aryAnimation = [];
    if(lAnimationTime){
      clearInterval(lAnimationTime);
      lAnimationTime = 0;
    }

    let arySvg = [];
    let svg1 = await MxThreeJS.loadSVG(`models/svg/1_1.svg`);
    arySvg.push(svg1);
    let svg2 = await MxThreeJS.loadSVG(`models/svg/1_2.svg`);
    arySvg.push(svg2);
    let svg3 = await MxThreeJS.loadSVG(`models/svg/1_3.svg`);
    arySvg.push(svg3);

    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定手入点:");
    let pt:THREE.Vector3|null = await getPoint.go();
    if(pt == null){
      return;
    }

    let svg = new MxDbSVG();

    svg.setSvgPath(`models/svg/1_1.svg`);
    let iSize = 30;
    svg.setSvgSize(new THREE.Vector2(iSize, 0 ));
    svg.fixedSize = true;
    svg.useSvgColor = true;
    svg.setSvgPostion(pt);
    svg.setRenderOrder(100);
    svg.userData = {index:1,arySvg:arySvg};
    MxFun.addToCurrentSpace(svg);
    aryAnimation.push(svg);
    lAnimationTime = setInterval(startAnimation2, 500)
  },

  async BR_Animation(){
    aryAnimation = [];
    if(lAnimationTime){
      clearInterval(lAnimationTime);
      lAnimationTime = 0;
    }

    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定手入点:");
    let pt:THREE.Vector3|null = await getPoint.go();
    if(pt == null){
      return;
    }

    let svg = new MxDbSVG();
  
    //svg.setSvgPath(`models/svg/animation.svg`);
    svg.setSvgPath(`models/svg/twinkle.svg`);
    let iSize = 20;
    svg.setSvgSize(new THREE.Vector2(iSize, 0 ));
    svg.fixedSize = true;
    svg.useSvgColor = true;
    svg.setSvgAlignmentRatio(new THREE.Vector2(0.5,-1));
    svg.svgReverse = true;
    svg.svgMargin.x = 0.63;
    svg.svgMargin.y = -0.22;

    svg.setSvgPostion(pt);

    
    svg.setRenderOrder(100);
    MxFun.addToCurrentSpace(svg);

    aryAnimation.push(svg);
    lAnimationTime = setInterval(startAnimation, 100)

  },

  //svg动画效果
  BR_Twinkle() {
    let mxobj = MxFun.getCurrentDraw();

    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n点取插入位置:");
    getPoint.go((status) => {
      if (status != 0) {
        return;
      }
      let pt = getPoint.value();
      let dScale = MxFun.screenCoordLong2Doc(100);
      let color = new THREE.Color(0xff4e95); //修改加载svg模型的颜色，undefined则默认svg本身颜色

      MxThreeJS.loadSVG(
        `models/svg/twinkle.svg`,
        color,
        (obj: any, meterials: Array<THREE.MeshBasicMaterial>): any => {
          if (obj) {
            obj.scale.multiplyScalar(dScale / 1000);
            obj.position.x = pt.x;
            obj.position.y = pt.y;
            obj.scale.y *= -1;
            obj.renderOrder = 12000;
            aryTwinkleMeterials.push(meterials); //将每次绘制的对象材质push进数组以保证创建多个闪烁动画都是独立的
            setInterval(startTwinkle, 500); //启动一个时钟，随机修改模型材质的颜色
            mxobj.addObject(obj, true);
            mxobj.updateDisplay();
          }
        }
      );
    });
  },



  //两点之间动画移动效果
  BR_MoveEff() {
    let mxobj = MxFun.getCurrentDraw();
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定第一点:");
    getPoint.go((status) => {
      if (status != 0) {
        return;
      }

      const pt1 = getPoint.value();
      const drawPoint: THREE.Vector3 = new THREE.Vector3();
      drawPoint.x = pt1.x;
      drawPoint.y = pt1.y;

      const worldDrawComment = new McEdGetPointWorldDrawObject();
      worldDrawComment.setDraw((currentPoint: THREE.Vector3, pWorldDraw) => {
        pWorldDraw.drawLine(currentPoint, drawPoint);
      });

      getPoint.setUserDraw(worldDrawComment);
      getPoint.setMessage("\n指定下一点:");
      getPoint.go((status) => {
        if (status == MrxDbgUiPrBaseReturn.kOk) {
          
          const pt2 = getPoint.value();
          let scene: THREE.Scene = MxFun.getCurrentDraw().getScene();
          //CatmullRomCurve3 三维的样条曲线函数
          var curve = new THREE.CatmullRomCurve3([pt1, pt2]);
          var points = curve.getPoints(100);
          var geometry = new THREE.Geometry();
          geometry.vertices = points;
          var material = new THREE.LineBasicMaterial({
            color: 0xffff00,
          });
          var line = new THREE.Line(geometry, material);
          scene.add(line); //画线

          // svg图片大小.
          let dSVGSize = MxFun.screenCoordLong2Doc(100);
          let color = new THREE.Color(0xffffff); //修改加载svg模型的颜色，undefined则默认svg本身颜色
          MxThreeJS.loadSVG(
            `models/svg/mark2.svg`,
            color,
            (obj: any, meterials: Array<THREE.MeshBasicMaterial>): any => {
              if (obj) {
                // 2000,是svg原始图形尺寸。
                obj.scale.multiplyScalar(dSVGSize / 2000);
                obj.position.x = pt1.x;
                obj.position.y = pt1.y;

                let svgObj: THREE.Object3D = obj;
                let box = new THREE.Box3().setFromObject(obj);
                let lSvgW = box.max.x - box.min.x;
                let lSvgH = box.max.y - box.min.y;

                svgObj.position.x -= lSvgW * 0.5; //计算图标显示的偏移量让模型中心点显示在指定坐标点，实现动画的直线坐标点数组同步此偏移量
                svgObj.position.y -= lSvgH * 0.57;

                
                obj.renderOrder = 12000;
                mxobj.addObject(obj, true);

                let arr = [];
                for (let i = 0; i < 101; i++) {
                  arr.push(i);
                }
                // 生成一个时间序列
                var times: any = new Float32Array(arr);

                var posArr: any = [];
                points.forEach((elem) => {
                  //此处x ,y坐标系同步加上图标的偏移量
                  posArr.push(
                    elem.x - lSvgW * 0.5,
                    elem.y - lSvgH * 0.57,
                    elem.z
                  );
                });

                // 创建一个和时间序列相对应的位置坐标系列
                var values: any = new Float32Array(posArr);
                // 创建一个帧动画的关键帧数据，曲线上的位置序列对应一个时间序列
                var posTrack = new THREE.KeyframeTrack(
                  ".position",
                  times,
                  values
                );

                let duration = 101;
                let clip = new THREE.AnimationClip("default", duration, [
                  posTrack,
                ]);
                var mixer = new THREE.AnimationMixer(obj);
                let AnimationAction = mixer.clipAction(clip);
                AnimationAction.timeScale = 20;
                AnimationAction.play();
                var clock = new THREE.Clock(); //声明一个时钟对象
                setInterval(() => {
                  mixer.update(clock.getDelta()); // clock.getDelta() 获得前后两次执行该方法的时间间隔
                  mxobj.updateDisplay();
                }, 100);
              }
            }
          );
        } else {
          console.log("放弃当前操作");
        }
      });
    });
  },

  init() {
    MxFun.addCommand("BR_ModelFixed", this.BR_ModelFixed);
    MxFun.addCommand("BR_Twinkle", this.BR_Twinkle);
    MxFun.addCommand("BR_MoveEff", this.BR_MoveEff);
    MxFun.addCommand("BR_Animation", this.BR_Animation);
    MxFun.addCommand("BR_Animation2", this.BR_Animation2);
    
  },
};

let lScale = 1.0;

function startAnimation():any{
  lScale *= 1.05;
  if(lScale > 4) lScale = 1.0;

  aryAnimation.forEach(function (svg: MxDbSVG) {
    
    let iSize = 20;
    svg.setSvgSize(new THREE.Vector2(iSize * lScale, 0 ));
    
    svg.reComputeSVG();
    svg.setNeedUpdateDisplay(false);
  });
  MxFun.updateDisplay();
}

function startAnimation2():any{
  
  aryAnimation.forEach(function (svg: MxDbSVG) {
    
    svg.userData.index++;
    if(svg.userData.index > 3) svg.userData.index = 1;

    svg.setSvg(svg.userData.arySvg[svg.userData.index - 1]);
    svg.reComputeSVG();
    svg.setNeedUpdateDisplay(false);
  });
  MxFun.updateDisplay();
}


function startTwinkle(): any {
  //随机取一个颜色rgb值
  var arrHex = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ],
    strHex = "#",
    index;
  for (var i = 0; i < 6; i++) {
    index = Math.round(Math.random() * 15);
    strHex += arrHex[index];
  }

  aryTwinkleMeterials.forEach(function (e: any) {
    if (e) {
      e.forEach(function (value: THREE.MeshBasicMaterial) {
        value.color.set(strHex);
      });

      MxFun.getCurrentDraw().updateDisplay();
    }
  });
}

export function init() {
  SampleDrawCommand.init();
}
