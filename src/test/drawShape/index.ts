import { MxFun } from "mxdraw";
import { BR_MxDbCircleArc } from "./BR_MxDbCircleArc";
import { BR_MxDbEllipseArc } from "./BR_MxDbEllipseArc";
import { BR_MxDbArcShape } from "./BR_MxDbArcShape";
import { BR_MxDbRingShape } from "./BR_MxDbRingShape";
import { BR_MxDbStarShape } from "./BR_MxDbStarShape";
import { BR_MxDbPolygonShape } from "./BR_MxDbPolygonShape";
import { BR_Arrow } from "./BR_Arrow";


export function drawShapeInit() {
    MxFun.addCommand("BR_MxDbCircleArc", BR_MxDbCircleArc);
    MxFun.addCommand("BR_MxDbEllipseArc", BR_MxDbEllipseArc);
    MxFun.addCommand("BR_MxDbArcShape", BR_MxDbArcShape);
    MxFun.addCommand("BR_MxDbRingShape", BR_MxDbRingShape);
    MxFun.addCommand("BR_MxDbStarShape", BR_MxDbStarShape);
    MxFun.addCommand("BR_MxDbPolygonShape", BR_MxDbPolygonShape);
    MxFun.addCommand("BR_Arrow", BR_Arrow)
}
