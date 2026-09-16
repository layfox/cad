<template>
  <div class="content">
    <div id="mxdiv" :style="{
      cursor: cursorClass,
    }">
      <TestMenu :data="list" @change="onClick" ref="testMenu">
        <template slot="top">
          <h1 class="menu-title">
            <img :src="logoImgUrl" alt="MxCad" /> 浏览CAD图纸
          </h1>
        </template>
      </TestMenu>
      <div class="sidebar-menu">
        <div class="menu-item" v-for="(item, index) in sidebarMenuData" :key="index" @click="layerBtnClikc(item)">
          <img class="item-img" v-if="item.icon.indexOf('/') >= 0" :src="item.icon" />
          <span v-else class="iconfont item-icon" :class="item.icon"></span>
          <span class="menu-item-name">{{ item.name }}</span>
        </div>
      </div>
      <SheetLayerSettingsWindow :title="boxTitle" :titles="titles" :list="sheetLayerSettingsData" :isShow="isShowLayerBox"
        @onClickIsVisible="onClickIsVisible" @onClickName="onClickName" @close="() => {
          isShowLayerBox = false;
        }
          " />

      <ColorPciker v-model="color" ref="colorPciker" @input="updateColor" />
      <div id="myChart"></div>
      <CoordinatePrompt />
      <ObjectActionBar :isShow="isShowObjectActionbar" />
      <canvas id="mxcad" @mouseover.prevent="canvasMouseover" @click="canvasClick" @dblclick="canvasDblclick"></canvas>
    </div>
    <!-- 修改文字弹框 -->
    <el-dialog title="修改文字内容" :visible.sync="isShowTextDialog" :before-close="handleCloseTextDialog">
      <el-input v-model="inputText"></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCloseTextDialog">取 消</el-button>
        <el-button type="primary" @click="textDialogConfirm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import { MrxDbgUtils, MxDbSVG, MxFun, MxDbEntity } from "mxdraw";
import { MxCpp, createMxCad } from "mxcad";
import { Component, Vue, Watch } from "vue-property-decorator";

import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
import SheetLayerSettingsWindow, {
  LayerItemType,
} from "@/components/SheetLayerSettingsWindow/SheetLayerSettingsWindow.vue";
import TestMenu, { MenuItemType } from "@/components/TestMenu/TestMenu.vue";
import ColorPciker from "@/components/ColorPciker/ColorPciker.vue";
import {
  layout as layoutIcon,
  layer as layerIcon,
} from "@/assets/img/menuIcon";
import store from "@/store";

import CoordinatePrompt from "@/components/CoordinatePrompt/CoordinatePrompt.vue";
import ObjectActionBar from "@/components/ObjectActionBar/ObjectActionBar.vue";


import { init as iframeinit } from "../iframe";
@Component({
  components: {
	SheetLayerSettingsWindow,
	TestMenu,
	ColorPciker,
	CoordinatePrompt,
	ObjectActionBar,
  },
})
export default class Home extends Vue {
  [x: string]: any;
  get cursorClass(): string {
	return this.m_cursorClass;
  }

  set cursorClass(type: string) {
	if (!this.cursorsImage[type]) {
		this.cursorsImage[type] = this.cursors[type];
	}
	this.m_cursorClass = this.cursorsImage[type];
  }
  // ----------

  // 十字光标的长度.
  get cursorSize(): number {
	return store.state.cursorSize;
  }

  get cursorcolor(): string {
	return "#fff";
	// return "#0f3";
  }

  // 十字光标中间矩形框大小.
  get cursorRectSize(): number {
	return store.state.cursorRectSize;
  }

  get cursors(): any {
	return {
		Rect: `url('${MxFun.ceneratecursor(
		this.cursorSize,
		this.cursorRectSize,
		false, this.cursorcolor
		)}') ${this.cursorSize / 2} ${this.cursorSize / 2}, auto`,
		Cross: `url('${MxFun.ceneratecursor(this.cursorSize, 0, true, this.cursorcolor)}') ${this.cursorSize / 2
		} ${this.cursorSize / 2} , auto`,
		Normal: `url('${MxFun.ceneratecursor(
		this.cursorSize,
		this.cursorRectSize,
		true, this.cursorcolor
		)}') ${this.cursorSize / 2} ${this.cursorSize / 2}, auto`,
	};
  }
  public cursorType = "Normal";

  public isLoadWghFile = false;

  public logoImgUrl = require("@/assets/img/logo.png");
  public color = "#ffffff";
  public isShowObjectActionbar = false;
  public inputText = "";
  public isShowTextDialog = false;
  // 当前选择的自定义对象
  public currentEnt: any = null;

  public sidebarMenuData = [
	{
		icon: layerIcon,
		name: "图层",
		cmd: "layer",
	},
	{
		icon: layoutIcon,
		name: "布局",
		cmd: "layout",
	},
  ];
  public list: any = [
	{
		name: "测量",
		cmd: "",
		icon: "",
		children: [
		{
			name: "长度测量",
			cmd: "BR_DimensionMeasurement",
			icon: "icon-changdu",
		},
		{
			name: "长度测量_固定箭头文字大小",
			cmd: "BR_FixArrowTextSizeDimensionMeasurement",
			icon: "icon-changdu",
		},
		{
			name: "面积测量",
			cmd: "BR_Area",
			icon: "icon-area2",
		},
		{
			name: "坐标测量",
			cmd: "BR_Coord",
			icon: "icon-shitucezuobiao",
		},
		{
			name: "测量角度",
			cmd: "BR_AngleSurveying",
			icon: "icon-jiaodu",
		},
		{
			name: "绘制圆弧|| 测量弧长",
			// cmd: "BR_Arc",
			cmd: "Mx_3PointArc",
			icon: "icon-caozuojiemiantubiao---_sandianhuayuanhu",
		},
		],
	},
	{
		name: "点标记",
		cdm: "",
		icon: "",
		children: [
		{
			name: "引线标记",
			cmd: "BR_LeadTag",
			icon: "",
		},
		],
	},
	{
		name: "批注",
		cmd: "",
		icon: "",
		children: [
		{
			name: "绘制任意线",
			cmd: "BR_AnyLine",
			icon: "icon-ziyouquxian",
		},
		{
			name: "画线",
			cmd: "Mx_Line",
			// cmd: "Mx_Line",
			icon: "icon-huaxian-copy",
			// changeCallback() {
			//   MxDbLine.use()
			// }
		},
		{
			name: "样条曲线",
			cmd: "BR_SplineCurve",
			icon: "icon-quxian",
		},
		{
			name: "绘制云线",
			cmd: "BR_CloudLine",
			icon: "icon-yun",
		},
		{
			name: "引线标注",
			cmd: "BR_Comment",
			icon: "icon-yinxian",
		},
		{
			name: "定位到引线标注",
			cmd: "Br_LocateComment",
			icon: "icon-yinxian",
		},

		{
			name: "审图",
			cmd: "BR_CheckDraw",
			icon: "icon-weibiaoti-",
		},
		{
			name: "绘制矩形",
			cmd: "Mx_DrawRect",
			icon: "icon-juxing",
		},
		{
			name: "绘制矩形2",
			cmd: "Mx_MyDrawRect",
			icon: "icon-juxing",
		},

		{
			name: "绘制圆",
			cmd: "BR_Circle",
			icon: "icon-yuan1",
		},
		{
			name: "绘制椭圆",
			cmd: "BR_Ellipse",
			icon: "icon-tuoyuan",
		},
		{
			name: "绘制文字",
			cmd: "BR_Text",
			icon: "icon-wenzi",
		},
		{
			name: "箭头批注",
			cmd: "BR_Arrow",
			icon: "icon-jiantou_youxia_o",
		},
		{
			name: "绘制多边形",
			cmd: "BR_ThreeRegularPolygon",
			icon: "icon-duobianxing",
		},
		{
			name: "绘制圆弧",
			cmd: "BR_MxDbCircleArc",
			icon: "icon-yuanxinbanjinghu",
		},
		{
			name: "绘制椭圆弧",
			cmd: "BR_MxDbEllipseArc",
			icon: "icon-tuoyuanhu",
		},
		{
			name: "绘制弧形",
			cmd: "BR_MxDbArcShape",
			icon: "icon-huanxingtu1",
		},
		{
			name: "绘制环形",
			cmd: "BR_MxDbRingShape",
			icon: "icon-huanxingtu",
		},
		{
			name: "绘制星形",
			cmd: "BR_MxDbStarShape",
			icon: "icon-starl",
		},
		{
			name: "绘制不规则多边形",
			cmd: "BR_MxDbPolygonShape",
			icon: "icon-duobianxing1",
		},
		],
	},
	{
		name: "删除批注",
		cmd: "Mx_DeleteEntity",
		icon: "icon-shanchu",
	},

	{
		name: "全图",
		cmd: "Mx_ZoomE",
		icon: "icon-quantu",
	},

	{
		name: "窗口缩放",
		cmd: "BR_ZoomW",
		icon: "icon-suofang",
	},
	{
		name: "CAD重绘",
		cmd: "BR_Regen",
		icon: "",
	},
	{
		name: "打印",
		cmd: "BR_Print",
		icon: "icon-icon-",
	},
	{
		name: "全屏显示",
		cmd: "BR_FullScreen",
		icon: "icon-quantu",
		changeCallback(item: MenuItemType) {
		const isFullScreen = item.cmd === "BR_QuitFullScreen";
		item.cmd = isFullScreen ? "BR_FullScreen" : "BR_QuitFullScreen";
		item.name = isFullScreen ? "退出全屏" : "全屏显示";
		item.icon = isFullScreen ? "icon-tuichuquanping" : "icon-quantu";
		},
	},
	{
		name: "设置背景",
		icon: "icon-huanbeijing",
		changeCallback: () => {
		const colorPciker = this.$refs.colorPciker as ColorPciker;
		colorPciker.show();
		},
	},

	{
		name: "添加图层",
		icon: "",
		cmd: "BR_AddLayer",
	},

	{
		name: "隐藏图层",
		icon: "",
		cmd: "BR_HideLayer",
	},

	{
		name: "测试",
		icon: "",
		cmd: "BR_Test",
	},



	{
		name: "demo1",
		cmd: "",
		icon: "icon-202yonghu_yonghu3",
		children: [
		{
			name: "闪烁特效",
			cmd: "BR_Twinkle",
			icon: "icon-shanshuo",
		},
		{
			name: "动画1",
			cmd: "BR_Animation",
			icon: "icon-shanshuo",
		},
		{
			name: "动画2",
			cmd: "BR_Animation2",
			icon: "icon-shanshuo",
		},

		{
			name: "两点之间移动效果",
			cmd: "BR_MoveEff",
			icon: "icon-liangdianyidong",
		},
		{
			name: "echarts表格绘制",
			cmd: "BR_Echarts",
			icon: "icon-pie-chart-sharp",
		},

		{
			name: "模型大小固定位置不固定",
			cmd: "BR_ModelFixed",
			icon: "icon-gudingdaxiao",
		},
		{
			name: "设置视区旋转角度",
			cmd: "BR_SetViewAngle",
			icon: "",
		},
		],
	},
	{
		name: "demo2",
		cmd: "",
		icon: "icon-202yonghu_yonghu3",
		children: [
		{
			name: "绘制标记点",
			cmd: "Mx_DrawTag",
			icon: "icon-MBEfenggeduosetubiao-biaoji",
		},
		{
			name: "绘制图片标记点",
			cmd: "Mx_DrawImageTag",
			icon: "icon-MBEfenggeduosetubiao-biaoji",
		},
		{
			name: "绘制矩形框标记点",
			cmd: "Mx_DrawRectTag",
			icon: "icon-MBEfenggeduosetubiao-biaoji",
		},



		{
			name: "距离测量",
			cmd: "BR_DimensionMeasurement",
			icon: "icon-changdu",
		},


		{
			name: "删除标记点",
			cmd: "Mx_DeleteTag",
			icon: "icon-shanchu",
		},
		{
			name: "删除A2点",
			cmd: "Mx_DeleteTag_A2",
			icon: "icon-shanchu",
		},
		{
			name: "插入图片",
			cmd: "Mx_DrawImage",
			icon: "icon-charutupian",
		},
		{
			name: "绘制固定位置图片",
			cmd: "Mx_DrawFixImage",
			icon: "icon-guding",
		},
		{
			name: "固定图片转非固定",
			cmd: "Mx_FixImageToNoFix",
			icon: "",
		},

		{
			name: "非固定图片转固定",
			cmd: "Mx_NoFixImageToFix",
			icon: "",
		},
		{
			name: "绘制GIF动图",
			cmd: "Mx_DrawGIFImage",
			icon: "",
		},
		{
			name: "旋转图片",
			cmd: "Mx_RoatateImage",
			icon: "",
		},
		{
			name: "保存当前视区范围",
			cmd: "BR_SaveViewport",
			icon: "icon-baocun",
		},

		{
			name: "恢复保存的视区范围",
			cmd: "BR_RestoreViewport",
			icon: "icon-shujubeifenhuifu",
		},

		{
			name: "输出到显示到Image",
			cmd: "BR_WriteImage",
			icon: "",
		},

		{
			name: "禁用视区的缩放",
			cmd: "BR_DisabledZoom",
			icon: "",
		},

		{
			name: "禁用视区的移动",
			cmd: "BR_DisabledPan",
			icon: "",
		},

		{
			name: "保存当前图上数据",
			cmd: "Mx_SaveAllMxEntity",
			icon: "",
		},


		{
			name: "保存到DWG文件",
			cmd: "Mx_SaveDwg",
			icon: "",
		},


		{
			name: "恢复图上数据",
			cmd: "Mx_LoadAllMxEntity",
			icon: "",
		},

		{
			name: "创建组",
			cmd: "BR_CreateGroup",
			icon: "",
		},

		{
			name: "删除组",
			cmd: "BR_DeleteGroup",
			icon: "",
		},



		],
	},
  ];
  public currentItemIndex = -1;
  /** 布局图层弹框配置 */
  // 盒子名称
  public boxTitle = "图层";
  // 是否显示盒子
  public isShowLayerBox = false;
  // 双向绑定的数据
  public sheetLayerSettingsData: LayerItemType[] = [];
  // (图层|布局)弹框数据
  public sheetLayerData: LayerItemType[] = [];
  public sheetLayoutData: LayerItemType[] = [];
  // 头部标题
  public titles: [] | Array<{
	name: string;
	type: string;
	className: string;
  }> = [];

  // 图层的头部标题
  public layerBoxTitles = [
	{
		name: "可见",
		type: "visible",
		className: "flex_basis_50",
	},
	{
		name: "颜色",
		type: "color",
		className: "flex_basis_50",
	},
	{
		name: "名称",
		type: "name",
		className: "flex_basis_auto",
	},
	{
		name: "状态",
		type: "state",
		className: "flex_basis_50",
	},
  ];
  // 鼠标样式class
  private m_cursorClass: string = this.cursors.Normal;

  private cursorsImage: any = {};
  // 点击是否可见事件函数
  public onClickIsVisible: (item: LayerItemType) => void = () => { };
  // 点击名称事件函数
  public onClickName: (item: LayerItemType) => void = () => { };
  @Watch("cursors")
  public upDataCursor() {

	this.cursorClass = this.cursorType;
  }
  public mounted() {
	iframeinit();

	// ?file=demo/test2.mxweb
	let cadFile = MxFun.getQueryString("file");
	if (!(cadFile && cadFile.length > 0)) {
		cadFile = "./demo/test2.mxweb";
	} else if (cadFile.length > 4) {
		// ?file=demo/buf/hhhh.dwg
		// ?file=demo/buf/$hhhh.dwg.mxb1.wgh
		// http://localhost:3000/browse/?file=/demo/buf/test1111.dwg
		const extName = cadFile.substring(cadFile.length - 4);
		if (extName == ".wgh" || extName == ".dwg") {
		this.isLoadWghFile = true;
		}
	}

	if (this.isLoadWghFile) {
		const myThis = this;
		// 旧的方法，加载wgh文件。、
		MxFun.createMxObject({
		canvasId: "mxcad",
		cadFile,
		useWebsocket: false,
		callback: (mxDrawObject, { canvas, canvasParent }) => {
			canvasParent.className = "mxdiv";

			// mxDrawObject.setViewColor(0xFFFFFF);

			// 用于屏幕截图，启用three.js 绘图缓冲,不用截图，可以禁用该功能。
			mxDrawObject.initRendererParam({ preserveDrawingBuffer: true });

			// 设计鼠标中键移动视区.
			// mxDrawObject.setViewMovementMethod(1);
			mxDrawObject.setViewMovementMethod(2);



			// 添加图层数据更新显示.
			mxDrawObject.on("uiSetLayerData", (listLayer: any) => {
			myThis.sheetLayerData = listLayer.map((v: any) => {
				return { name: v.name, id: v.id, off: v.off, colorValue: v.colorValue, zerolayer: v.zerolayer, isState: true };
			});
			});

			// MxFun.showLayer(idLayer, isShow, false);
			// 显示范围发送变化通知事件 。
			mxDrawObject.on("viewchange", () => { });

			mxDrawObject.on("openFileComplete", (iRet: number) => {
			console.log("mx openFileComplete:" + iRet);
			// mxDrawObject.setZoomSpeed(6.0);
			// mxDrawObject.setViewMovementMethod(false);
			// mxDrawObject.getCanvas().addEventListener ('touchstart', (event)=>{
			//      console.log("touchstart");}, true);
			console.log(mxDrawObject.getAllLayoutName());
			this.sheetLayoutData = mxDrawObject.getAllLayoutName().map((name, index) => {
				return {
				name,
				id: index + 1,
				off: 1,
				};
			});
			this.sheetLayoutData.unshift({
				name: "Model",
				id: 0,
				off: 0,
			});
			});

			// 对象被选择的通知事件 。
			mxDrawObject.on("MxEntitySelectChange", (aryId: number[]) => {
			// console.log(aryId);
			if (aryId.length > 0) {
				this.isShowObjectActionbar = true;
			} else {
				this.isShowObjectActionbar = false;
			}
			});

			// mxDrawObject.setViewColor(0xFFFFFF);
			// 对像夹，编辑事件。
			mxDrawObject.on("objectGripEdit", (param: MxDbEntity) => {
			console.log("objectGripEdit end");
			});

			// 是否编辑夹点 。
			mxDrawObject.on("whetherEditTheGripPoint", (param: MxDbEntity) => {
			// console.log(param);
			return true;
			});

			// 对象创建完成后，开始加载图纸时调用，
			mxDrawObject.on("initObject", (param: MxDbEntity) => {
			console.log("initObject");
			});

			// 只打开端点捕捉 。
			const OsModeEnd = 1;
			mxDrawObject.setSysVar("OSMODE", OsModeEnd);

		},
		});
	} else {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		let paramValue = urlParams.get('wasmtype');
		if (!paramValue) {
		if (!("SharedArrayBuffer" in window)) {
			paramValue = "st";
		}
		}

		createMxCad({
		canvas: "#mxcad",
		locateFile: (fileName) => {
			return new URL((paramValue === "st" ? "./wasm/2d-st/" : "./wasm/2d/") + fileName, document.location.origin + '/' + document.location.pathname).href;
		},
		fileUrl: cadFile,
		browse: true,
		multipleSelect: false,
		middlePan: 1,
		authorized_service: "same_current_page_url",
		onInit: () => {
			MxCpp.App.addNetworkLoadingFont(["txt.shx", "simplex.shx", "gdt.shx", "aaa.shx", "ltypeshp.shx", "complex.shx"]);
			MxCpp.App.addNetworkLoadingBigFont(["hztxt.shx", "gbcbig.shx"]);
		},
		// middlePan:false,
		// viewBackgroundColor:{red:255,green:255,blue:255}
		}).then((mxcad) => {

		mxcad.mxdraw.on("openFileComplete", () => {
			console.log("openFileComplete");
		});
		});

	}

	MxFun.listenForCommandLineInput(({ msCmdTip, msCmdDisplay, msCmdText }) => {
		store.commit("setMsCmdTip", msCmdTip);
	});

	MxFun.listenForCoordTip((tipCoord) => {
		store.commit("setTipCoord", tipCoord);
	});

	// 监听光标的更新.
	MxFun.listenForUpdateCursor((cursorType) => {
		this.cursorType = cursorType;
		this.cursorClass = cursorType;
	});

	// 注册命令.
	RegistMxCommands();

	// 注册自定实体.
	RxInitMxEntity();

  }

  // 关闭文字弹框
  public handleCloseTextDialog() {
	this.isShowTextDialog = false;
  }
  // 显示文字弹框
  public showTextDialog(text: string) {
	this.inputText = text;
	this.isShowTextDialog = true;

  }
  // 文字弹框确定按钮
  public textDialogConfirm() {
	this.handleCloseTextDialog();
	if (this.currentEnt) {

		if (this.currentEnt.text) {
		this.currentEnt.text = this.inputText;
		} else if (this.currentEnt.getTypeName() == "MxDbSVG") {
		const svgTag: MxDbSVG = this.currentEnt;
		const txt = svgTag.getText(0);
		if (txt) {
			txt.txt = this.inputText;
		}
		}

		this.currentEnt.setNeedUpdateDisplay(true);
		MxFun.getCurrentDraw().resetRenderer();
		MxFun.updateDisplay();
		MxFun.stopRunCommand();
	}
  }

  // 鼠标移入canvas画布事件
  public canvasMouseover() {
	const testMenu = this.$refs.testMenu as TestMenu;
	testMenu.closeSubmenu();
	testMenu.closeActive();
  }
  // canvas画布点击事件
  public canvasClick(event: any) {
	const colorPciker = this.$refs.colorPciker as ColorPciker;
	colorPciker.hide();
  }

  // canvas 鼠标双击事件
  public canvasDblclick() {
	const mxObj = MxFun.getCurrentDraw();
	const pt = MxFun.getCurrentMousePostion();
	const idToData: any = {};
	const myThis = this;
	MrxDbgUtils.findEntAtPoint(pt, undefined, undefined, false, (id, data) => {
		// 得到点击位置的扩展数据.
		idToData[id] = data;
	}).then(
		(aryId: number[]) => {
		if (aryId.length == 0) { return; }
		// 得到点击的对象.
		myThis.currentEnt = mxObj.getMxEntity(aryId[0]) as any;
		if (myThis.currentEnt) {
			let text;
			if (myThis.currentEnt.text) {
			text = myThis.currentEnt.text;
			} else if (myThis.currentEnt.getTypeName() == "MxDbSVG") {
			// 点击了一个SVG对象.
			const exData = idToData[aryId[0]];
			if (exData && exData.type == "text") {
				// 点击了文字对象.
				console.log("mx:click text");
				const svgTag: MxDbSVG = myThis.currentEnt;
				const txt = svgTag.getText(0);
				if (txt) {
				text = txt.txt;
				}
			}
			}
			if (text) {
			myThis.showTextDialog(text);
			}
		}
		}
	);

  }
  public updateColor(color: any) {
	MxCpp.getCurrentMxCAD().setViewBackgroundColor(color.rgba.r, color.rgba.g, color.rgba.b);
	MxFun.updateDisplay();
  }
  // 点击事件
  public onClick(item: MenuItemType, event: Event, index: number) {
	if (item.cmd) {
		console.log(item.cmd);
		MxFun.sendStringToExecute(item.cmd);
	}
  }

  public layerBtnClikc(item: any) {
	if (this.isLoadWghFile) {
		switch (item.cmd) {
		case "layer":
			this.isShowLayerBox = true;
			this.sheetLayerSettingsData = this.sheetLayerData;
			this.titles = this.layerBoxTitles;
			this.boxTitle = "图层";
			this.onClickIsVisible = (item: LayerItemType) => {
			if (item.off === 0) {
				item.off = 1;
			} else {
				item.off = 0;
			}
			MxFun.showLayer(item.id, item.off === 0);
			};
			break;
		case "layout":
			this.isShowLayerBox = true;
			this.sheetLayerSettingsData = this.sheetLayoutData;
			this.titles = [];
			this.boxTitle = "布局";
			this.onClickName = this.onClickIsVisible = (item: LayerItemType) => {
			MxFun.getCurrentDraw().gotoLayout(item.name);
			console.log(item);
			};

			break;
		}
	} else {
		switch (item.cmd) {
		case "layer":
			const mxcad = MxCpp.getCurrentMxCAD();
			const layers = JSON.parse(mxcad.getDatabase().getLayerTable().getJson());

			this.isShowLayerBox = true;
			this.sheetLayerSettingsData = layers;
			this.titles = this.layerBoxTitles;
			this.boxTitle = "图层";
			this.onClickIsVisible = (item: LayerItemType) => {
			if (item.off === 0) {
				item.off = 1;
			} else {
				item.off = 0;
			}

			const layer = MxCpp.getCurrentDatabase().getLayerTable().get(item.name).getMcDbLayerTableRecord();
			if (layer === null) { return; }
			layer.isOff = (item.off == 1);
			mxcad.updateLayerDisplayStatus();
			mxcad.updateDisplay();
			};
			break;
		case "layout":
			const layouts = MxCpp.getCurrentMxCAD().getAllLayoutName();
			const layoutsData: LayerItemType[] = [];
			layouts.forEach((name, index) => {
			if (name === "Model") {
				layoutsData.unshift({
				id: index,
				name,
				});
			} else {
				layoutsData.push({
				id: index,
				name,
				});
			}
			});
			this.isShowLayerBox = true;
			this.sheetLayerSettingsData = layoutsData;
			this.titles = [];
			this.boxTitle = "布局";
			this.onClickName = this.onClickIsVisible = (item: LayerItemType) => {
			MxCpp.getCurrentMxCAD().setCurrentLayout(item.name);
			};

			break;
		}
	}

  }
  // 显示对象操作栏
  public showObjectActionbar() {
	this.isShowObjectActionbar = true;
  }
}
</script>
<style>
html,
body,
#app {
  height: 100%;
  overflow: hidden;
  background-color: #ccc;
}
</style>
<style scoped>
html::-webkit-scrollbar {
  width: 0 !important;
  -ms-overflow-style: none;
  overflow: -moz-scrollbars-none;
}

.children-li {
  margin-top: 0;
  border: 0;
  border-bottom: 1px solid #ccc;
}

.content {
  height: 100%;
  display: flex;
  justify-content: center;
}

#myChart {
  /* width: 500px;
    height: 300px; */
  color: #ffffff;
  position: absolute;
}



#mxdiv {
  width: 100%;
  position: relative;
  padding-top: 0;
  height: 100vh;
  background: #000;
}

.menu-title {
  color: #00a99e;
  font-size: 22px;
  font-weight: 500;
  display: flex;
  justify-content: center;
}

.menu-title img {
  margin-right: 8px;
}

.sidebar-menu {
  position: absolute;
  right: 0;
  background-color: #333333;
  display: flex;
  flex-direction: column;
  color: #fff;
  padding: 10px 0;
  top: 50%;
  transform: translate(0, -50%);
}

.menu-item {
  width: 100%;
  height: 100%;
  font-size: 20px;
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.menu-item-name {
  width: 20px;
  margin: 0 auto;
  line-height: 24px;
  font-size: 20px;
  margin-top: 4px;
}

.layer_btn_box {
  position: absolute;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #333;
  cursor: pointer;
  vertical-align: top;
  top: 45px;
  right: 40px;
}

.layer_btn {
  font-size: 32px;
  background-color: #9f9f9f;
}

.layer_btn_box:hover .layer_btn {
  background-color: #fff;
}
</style>
