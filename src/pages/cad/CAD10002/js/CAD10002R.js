import ViewerPanel from '../components/ViewerPanel/ViewerPanel.vue';
import ViewerPanel1 from '../components/ViewerPanel/ViewerPanel1.vue';
import ViewerPanel2 from '../components/ViewerPanel/ViewerPanel2.vue';
import ViewerPanel3 from '../components/ViewerPanel/ViewerPanel3.vue';
import { createMxCad, MxCpp, McDbCircle, McGePoint3d, McCmColor, McDbXData, McDbPoint, MxCADUtility, McDbBlockReference } from "mxcad";
import { MxFun, MrxDbgUiPrPoint, MrxDbgUtils, McEdGetPointWorldDrawObject,  MxDbLine, MxDbCircleShape, MxDbAnyLine, MxDbImage } from "mxdraw";
import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
import { MyRect } from "@/test/DrawRect";
import * as THREE from "three";
import { mapState } from 'vuex'
let _allMarkerIds = {}
export default {
  data() {
    return {
        tabs: ['安全监测', '水文监测', '瓦斯抽采', '人员定位'],
        tabIndex: 0,
        fileName: '图纸1',
        panelCollapsed: true,
        panelCollapsed1: true,
        categories: [
            {
                name: '甲烷',
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                ]
            },
            {
                name: '氧气',
                expanded: false,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                ]
            },
            {
                name: '粉尘',
                expanded: false,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.01%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.04%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.01%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: '0.04%' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: '0.01%' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: '0.04%' },
                    { pointName: '中央变电所甲烷7-T22', value: '0.01%' },
                ]
            }
        ],
        categories1: [
            {
                name: '水文监测站',
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                ]
            }
        ],
        categories2: [
            {
                name: '瓦斯监测',
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                ]
            }
        ],
        categories3: [
            {
                name: '分站-122-11盘区水泵房122号基站',
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: [
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '11210切眼掘面激光甲烷2-T1', value: 'XJH-SWJC-30' },
                    { pointName: '11盘区水泵房变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '13盘区水泵房配电硐室甲烷7-T22', value: 'XJH-SWJC-30' },
                    { pointName: '中央变电所甲烷7-T22', value: 'XJH-SWJC-30' },
                ]
            }
        ],
        fileUrlInput: "./models/YTSF-001.mxweb",
        fileName: "",
        // 加载状态
        loading: true,
        loadingText: "正在初始化查看器...",
        loadingStep: "准备中",
        loadingProgress: 0,

        // Viewer 状态
        viewerReady: false,
        mxcad: null,
        mxDraw: null,

        // Ctrl+左键平移状态
        currentCommand: "",
    }
  },
  beforeDestroy() {
    this._unbindMarkerClickEvent();
  },
  components: {
    ViewerPanel,
    ViewerPanel1,
    ViewerPanel2,
    ViewerPanel3
  },
  mounted() {
    // this.initViewer()
    // this.$nextTick(() => {
    //     this.initCtrlPan();
    // });
  },
  methods: {
    onTabClick(item, index) {
        this.tabIndex = index
        this.panelCollapsed = true
    },
    onAlarmHandle() {

    },
    async initViewer() {
        try {
        this.loading = true;
        this.loadingText = "正在初始化查看器...";
        this.loadingStep = "加载核心模块";
        this.loadingProgress = 10;

        // 注册所有命令和自定义实体
        // console.log("注册命令和自定义实体...");
        // RegistMxCommands();
        // RxInitMxEntity();

        const useST = !("SharedArrayBuffer" in window);
      const wasmPath = useST ? "./wasm/2d-st/" : "./wasm/2d/";

      console.log("WASM 路径:", wasmPath);

      this.loadingStep = "初始化 WASM 模块";
      this.loadingProgress = 30;
    const now = new Date().getTime()
      const mxcad = await createMxCad({
        canvas: "#mxcad",
        locateFile: (fileName) => {
          return new URL(wasmPath + fileName, window.location.origin + window.location.pathname).href;
        },
        // fileUrl: "./models/HDMY-XJH.mxweb",
        // fileUrl:"./models/HDMY-XJH-v2.mxweb",
        fileUrl:this.fileUrlInput,
        browse: true,
        multipleSelect: false,
        middlePan: 1,
        authorized_service: "same_current_page_url",
        onInit: () => {
          console.log("MxCAD 初始化回调，加载字体...");
          try {
            // 禁用智能选择和拾取框预览（绿色弧线）
            MxFun.setIniset({ EnableIntelliSelect: false });
            MxCpp.App.addNetworkLoadingFont([
              "txt.shx",
              "simplex.shx",
              "gdt.shx",
              "aaa.shx",
              "ltypeshp.shx",
              "complex.shx",
              "isocp.shx",
              "isoct.shx",
              "romans.shx"
            ]);
            MxCpp.App.addNetworkLoadingBigFont([
              "hztxt.shx",
              "gbcbig.shx",
              "tssdchn.shx",
              "gbhzfs.shx"
            ]);
          } catch (e) {
            console.warn("字体加载警告:", e);
          }
        }
      });

        console.log("MxCAD 实例创建成功:", mxcad);
console.log(new Date().getTime() - now, 22222222)
        this.mxcad = mxcad;
        this.mxDraw = mxcad.mxdraw;
        this.fileUrl = this.fileUrlInput; // 记录当前文件URL

        // 设置浅灰色背景（使用稍深的灰色避免触发SDK自动反色）
        mxcad.setViewBackgroundColor(255, 255, 255);

        // 启用鼠标中键平移（我们会把 Ctrl + 左键模拟成中键事件）
        try {
            mxcad.mxdraw.setMouseMiddlePan(true);
            console.log("已启用中键平移，Ctrl + 左键会模拟成中键事件");
        } catch (e) {
            console.warn("设置中键平移失败:", e);
        }
        
        // 设置滚轮缩放速度（数值越小缩放越慢）
        try {
            mxcad.mxdraw.setZoomSpeed(1.8);
            console.log("已设置滚轮缩放速度为 1.8");
        } catch (e) {
            console.warn("设置缩放速度失败:", e);
        }

        // 二次注册命令（mxcad 实例创建后可能会重置 MxFun 状态）
        console.log("二次注册命令...");
        RegistMxCommands();
        RxInitMxEntity();

        this.loadingStep = "初始化完成";
        this.loadingProgress = 90;

        // 监听文件加载完成
        mxcad.mxdraw.on("openFileComplete", () => {
            console.log("文件加载完成");
            
        });



        
        this.viewerReady = true;
        // this.loading = false; // 移到 onFileLoaded 中，避免闪烁
        this.loadingProgress = 100;
        this.fileName = this.fileUrlInput.split("/").pop() || "remote";

        // this.$Message.success("MxCAD 查看器初始化成功");

        } catch (error) {
        console.error("MxCAD 初始化失败:", error);
        this.loading = false;
        this.$Message.error("MxCAD 查看器初始化失败: " + error.message);
        }
        this._bindMarkerClickEvent();
    },
    zoomToPoint(x, y, zoomFactor = 3) {
        try {
            if (!this.mxcad || !this.mxcad.zoomCenter || !this.mxcad.zoomScale) return;
            this.mxcad.zoomCenter(x, y);
            this.mxcad.zoomScale(zoomFactor);
            console.log(`[zoomToPoint] 定位到 (${x.toFixed(2)}, ${y.toFixed(2)}) scale=${zoomFactor}`);
        } catch (e) {
            console.error('[zoomToPoint] 失败:', e);
        }
    },

    /**
     * 清除所有标记圆点
     */
    _clearAllMarkers() {
        if (!this.mxDraw) return;
        for(let key of _allMarkerIds) {
            this.mxDraw.eraseMxEntity(_allMarkerIds[key])
        }
        _allMarkerIds = {};
    },

    /**
     * 批量为所有点位添加标记圆点
     */
    _addPointMarkers() {
        console.log(_allMarkerIds, 1111)
        if (!this.mxDraw || !this.pointList || this.pointList.length === 0) return;
        this.pointList.forEach((point) => {
            // 重新添加
            const id = this._addImageAt(point.x, point.y, '1', point.pointNo);
            if (id !== null) {
                
                _allMarkerIds[point.pointNo] = id
            }
        });
        if (Object.keys(_allMarkerIds).length > 0) {
            this.mxcad.regen();
            console.log(`[_addPointMarkers] 已添加 ${_allMarkerIds.length} 个标记`);
        }
    },
    /**
     * 在 CAD 文档坐标处添加标记圆点
     * @param {number} x
     * @param {number} y
     */
    _addImageAt(x, y,type, pointNo) {
        try {
            if (!this.mxDraw) return null;
            let imgUrl = type === '1' ? './image/icon9.svg' : type === '2' ? './image/icon10.svg' : './image/icon9.svg';
            const marker = new MxDbImage();
            marker.setPoint1(new THREE.Vector3(x - 5, y + 5, 0));
            marker.setPoint2(new THREE.Vector3(x + 5, y - 5, 0));
            marker.setImagePath(imgUrl);
            const id = this.mxDraw.addMxEntity(marker);
            marker.userData.pointNo = pointNo;
            marker.userData.type = type;
            return id;
        } catch (e) {
            console.error('[_addImageAt] 失败:', e);
            return null;
        }
    },

    /**
     * 绑定标记图标点击事件，点击后打印点位信息并缩放到对应位置
     */
    /**
     * 绑定标记图标点击事件，点击后打印点位信息并缩放到对应位置
     */
    _bindMarkerClickEvent() {
        try {
            if (!MxFun) return;
            this._windowsEventHandler = (type, event) => {
                // 调试：打印所有事件类型
                console.log('[event]', type, 'button:', event.button, 'ctrl:', event.ctrlKey);
                if (type === 'mousedown') {
                    if (event.ctrlKey && event.button === 0) return 0;
                    try {
                        const mxobj = MxFun.getCurrentDraw();
                        if (!mxobj) return 0;
                        const pt = mxobj.screenCoord2Doc(event.offsetX, event.offsetY);
                        console.log(pt, 4444)
                        if (!pt) return 0;
                        // 方法1：findMxEntityAtPoint
                        const ents = mxobj.findMxEntityAtPoint(pt);
                        const ent = ents && ents.length > 0 ? ents[0] : null;
                        // 方法2：兜底
                        const fallback = this._findMarkerByDistance(mxobj, event.offsetX, event.offsetY);
                        const targetEnt = ent || fallback;
                        if (!targetEnt) return 0;
                        const pointNo = targetEnt.userData && targetEnt.userData.pointNo;
                        if (pointNo === undefined) return 0;
                        const point = this.pointList.find(p => p.pointNo === pointNo);
                        if (point) {
                            console.log('========== 标记图标点击 ==========');
                            console.log('  点位编号:', point.pointNo);
                            console.log('  点位名称:', point.pointName);
                            console.log('  坐标 X:', point.x, 'Y:', point.y);
                            console.log('================================');
                            this.zoomToPoint(point.x, point.y, 3);
                            return 1;
                        }
                    } catch (e) {
                        console.error('[_windowsEventHandler mousedown] 失败:', e);
                    }
                }
                if (type === 'mousemove') {
                    if (this._hoverTimer !== null) return 0;
                    // 立即捕获坐标，避免 20ms 后 event 对象被 SDK 回收
                    const captureX = event.offsetX;
                    const captureY = event.offsetY;
                    const captureClientX = event.clientX;
                    const captureClientY = event.clientY;
                    this._hoverTimer = window.setTimeout(() => {
                        this._hoverTimer = null;
                        console.log('[hover tick]');
                        try {
                            const mxobj = MxFun.getCurrentDraw();
                            if (!mxobj) {
                                this._clearHoverTooltip();
                                return;
                            }
                            const hoverEnt = this._findMarkerByDistance(mxobj, captureX, captureY);
                            console.log('hoverEnt:', hoverEnt);
                            if (hoverEnt) {
                                if (this._lastHoverEnt !== hoverEnt) {
                                    this._clearHoverTooltip();
                                    this._lastHoverEnt = hoverEnt;
                                    const pointNo = hoverEnt.userData.pointNo;
                                    const point = this.pointList.find(p => p.pointNo === pointNo);
                                    if (point) {
                                        this._showHoverTooltip(captureClientX, captureClientY, point.pointName);
                                        hoverEnt.scale = 1.3;
                                        mxobj.updateDisplay();
                                    }
                                }
                            } else {
                                this._clearHoverTooltip();
                            }
                        } catch (err) {
                            console.error('[mousemove hover]', err);
                            this._clearHoverTooltip();
                        }
                    }, 20);
                    return 0;
                }
                return 0;
            };
            MxFun.addWindowsEvent(this._windowsEventHandler);
        } catch (e) {
            console.error('[_bindMarkerClickEvent] 失败:', e);
        }
    },
    _showHoverTooltip(clientX, clientY, text){
    if(!this._tooltipDom){
        this._tooltipDom = document.createElement('div');
        this._tooltipDom.style.position = 'fixed';
        this._tooltipDom.style.background = 'rgba(0,0,0,0.75)';
        this._tooltipDom.style.color = '#fff';
        this._tooltipDom.style.padding = '4px 8px';
        this._tooltipDom.style.borderRadius = '4px';
        this._tooltipDom.style.fontSize = '12px';
        this._tooltipDom.style.pointerEvents = 'none';
        this._tooltipDom.style.zIndex = '99999';
        document.body.appendChild(this._tooltipDom);
    }
    this._tooltipDom.innerText = text;
    // 鼠标右下角偏移，避免遮挡鼠标
    this._tooltipDom.style.left = `${clientX +12}px`;
    this._tooltipDom.style.top = `${clientY +12}px`;
    this._tooltipDom.style.display = 'block';
},

_clearHoverTooltip(){
    if(this._lastHoverEnt){
        // 还原图标缩放
        this._lastHoverEnt.scale = 1;
        const mxobj = MxFun.getCurrentDraw();
        mxobj?.updateDisplay();
        this._lastHoverEnt = null;
    }
    if(this._tooltipDom){
        this._tooltipDom.style.display = 'none';
    }
},

    _findMarkerByDistance(mxobj, screenX, screenY) {
        try {
            if (!mxobj || Object.keys(_allMarkerIds).length === 0) return null;
            let bestEnt = null;
            let bestDist = Infinity;
            const THRESHOLD = 10; // 文档坐标距离阈值
            // 遍历已知标记 ID，用文档坐标直接与点位坐标比较
            Object.values(_allMarkerIds).forEach(id => {
                const ent = mxobj.getMxEntity(id);
                if (!ent || !ent.userData || !ent.userData.pointNo) return;
                const pointNo = ent.userData.pointNo;
                const point = this.pointList.find(p => p.pointNo === pointNo);
                if (!point) return;
                // 与点击位置的文档坐标距离
                 const screenPt = mxobj.cadCoord2View(point.x, point.y, point.z || 0);
                if (!screenPt) return;
       // 与点击位置的像素距离
                const dx = screenPt.x - screenX;
                const dy = screenPt.y - screenY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < THRESHOLD && dist < bestDist) {
                    bestDist = dist;
                    bestEnt = ent;
                }
            });
            return bestEnt;
        } catch (e) {
            console.error('[_findMarkerByDistance] 失败:', e);
            return null;
        }
    },

    _unbindMarkerClickEvent() {
        try {
            if (MxFun && this._windowsEventHandler) {
                MxFun.addWindowsEvent(() => 0); // 注册空事件以覆盖
                this._windowsEventHandler = null;
            }
        } catch (e) {
            console.error('[_unbindMarkerClickEvent] 失败:', e);
        }
    },
    initCtrlPan() {
        const canvas = document.getElementById("mxcad");
        if (!canvas) {
            console.warn("[Ctrl平移] 未找到 canvas 元素");
            return;
        }

        console.log("[Ctrl平移] 初始化 Ctrl + 左键平移（事件模拟方式）");

        // 使用捕获阶段监听，这样可以在 mxdraw 处理之前拦截事件
        canvas.addEventListener("mousedown", this.handleCtrlPanMouseDown, true);
        canvas.addEventListener("mousemove", this.handleCtrlPanMouseMove, true);
        canvas.addEventListener("mouseup", this.handleCtrlPanMouseUp, true);
        canvas.addEventListener("mouseleave", this.handleCtrlPanMouseUp, true);
    },
    /**
     * Ctrl + 左键平移 - 鼠标按下
     */
    handleCtrlPanMouseDown(e) {
        // 只处理 Ctrl + 左键
        if (!e.ctrlKey || e.button !== 0) {
            return;
        }

        // 如果正在执行命令，不处理平移
        if (this.currentCommand) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        console.log("[Ctrl平移] 模拟中键按下");

        // 模拟中键按下事件
        this.simulateMiddleButtonEvent(e, "mousedown");

        // 改变光标样式
        const canvas = document.getElementById("mxcad");
        if (canvas) {
            canvas.style.cursor = "grabbing";
        }
    },

    /**
     * Ctrl + 左键平移 - 鼠标移动
     */
    handleCtrlPanMouseMove(e) {
        // 只处理 Ctrl + 左键按下的情况
        if (!e.ctrlKey || e.buttons !== 1) {
            return;
        }

        // 如果正在执行命令，不处理平移
        if (this.currentCommand) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // 模拟中键移动事件
        this.simulateMiddleButtonEvent(e, "mousemove");
    },

    /**
     * Ctrl + 左键平移 - 鼠标释放
     */
    handleCtrlPanMouseUp(e) {
        // 只处理 Ctrl + 左键释放的情况
        if (!e.ctrlKey || e.button !== 0) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        console.log("[Ctrl平移] 模拟中键释放");

        // 模拟中键释放事件
        this.simulateMiddleButtonEvent(e, "mouseup");

        // 恢复光标样式
        const canvas = document.getElementById("mxcad");
        if (canvas) {
            canvas.style.cursor = "";
        }
    }
  },
}
