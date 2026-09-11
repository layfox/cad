import {
	CatmullRomCurve3,
	Vector3,
	BufferGeometry,
	LineBasicMaterial,
	Line,
	Float32BufferAttribute,
	Color,
	VertexColors
} from "three";

import { BasicLine } from "./BasicLine";

// 弃用 windows操作系统平台上使用Three.js引擎的WebGL渲染器WebGLRenderer linewidth属性无效
export function createAnyLine(points: Vector3[]) {
	const curve = new CatmullRomCurve3(points, false,  "chordal");
	points = curve.getPoints( 50 );
	const geometry = new BufferGeometry().setFromPoints(points);
	const divisions = Math.round( 12 * points.length );
	let point = new Vector3();
	const positions = [];
	const colors = [];
	const color = new Color("#ff0000");
	for ( let i = 0, l = divisions; i < l; i ++ ) {
		const t = i / l;
		point = curve.getPoint( t );
		positions.push( point.x, point.y, point.z );
		colors.push( color.r, color.g, color.b );
	}
	geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	const material = new LineBasicMaterial( { vertexColors: VertexColors, linewidth: 10 } );

	const splineObject = new Line( geometry, material );
	splineObject.computeLineDistances();
	const line =  new BasicLine(splineObject);
	return line;
}

//  解决线宽问题
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
export function createAnyLine1(points: Vector3[]) {
	const geometry = new LineGeometry();
	setAnyLinePointsOfColors(geometry, points);
	const  matLine = new LineMaterial( {
		color: 0xffffff,
		linewidth: 5, // in world units with size attenuation, pixels otherwise
		// vertexColors: VertexColors,
		// resolution:  // to be set by renderer, eventually
		dashed: false,
	} );
	matLine.resolution.set(window.innerWidth, window.innerHeight);
	const line = new Line2( geometry, matLine );
	line.computeLineDistances();

	return line;
}

// 设置顶点和颜色
export function setAnyLinePointsOfColors(geometry: LineGeometry, points: Vector3[]) {
	const curve = new CatmullRomCurve3(points, false,  "chordal");
	points = curve.getPoints( 50 );
	const divisions = Math.round( 200 * points.length );
	let point = new Vector3();
	const positions = [];
	const colors = [];
	const color = new Color("#ff0000");
	for ( let i = 0, l = divisions; i < l; i ++ ) {
		const t = i / l;
		point = curve.getPoint( t );
		positions.push( point.x, point.y, point.z );
		colors.push( color.r, color.g, color.b );
	}
	geometry.setPositions( positions );
	geometry.setColors( colors );
}
