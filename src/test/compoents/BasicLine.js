//  解决线宽问题
import { BufferGeometry, Color } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
// 保存原本的setFromPoints方法
const _setFromPoints = LineGeometry.prototype.setFromPoints;
/**
 * 基础线段几何体
 * */
export class BasicLineGeometry extends LineGeometry {
    constructor() {
        super();
    }
    /**
     * 将原Line几何体转换为Line2几何体
    */
    transitionGemetry(geometry) {
        let points = [];
        let colors = [];
        if (geometry?.isGeometry) {
            geometry = geometry;
            geometry = new BufferGeometry().fromGeometry(geometry);
            // Geometry获取points和colors的方法 无效
            // const pts = (geometry)?.vertices as unknown as number[]
            // points = []
            // for(let i=0; i < pts.length;i++) {
            //     const point:any = points[i]
            //     points.push(point?.x, point?.y, point?.z || 0)
            // }
            // const colorVals = geometry?.colors as unknown as number[]
            // for(let i=0; i < colorVals.length;i++) {
            //     const color =new Color(points[i])
            //     colors.push(color?.r, color?.g, color?.b)
            // }
        }
        if (geometry?.isBufferGeometry) {
            geometry = geometry;
            points = geometry.attributes?.position?.array;
            colors = geometry.attributes?.color?.array;
        }
        this.setPositions(points);
        this.setColors(colors);
    }
    // 重写方法
    setFromPoints(points) {
        const positions = [];
        for (let i = 0; i < points.length; i++) {
            positions.push(points[i].x, points[i].y, points[i]?.z || 0);
        }
        this.setPositions(positions);
        _setFromPoints.call(this, points);
        return this;
    }
}
/**
 * 基础线段材质
 * */
export class BasicLineMaterial extends LineMaterial {
    constructor(...arr) {
        super(...arr);
    }
    /**
     * 将原Line材质转换为Line2材质
    */
    transitionMaterial(meterial) {
        this.color = meterial?.color || new Color();
        this.linewidth = meterial?.linewidth || 1;
        this.resolution.set(window.innerWidth, window.innerHeight);
    }
}
/**
 * 基础线段
 * */
export class BasicLine extends Line2 {
    constructor(basicLineGeometry = new BasicLineGeometry(), basicLineMaterial = new BasicLineMaterial()) {
        super(basicLineGeometry, basicLineMaterial);
    }
    /**
     * 将原Line转换为Line2
    */
    transitionLine(line) {
        const geometry = this.geometry;
        const material = this.material;
        geometry.transitionGemetry(line.geometry);
        material.transitionMaterial(line.material);
        this.computeLineDistances();
        return this;
    }
}
//# sourceMappingURL=BasicLine.js.map