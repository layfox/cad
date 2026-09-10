import { MyText, init as SampleDrawInit} from './draw';
import { init as CommentInit} from './comment';
import { init as SvgInit} from './drawsvg';
import { init as initMxDbEntityEdit} from './MxDbEntityEdit';
import { MyAlignedDimension, MyFixArrowTextSizeAlignedDimension } from './MeasureDistance';
import { MyArea } from './MeasureArea';

import { drawShapeInit } from './drawShape';
import { MyRect } from './DrawRect';
// import { store } from 'mxdraw'
export function RegistMxCommands() {
  SampleDrawInit();
  CommentInit();
  SvgInit();
  initMxDbEntityEdit();
  drawShapeInit();
}

// 初化自定义实体的类信息，用数据归档和恢复.
export function RxInitMxEntity() {
  // ...
  new MyAlignedDimension().rxInit();
  new MyFixArrowTextSizeAlignedDimension().rxInit();
  new MyArea().rxInit();
  new MyRect().rxInit();
  new MyText().rxInit();
}
