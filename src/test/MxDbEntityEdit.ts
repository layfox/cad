///////////////////////////////////////////////////////////////////////////////
//版权所有（C）2002-2022，成都梦想凯德科技有限公司。
//本软件代码及其文档和相关资料归成都梦想凯德科技有限公司
//应用包含本软件的程序必须包括以下声明
//在版权声明中：
//使用本软件、其文档或相关材料
//使用此应用程序需与成都梦想凯德科技有限公司达成协议
///////////////////////////////////////////////////////////////////////////////
import { MxDbEntity, MxFun, MxType } from "mxdraw";
import * as THREE from "three";

function BR_DeleteEntity() {
  let mxObj = MxFun.getCurrentDraw();
  let aryId = mxObj.getMxCurrentSelect();
  if (aryId.length != 0) {
    aryId.forEach((val) => {
      mxObj.eraseMxEntity(val);
    });
    mxObj.updateDisplay();
  }
}

function BR_CopyEntity() {
  let mxObj = MxFun.getCurrentDraw();
  let aryId = mxObj.getMxCurrentSelect();
  if (aryId.length == 0) {
    return;
  }

  let ent: MxDbEntity = mxObj.getMxEntity(aryId[0]);
  let newEnt: MxDbEntity = ent.clone();
  let lDist = mxObj.screenCoordLong2Doc(10);
  let mat = new THREE.Matrix4();
  mat.makeTranslation(lDist, lDist, 0);
  newEnt.transformBy(mat);
  mxObj.addMxEntity(newEnt);
  mxObj.clearMxCurrentSelect();
  mxObj.addMxCurrentSelect(newEnt.objectId());
}

function BR_SetEntityColor(color: any) {
  let mxObj = MxFun.getCurrentDraw();
  let aryId = mxObj.getMxCurrentSelect();
  if (aryId.length == 0) {
    return;
  }

  let ent: MxDbEntity = mxObj.getMxEntity(aryId[0]);
  let iColor = 0xffffff;
  //colors = ['red', 'yellow', 'blue']
  if (color == "yellow") {
    iColor = 0xffff00;
  } else if (color == "red") {
    iColor = 0xff0000;
  } else if (color == "blue") {
    iColor = 0x0000ff;
  }
  ent.setColor(iColor);
  ent.setNeedUpdateDisplay();

  // test;
  let sJson = ent.toJsonString(MxType.MxCloneType.kSaveDwgClone);
  let sDatabaseJson = ent.getMxObject()?.getDtabaseJsonString();
  console.log(sJson);
  console.log(sDatabaseJson);
}

function BR_DditTextEntity() {
  let mxObj = MxFun.getCurrentDraw();
  let aryId = mxObj.getMxCurrentSelect();
  if (aryId.length == 0) {
    return;
  }

  let ent: MxDbEntity = mxObj.getMxEntity(aryId[0]);
  let newEnt: MxDbEntity = ent.clone();
  let lDist = mxObj.screenCoordLong2Doc(10);
  let mat = new THREE.Matrix4();
  mat.makeTranslation(lDist, lDist, 0);
  newEnt.transformBy(mat);
  mxObj.addMxEntity(newEnt);
  mxObj.clearMxCurrentSelect();
  mxObj.addMxCurrentSelect(newEnt.objectId());
}

export function init() {
  MxFun.addCommand("BR_DeleteEntity", BR_DeleteEntity);
  MxFun.addCommand("BR_CopyEntity", BR_CopyEntity);
  MxFun.addCommand("BR_SetEntityColor", BR_SetEntityColor);
}
