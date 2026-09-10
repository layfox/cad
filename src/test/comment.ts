import * as THREE from "three";
import {
	McEdGetPointWorldDrawObject,
	MrxDbgUiPrPoint,
	MxDbLeadComment,
	MxFun,
} from "mxdraw";
import {MxMeasure } from "./MeasureDistance";
import { ZoomW } from "./ZoomW";
import { MeasureArea } from "./MeasureArea";
import { MeasureCoord } from "./MeasureCoord";
import * as echarts from "echarts";
import { MxCpp } from "mxcad";

let tmpLeadComment: MxDbLeadComment;

const DrawComment = {

	BR_Comment() {
		const getPoint = new MrxDbgUiPrPoint();
		getPoint.setMessage("\n指定第一点:");
		getPoint.go((status) => {
			if (status != 0) {
				return;
			}

			const pt1 = getPoint.value();

			const leadComment = new MxDbLeadComment();
			leadComment.point1 = pt1.clone();
			leadComment.textHeight = MxFun.screenCoordLong2Doc(50);
			leadComment.text = "测试Test1";
			leadComment.textWidth = MxFun.screenCoordLong2Doc(300);

			leadComment.fixedSize = true;
			if (leadComment.fixedSize) {
				leadComment.textHeight = 50;
				leadComment.textWidth = 250;
			}

			const worldDrawComment = new McEdGetPointWorldDrawObject();
			worldDrawComment.setDraw(
				(currentPoint: THREE.Vector3, pWorldDraw) => {

					leadComment.point2 = currentPoint;
					pWorldDraw.drawCustomEntity(leadComment);

				}
			);

			getPoint.setBasePt(pt1);
			getPoint.setUseBasePt(true);

			getPoint.setUserDraw(worldDrawComment);
			getPoint.setMessage("\n指定第二点:");

			getPoint.go((status) => {
				if (status != 0) {
					console.log(status);
					return;
				}
				const currentPoint = getPoint.value();
				leadComment.point2 = currentPoint;
				MxFun.addToCurrentSpace(leadComment);
				tmpLeadComment = leadComment;
			});
		});
	},

	Br_LocateComment() {
		if (!tmpLeadComment) { return; }
		MxFun.getCurrentDraw().zoomCenter(tmpLeadComment.point1.x, tmpLeadComment.point1.y);


	},

	BR_DimensionMeasurement() {
		const mDist = new MxMeasure();
		mDist.DoDimensionMeasurement();
	},

	BR_FixArrowTextSizeDimensionMeasurement() {
		const mDist = new MxMeasure();
		mDist.DoFixArrowTextSizeDimensionMeasurement();
	},


	BR_Area() {
		const mArea = new MeasureArea();
		mArea.Do();
	},

	BR_Coord() {
		const mCoord = new MeasureCoord();
		mCoord.Do();
	},

	BR_Print() {
		MxFun.getCurrentDraw().createCanvasImageData(
			(imageData: String) => {
				const newWindow: any = window.open();
				if (newWindow != null) {
					newWindow.document.write('<img src="' + imageData + '"/>');
					setTimeout(() => {
						newWindow.print();
					}, 300);
				}
			},
			{
				width: 2682,
				height: 1740,
			}
		);
	},


	BR_ZooomInitialStates() {
		const mxobj = MxFun.getCurrentDraw();
		mxobj.zoomInitialStates();
		mxobj.updateDisplay();
	},

	BR_ZoomW() {
		const zw = new ZoomW();
		zw.Do();
	},

	BR_SetViewAngle() {
		const mxobj = MxFun.getCurrentDraw();
		mxobj.setViewAngle(30 * 3.14159265 / 180.0);
	},

	BR_Echarts() {
		// 拖拽元素
		function onMousedown(this: any, e: any) {
			// 获取该元素的transform的计算后的值
			function getStyle(el: any, attr: any) {
				if (typeof window.getComputedStyle !== "undefined") {
					return window.getComputedStyle(el, null)[attr];
				} else if (typeof el.currentStyle !== "undefined") {
					return el.currentStyle[attr];
				}
				return "";
			}
			// 正则解析
			const matrix3dReg =
					/^matrix3d\((?:[-\d.]+,\s*){12}([-\d.]+),\s*([-\d.]+)(?:,\s*[-\d.]+){2}\)/,
				matrixReg =
					/^matrix\((?:[-\d.]+,\s*){4}([-\d.]+),\s*([-\d.]+)\)$/;
			/* 定义元素变量 */
			const windowClass: string = "sheet_layer_settings_window";

			// const ELEMENT: any = document.getElementsByClassName(windowClass)[0]
			const ELEMENT: any = this;

			// 设置class
			if (ELEMENT.className.indexOf("drag_box_translate3d") === -1) {
				ELEMENT.className += " drag_box_translate3d";
			}

			/* 定义距离尺寸的存储池 */
			const E_SIZER: any = {};
			// 获取解析后的transform样式属性值(计算后的样式)
			const matrix3dSourceValue: any = getStyle(ELEMENT, "transform");
			// 使用正则解析matrix
			const matrix3dArrValue: any =
				matrix3dSourceValue.match(matrix3dReg) ||
				matrix3dSourceValue.match(matrixReg);
			// 记录鼠标点击时的坐标
			// console.log(ELEMENT.clientX);
			E_SIZER.clientX = e.clientX;
			E_SIZER.clientY = e.clientY;

			// 记录matrix解析后的translateX & translateY的值
			E_SIZER.targetX = matrix3dArrValue[1];

			E_SIZER.targetY = matrix3dArrValue[2];
			// 计算坐标边界巨鹿

			E_SIZER.distX = E_SIZER.clientX - E_SIZER.targetX;
			E_SIZER.distY = E_SIZER.clientY - E_SIZER.targetY;
			const disx = e.pageX - ELEMENT.offsetLeft;
			const disy = e.pageY - ELEMENT.offsetTop;
			// 鼠标移动
			const fun = function(e: any) {
				// 阻止原生和冒泡
				e.stopPropagation();
				e.preventDefault();

				// 计算元素到屏幕的距离
				const moveX = e.clientX - E_SIZER.distX;
				const moveY = e.clientY - E_SIZER.distY;
				// 动画拖拽
				ELEMENT.style.transform =
					ELEMENT.style.mozTransform =
					ELEMENT.style.webkitTransform =
						`translate3d(${moveX}px, ${moveY}px, 1px)`;
			};
			// 取消事件
			document.onmousemove = fun;
			document.onmouseup = function() {
				document.onmousemove = document.onmouseup = null;
			};
		}

		const dom: any = document.getElementById("myChart");
		dom.onmousedown = onMousedown;
		dom.style.width = "500px";
		dom.style.height = "300px";
		const myChart = echarts.init(dom);
		const option = {
			series: [
				{
					name: "访问来源",
					type: "pie",
					radius: "55%",
					// roseType: 'angle', //把饼图显示成南丁格尔图。
					data: [
						{ value: 235, name: "视频广告" },
						{ value: 274, name: "联盟广告" },
						{ value: 310, name: "邮件营销" },
						{ value: 335, name: "直接访问" },
						{ value: 400, name: "搜索引擎" },
					],
				},
			],
		};

		// 柱状or折线统计图
		const option2 = {
			title: {
				text: "近15日销售数据",
				subtext:
					"出售衣服总量：229；出售鞋子总量：367；出售其他商品量：126",
			},
			tooltip: {
				trigger: "axis",
			},
			legend: {
				data: ["出售衣服总量", "出售鞋子总量", "出售其他商品量"],
			},
			toolbox: {
				show: true,
				feature: {
					mark: { show: true },
					dataView: { show: true, readOnly: false },
					magicType: { show: true, type: ["line", "bar"] },
					restore: { show: true },
					saveAsImage: { show: true },
				},
			},
			calculable: true,
			xAxis: [
				{
					type: "category",
					boundaryGap: false,
					data: [
						"2021-12-01",
						"2021-12-02",
						"2021-12-03",
						"2021-12-04",
						"2021-12-05",
						"2021-12-06",
						"2021-12-07",
						"2021-12-08",
						"2021-12-09",
						"2021-12-10",
					],
				},
			],
			yAxis: [
				{
					type: "value",
					axisLabel: {
						formatter: "{value}",
					},
				},
			],
			series: [
				{
					name: "出售衣服总量",
					type: "bar",
					data: [11, 15, 20, 9, 17, 6, 13, 27, 6, 1],
					markPoint: {
						data: [
							{ type: "max", name: "最大值" },
							{ type: "min", name: "最小值" },
						],
					},
					markLine: {
						data: [{ type: "average", name: "平均值" }],
					},
				},
				{
					name: "用户登录量",
					type: "bar",
					data: [17, 5, 10, 17, 6, 12, 18, 14, 1, 25],
					markPoint: {
						data: [
							{ type: "max", name: "最大值" },
							{ type: "min", name: "最小值" },
						],
					},
					markLine: {
						data: [{ type: "average", name: "平均值" }],
					},
				},
				{
					name: "用户购买量",
					type: "bar",
					data: [1, 3, 7, 9, 2, 16, 3, 4, 6, 5],
					markPoint: {
						data: [
							{ type: "max", name: "最大值" },
							{ type: "min", name: "最小值" },
						],
					},
					markLine: {
						data: [{ type: "average", name: "平均值" }],
					},
				},
			],
		};

		// 使用刚指定的配置项和数据显示图表。
		myChart.setOption(option);
	},

	BR_FullScreen() {
		const el: any = document.documentElement;
		const rfs =
			el.requestFullScreen ||
			el.webkitRequestFullScreen ||
			el.mozRequestFullScreen ||
			el.msRequestFullScreen;
		if (typeof rfs != "undefined" && rfs) {
			rfs.call(el);
		} else if (typeof window.ActiveXObject != "undefined") {
			const wscript = new ActiveXObject("WScript.Shell");
			if (wscript != null) {
				wscript.SendKeys("{F11}");
			}
		}
	},

	BR_QuitFullScreen() {
		const el: any = document;
		let cfs =
				el.cancelFullScreen ||
				el.mozCancelFullScreen ||
				el.msExitFullscreen ||
				el.webkitExitFullscreen ||
				el.exitFullscreen,
			wscript;
		if (cfs) {
			cfs.call(el);
			return;
		} else if (typeof window.ActiveXObject !== "undefined") {
			const wscript = new ActiveXObject("WScript.Shell");
			if (wscript != null) {
				wscript.SendKeys("{F11}");
			}
		} else {
			console.log("浏览器不支持全屏API或已被禁用");
		}
	},

	BR_Regen() {
		if (MxFun.getCurrentDraw().isMxCAD() ) { MxCpp.getCurrentMxCAD().regen(); }
	},

	init() {
		MxFun.addCommand("BR_Comment", this.BR_Comment);
		MxFun.addCommand("Br_LocateComment", this.Br_LocateComment);

		MxFun.addCommand("BR_DimensionMeasurement", this.BR_DimensionMeasurement);
		MxFun.addCommand("BR_FixArrowTextSizeDimensionMeasurement", this.BR_FixArrowTextSizeDimensionMeasurement);


		MxFun.addCommand("BR_Print", this.BR_Print);
		MxFun.addCommand("BR_ZooomInitialStates", this.BR_ZooomInitialStates);

		MxFun.addCommand("BR_ZoomW", this.BR_ZoomW);
		MxFun.addCommand("BR_SetViewAngle", this.BR_SetViewAngle);

		MxFun.addCommand("BR_Area", this.BR_Area);
		MxFun.addCommand("BR_Coord", this.BR_Coord);
		MxFun.addCommand("BR_Echarts", this.BR_Echarts);

		MxFun.addCommand("BR_FullScreen", this.BR_FullScreen);
		MxFun.addCommand("BR_QuitFullScreen", this.BR_QuitFullScreen);
		MxFun.addCommand("BR_Regen", this.BR_Regen);


	},
};


export function init() {


	DrawComment.init();
}
