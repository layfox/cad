import { Geometry, LineBasicMaterial, LineLoop, LineDashedMaterial, } from "three";
/**
 * 创建矩形
*/
export function createThreeRectangle(pt1, pt3) {
    const geometry = new Geometry();
    const material = new LineBasicMaterial({
        color: "#ff0000",
    });
    const pt2 = pt1.clone().set(pt3.x, pt1.y, pt3.z);
    const pt4 = pt3.clone().set(pt1.x, pt3.y, pt1.z);
    geometry.setFromPoints([pt1,
        pt2,
        pt3,
        pt4]);
    const line = new LineLoop(geometry, material);
    return line;
}
export function createThreeDashedRectangle(pt1, pt3) {
    const geometry = new Geometry();
    const pt2 = pt1.clone().set(pt3.x, pt1.y, pt3.z);
    const pt4 = pt3.clone().set(pt1.x, pt3.y, pt1.z);
    geometry.setFromPoints([pt1,
        pt2,
        pt3,
        pt4]);
    var line = new LineLoop(geometry, new LineDashedMaterial({
        color: 0x208CA6,
        dashSize: 3,
        gapSize: 1
    }));
    line.computeLineDistances(); //不可或缺的，若无，则线段不能显示为虚线
    //console.log(pt1,pt3)
    return line;
}
//# sourceMappingURL=ThreeRectangle.js.map