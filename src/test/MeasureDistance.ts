///////////////////////////////////////////////////////////////////////////////
//版权所有（C）2002-2022，成都梦想凯德科技有限公司。
//本软件代码及其文档和相关资料归成都梦想凯德科技有限公司,应用包含本软件的程序必须包括以下版权声明
//此应用程序与成都梦想凯德科技有限公司成协议。通过使用本软件、其文档或相关材料
///////////////////////////////////////////////////////////////////////////////
import * as THREE from "three";
import {
  McEdGetPointWorldDrawObject,
  McGiWorldDraw,
  MrxDbgUiPrPoint,
  MxDbAlignedDimension,
  MxDbEntity,
  MxFun,
  McGiWorldDrawType,
  MxType, MxThreeJS
} from "mxdraw";

export class MyAlignedDimension extends MxDbAlignedDimension {
  constructor() {
    super()
  }
  public getDimText(): string {
    var v2ndPtTo1stPt = new THREE.Vector3(this.point1.x - this.point2.x, this.point1.y - this.point2.y, 0);
    var fLen = v2ndPtTo1stPt.length()
    return fLen.toFixed(3) + "M"
  }

  public create() {
    return new MyAlignedDimension()
  }

  public getTypeName(): string {
    return this.constructor.name
  }
}

export class MxMeasure {
  // 开始尺寸测量.
  public DoDimensionMeasurement() {
    // 让用户在图上点取第一点.
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定第一点:");
    getPoint.go((status) => {
      if (status != 0) {
        return;
      }
      const pt1 = getPoint.value();

      // 定义一个尺寸对象.
      //let dim = new MxDbAlignedDimension();
      let dim = new MyAlignedDimension();

      dim.setPoint1(pt1);
      dim.setColor(0xff22);

      // 在点取第二点时，设置动态绘制.
      const worldDrawComment = new McEdGetPointWorldDrawObject();
      worldDrawComment.setDraw((currentPoint: THREE.Vector3) => {
        // 动态绘制调用。
        dim.setPoint2(currentPoint);
        worldDrawComment.drawCustomEntity(dim);
      });

      getPoint.setBasePt(pt1);

      getPoint.setUseBasePt(true);
      getPoint.setUserDraw(worldDrawComment);
      getPoint.setMessage("\n指定第二点:");

      getPoint.setInputToucheType(MxType.InputToucheType.kGetEnd);
      getPoint.go((status) => {
        if (status != 0) {
          console.log(status);
          return;
        }

        // 成功取到第二点.
        const pt2 = getPoint.value();

        // 得到尺寸线的第二个点.
        dim.setPoint2(pt2);

        // 绘制自定义实体到图上.
        MxFun.getCurrentDraw().addMxEntity(dim);

        //计算长度.
        var vec = new THREE.Vector3(pt1.x - pt2.x, pt1.y - pt2.y, 0);
        var dLen = vec.length();
        // alert("测试长度是：" + dLen.toFixed(3));

      });
    });
  }

  // 绘制一个固定箭头，和文字大小的尺寸标注
  public DoFixArrowTextSizeDimensionMeasurement() {
    // 让用户在图上点取第一点.
    const getPoint = new MrxDbgUiPrPoint();
    getPoint.setMessage("\n指定第一点:");
    getPoint.go((status) => {
      if (status != 0) {
        return;
      }
      const pt1 = getPoint.value();

      // 定义一个尺寸对象.
      let dim = new MyFixArrowTextSizeAlignedDimension();

      dim.setPoint1(pt1);
      dim.setColor(0xff22);

      // 在点取第二点时，设置动态绘制.
      const worldDrawComment = new McEdGetPointWorldDrawObject();
      worldDrawComment.setDraw((currentPoint: THREE.Vector3) => {
        // 动态绘制调用。
        dim.setPoint2(currentPoint);
        worldDrawComment.drawCustomEntity(dim);
      });

      getPoint.setBasePt(pt1);

      getPoint.setUseBasePt(true);
      getPoint.setUserDraw(worldDrawComment);
      getPoint.setMessage("\n指定第二点:");

      getPoint.setInputToucheType(MxType.InputToucheType.kGetEnd);
      getPoint.go((status) => {
        if (status != 0) {
          console.log(status);
          return;
        }

        // 成功取到第二点.
        const pt2 = getPoint.value();

        // 得到尺寸线的第二个点.
        dim.setPoint2(pt2);

        // 绘制自定义实体到图上.
        MxFun.getCurrentDraw().addMxEntity(dim);

        //计算长度.
        var vec = new THREE.Vector3(pt1.x - pt2.x, pt1.y - pt2.y, 0);
        var dLen = vec.length();
        // alert("测试长度是：" + dLen.toFixed(3));

      });
    });
  }

}

const propertyDbKeys = ['point1', 'point2', 'fontColor', 'sizeArrow', 'sizeText']

export class MyFixArrowTextSizeAlignedDimension extends MxDbEntity {
  constructor(options?: {
    points?: THREE.Vector3[]
    fontColor?: MxType.MxColorType
  }) {
    super()
    if (options) {
      const { points, fontColor } = options
      points && this.setPoints(points)
      fontColor && (this.fontColor = fontColor)
    }
  }
  /* 测量的开始点 */
  public point1: THREE.Vector3 = new THREE.Vector3()

  /* 测量的结束点 */
  public point2: THREE.Vector3 = new THREE.Vector3()

  /* 字体颜色 */
  public fontColor: MxType.UnstableColor

  public sizeArrow: number = 15;

  public sizeText: number = 30;

  /**
   * 设置两个点位置向量
   * @param { THREE.Vector3[] } points [THREE.Vector3, THREE.Vector3]
   */
  setPoints(points: THREE.Vector3[]) {
    const [point1, point2] = points
    point1 && (this.point1 = point1)
    point2 && (this.point2 = point2)
  }
  public getTypeName(): string {
    return 'MyFixArrowTextSizeAlignedDimension'
  }
  //获得标注方向
  private getDirection(
    v2ndPtTo1stPt: THREE.Vector3,
    i3DFirstPt: THREE.Vector3,
    i3DSecondPt: THREE.Vector3
  ) {
    const vDirection = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0)
    const mXnormal = new THREE.Vector3(1, 0, 0)
    const fAngle = v2ndPtTo1stPt.angleTo(mXnormal)

    //标尺与X的角度接近PI 靠近X轴；第二个点在右 或 标尺与X的角度接近0 靠近X轴；第二个点在左
    let fMarkDirAnlge = -1
    if (fAngle < (Math.PI * 7) / 18 || fAngle > (Math.PI * 10) / 18) {
      if (i3DFirstPt.x > i3DSecondPt.x) {
        fMarkDirAnlge = 1
      }
    }

    const rotationWorldMatrix = new THREE.Matrix4()
    rotationWorldMatrix.makeRotationZ((Math.PI / 2) * fMarkDirAnlge)
    vDirection.applyMatrix4(rotationWorldMatrix)

    return vDirection
  }

  /**
   * 获取尺寸距离
   * */
  public getDimText() {
    var v2ndPtTo1stPt = new THREE.Vector3(
      this.point1.x - this.point2.x,
      this.point1.y - this.point2.y,
      0
    )
    var fLen = v2ndPtTo1stPt.length()
    return fLen.toFixed(3)
  }

  public worldDraw(pWorldDraw: McGiWorldDraw): void {
    pWorldDraw.setOpacity(this.opacity)
    if (
      pWorldDraw.getType() == McGiWorldDrawType.kWorldDraw ||
      pWorldDraw.getType() == McGiWorldDrawType.kDynDragDraw
    ) {
      const pt1 = this.point1
      const pt2 = this.point2
      //标注的三条线
      let line2, line3, text, mTriangle1, mTriangle2, mPoint1, mPoint2

      const v2ndPtTo1stPt = new THREE.Vector3(pt1.x - pt2.x, pt1.y - pt2.y, 0)

      const mxObj = pWorldDraw.getMxObject();

      const arrowSize = mxObj.screenCoordLong2Doc(this.sizeArrow);
      const textSize = mxObj.screenCoordLong2Doc(this.sizeText);

      const vDirection = this.getDirection(v2ndPtTo1stPt, pt1, pt2)

      const scaleWorldMatrix = new THREE.Matrix4()
      scaleWorldMatrix.makeScale(0.01, 0.01, 0.01)
      const vTemp = new THREE.Vector3(vDirection.x, vDirection.y, 0)
      vTemp.applyMatrix4(scaleWorldMatrix)

      const mTopPt1 = new THREE.Vector3(pt1.x + vTemp.x, pt1.y + vTemp.y, 0)
      const mTopPt2 = new THREE.Vector3(pt2.x + vTemp.x, pt2.y + vTemp.y, 0)

      const color = this.getColor()
      //画点
      {
        mPoint1 = MxThreeJS.createPoint(pt1, color)
        mPoint2 = MxThreeJS.createPoint(pt2, color)
      }

      //画线

      const vTemp2 = new THREE.Vector3(vDirection.x, vDirection.y, 0)

      scaleWorldMatrix.identity()
      scaleWorldMatrix.makeScale(0.02, 0.02, 0)

      vTemp2.applyMatrix4(scaleWorldMatrix)

      const linePt1 = new THREE.Vector3(mTopPt1.x + vTemp2.x * 2, mTopPt1.y + vTemp2.y * 2);
      const linePt2 = new THREE.Vector3(mTopPt2.x + vTemp2.x * 2, mTopPt2.y + vTemp2.y * 2);

      {

        //pWorldDraw.drawLine(mTopPt1, mTopPt2)

        pWorldDraw.drawLine(
          linePt1,
          linePt2,
        )

        line2 = MxThreeJS.createLine(
          new THREE.Vector3(mTopPt1.x + vTemp2.x * 3, mTopPt1.y + vTemp2.y * 3, 0),
          new THREE.Vector3(pt1.x + vTemp2.x * 0.5, pt1.y + vTemp2.y * 0.5, 0),
          color
        )

        line3 = MxThreeJS.createLine(
          new THREE.Vector3(mTopPt2.x + vTemp2.x * 3, mTopPt2.y + vTemp2.y * 3, 0),
          new THREE.Vector3(pt2.x + vTemp2.x * 0.5, pt2.y + vTemp2.y * 0.5, 0),
          color
        )
      }

      //画文字

      {
        const mXnormal = new THREE.Vector3(1, 0, 0)
        let fAngle = v2ndPtTo1stPt.angleTo(mXnormal)

        // vTemp 标注线垂直方向 。
        const vTemp = new THREE.Vector3(vDirection.x, vDirection.y, 0)
        vTemp.normalize()

        if (v2ndPtTo1stPt.y < 0) {
          if (fAngle < Math.PI / 2) {
            fAngle = 2 * Math.PI - fAngle
          } else {
            fAngle = Math.PI - fAngle
          }
        } else {
          if (fAngle > Math.PI / 2) {
            fAngle = Math.PI + fAngle
          }
        }

        const mxobj = pWorldDraw.getMxObject()
        if (mxobj) {
          fAngle -= mxobj.getViewAngle()
        }


        let vecLine = new THREE.Vector3(linePt1.x - linePt2.x, linePt1.y - linePt2.y, 0);

        const vTempDir = new THREE.Vector3(vDirection.x, vDirection.y, 0)
        vTempDir.normalize();
        vTempDir.multiplyScalar(textSize * 0.7);

        const sText = this.getDimText()
        text = MxThreeJS.creatTextSprite(
          sText,
          new THREE.Vector3(
            linePt2.x + vecLine.x / 2 + vTempDir.x,
            linePt2.y + vecLine.y / 2 + vTempDir.y,
            0
          ),
          textSize,
          fAngle,
          this.fontColor || color
        )

        if (text != null) {
          text.material.opacity = this.opacity
          pWorldDraw.drawEntity(text)
        }
      }

      //画三角形
      {
        scaleWorldMatrix.identity()
        scaleWorldMatrix.makeScale(arrowSize, arrowSize, arrowSize)

        const rotationWorldMatrix = new THREE.Matrix4()
        rotationWorldMatrix.makeRotationZ((Math.PI * 17) / 18)
        let vTrianglePt1Dir = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0)
        vTrianglePt1Dir.normalize();

        vTrianglePt1Dir.applyMatrix4(scaleWorldMatrix)
        vTrianglePt1Dir.applyMatrix4(rotationWorldMatrix)

        rotationWorldMatrix.identity()
        rotationWorldMatrix.makeRotationZ((-Math.PI * 17) / 18)
        let vTrianglePt2Dir = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0)
        vTrianglePt2Dir.normalize();
        vTrianglePt2Dir.applyMatrix4(scaleWorldMatrix)
        vTrianglePt2Dir.applyMatrix4(rotationWorldMatrix)

        const pts1: Array<THREE.Vector3> = new Array<THREE.Vector3>()

        pts1.push(
          new THREE.Vector3(mTopPt1.x + vTemp2.x * 2, mTopPt1.y + vTemp2.y * 2, 0),
          new THREE.Vector3(
            mTopPt1.x + vTemp2.x * 2 + vTrianglePt1Dir.x,
            mTopPt1.y + vTrianglePt1Dir.y + vTemp2.y * 2,
            0
          ),
          new THREE.Vector3(
            mTopPt1.x + vTemp2.x * 2 + vTrianglePt2Dir.x,
            mTopPt1.y + vTrianglePt2Dir.y + vTemp2.y * 2,
            0
          )
        )

        mTriangle1 = MxThreeJS.createTriangle(pts1, color)

        rotationWorldMatrix.identity()
        rotationWorldMatrix.makeRotationZ(Math.PI / 18)
        vTrianglePt1Dir = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0)
        vTrianglePt1Dir.normalize()
        vTrianglePt1Dir.applyMatrix4(scaleWorldMatrix)
        vTrianglePt1Dir.applyMatrix4(rotationWorldMatrix)

        rotationWorldMatrix.identity()
        rotationWorldMatrix.makeRotationZ(-Math.PI / 18)
        vTrianglePt2Dir = new THREE.Vector3(v2ndPtTo1stPt.x, v2ndPtTo1stPt.y, 0)
        vTrianglePt2Dir.normalize();
        vTrianglePt2Dir.applyMatrix4(scaleWorldMatrix)
        vTrianglePt2Dir.applyMatrix4(rotationWorldMatrix)

        const pts2: Array<THREE.Vector3> = new Array<THREE.Vector3>()
        pts2.push(
          new THREE.Vector3(mTopPt2.x + vTemp2.x * 2, mTopPt2.y + vTemp2.y * 2, 0),
          new THREE.Vector3(
            mTopPt2.x + vTrianglePt1Dir.x + vTemp2.x * 2,
            mTopPt2.y + vTrianglePt1Dir.y + vTemp2.y * 2,
            0
          ),
          new THREE.Vector3(
            mTopPt2.x + vTrianglePt2Dir.x + vTemp2.x * 2,
            mTopPt2.y + vTrianglePt2Dir.y + vTemp2.y * 2,
            0
          )
        )

        mTriangle2 = MxThreeJS.createTriangle(pts2, color)
      }

      pWorldDraw.drawEntity(line2)
      pWorldDraw.drawEntity(line3)
      function setMaterialOpacity(material: THREE.Material | THREE.Material[], opacity: number) {
        if (Array.isArray(material)) {
          material.forEach(m => {
            setMaterialOpacity(m, opacity)
          })
        } else {
          material.opacity = opacity
        }
      }
      if (mTriangle1) {
        setMaterialOpacity(mTriangle1.material, this.opacity)
        pWorldDraw.drawEntity(mTriangle1)
      }
      if (mTriangle2) {
        setMaterialOpacity(mTriangle2.material, this.opacity)
        pWorldDraw.drawEntity(mTriangle2)
      }
      pWorldDraw.drawEntity(mPoint1)
      pWorldDraw.drawEntity(mPoint2)
    } else {
      pWorldDraw.drawLine(this.point1, this.point2)
    }
  }
  /**
   * 设置测量的开始点
   * @parma pt1 three.js坐标点位
   * */
  public setPoint1(pt1: THREE.Vector3): void {
    this.point1 = pt1
  }
  /**
   * 设置测量的结束点
   * @parma pt1 three.js坐标点位
   * */
  public setPoint2(pt2: THREE.Vector3): void {
    this.point2 = pt2
  }

  setColor(color: MxType.UnstableColor | MxType.UnstableColor[]) {

    if (color instanceof Array) {
      ;[this.color = this.color, this.fontColor = this.fontColor || this.color] = color
      console.log('this.fontColor : ', this.fontColor)
    } else {
      this.color = color
    }
    return this
  }

  public getGripPoints(): Array<THREE.Vector3> {
    let ret = []
    ret.push(this.point1)
    ret.push(this.point2)
    return ret
  }

  public moveGripPointsAt(index: number, offset: THREE.Vector3): boolean {
    if (index == 0) {
      this.point1.add(offset)
    } else if ((index = 1)) {
      this.point2.add(offset)
    }
    return true
  }

  public dwgIn(obj: any): boolean {
    this.onDwgIn(obj)
    this.dwgInHelp(obj, propertyDbKeys)
    return true
  }

  public dwgOut(obj: any): object {
    this.onDwgOut(obj)
    this.dwgOutHelp(obj, propertyDbKeys)
    return obj
  }

  public create() {
    return new MyFixArrowTextSizeAlignedDimension()
  }

  public onViewChange() {
    this.setNeedUpdateDisplay(true)
    return true
  }
}