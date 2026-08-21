import chooseDialog from '../dialog/chooseDialog'
import ViewerPanel from '../components/ViewerPanel/ViewerPanel.vue';
import ViewerPanel1 from '../components/ViewerPanel/ViewerPanel1.vue';
import { createMxCad, MxCpp, McDbPoint, MxCADUtility, McDbBlockReference } from "mxcad";
import { MxFun, MrxDbgUiPrPoint, McEdGetPointWorldDrawObject,  MxDbLine, MxDbCircleShape, MxDbAnyLine } from "mxdraw";
import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
import { MyRect } from "@/test/DrawRect";
import * as THREE from "three";
export default {
  data() {
    return {
        steps: [
            { title: "选择图纸",},
            { title: "图纸解析",},
            { title: "点位绑定",},
            { title: "发布应用", },
        ],
        currentStep: 0,
        stepInfo: ['待解析', '待绑定', '待发布', '发布'],
        pointList: [],
        layers: [],
        panelCollapsed: true,
        panelCollapsed1: true,
        fileUrlInput: "./models/HDMY-XJH.mxweb",
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
  components: {
    ViewerPanel,
    ViewerPanel1
  },
  mounted() {
    // 监听 Ctrl + 左键平移
    this.$nextTick(() => {
      this.initCtrlPan();
    });
  },
  beforeDestroy() {
    // 移除 Ctrl + 左键平移事件监听
    const canvas = document.getElementById("mxcad");
    if (canvas) {
      canvas.removeEventListener("mousedown", this.handleCtrlPanMouseDown);
      canvas.removeEventListener("mousemove", this.handleCtrlPanMouseMove);
      canvas.removeEventListener("mouseup", this.handleCtrlPanMouseUp);
      canvas.removeEventListener("mouseleave", this.handleCtrlPanMouseUp);
    }
  },
  methods: {
    onStep(index) {
        this.currentStep = index
        if (!this.mxcad) {
            this.initViewer()
        }
    },
    onChoose() {
        this.$Dialog.getInstance().title('选择图纸')
        .config({
            width: 800,
            height: 'auto',
            top: 40
        })
        .open(chooseDialog, d => {
            if (d) {
                this.entity.id = d.id
                this.entity.code = d.code
                this.entity.version = d.version
                this.entity.user = d.user
                this.entity.date = d.date
            }
        })
    },
    async initViewer() {
        try {
        this.loading = true;
        this.loadingText = "正在初始化查看器...";
        this.loadingStep = "加载核心模块";
        this.loadingProgress = 10;

        // 注册所有命令和自定义实体
        console.log("注册命令和自定义实体...");
        RegistMxCommands();
        RxInitMxEntity();

        const useST = !("SharedArrayBuffer" in window);
        const wasmPath = useST ? "./wasm/2d-st/" : "./wasm/2d/";

        console.log("WASM 路径:", wasmPath);

        this.loadingStep = "初始化 WASM 模块";
        this.loadingProgress = 30;

        const mxcad = await createMxCad({
            canvas: "#mxcad",
            locateFile: (fileName) => {
            return new URL(wasmPath + fileName, window.location.origin + window.location.pathname).href;
            },
            // fileUrl: "./models/HDMY-XJH.mxweb",
            // fileUrl:"./models/HDMY-XJH-v2.mxweb",
            // fileUrl:"./models/YTSF-001.mxweb",
            fileUrl: this.fileUrlInput,
            browse: true,
            multipleSelect: false,
            middlePan: 1,
            authorized_service: "same_current_page_url",
            // 注册码（从 mxdraw.com 获取）
            // registdata: "你的注册码",
            onInit: () => {
            console.log("MxCAD 初始化回调，加载字体...");
            try {
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
            this.onFileLoaded();
        });

        // 监听图层数据更新
        mxcad.mxdraw.on("uiSetLayerData", (listLayer) => {
            console.log("图层数据更新:", listLayer);
            this.layers = listLayer.map(v => ({
            name: v.name,
            id: v.id,
            off: v.off,
            colorValue: v.colorValue
            }));
            this.layerCount = this.layers.length;
        });

        // 监听命令行输入
        MxFun.listenForCommandLineInput((msg) => {
            // 如果有测量结果，更新显示
            if (msg.msCmdDisplay && msg.msCmdDisplay.length > 0) {
            this.measureResult = msg.msCmdDisplay;
            }
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
    },
    /**
   * 文件加载完成回调
   */
    onFileLoaded() {
        console.log("文件加载完成");
        
        // 从 fileUrl 中提取文件名
        const fileName = this.fileUrl ? this.fileUrl.split('/').pop() : "default";
        console.log("当前文件名:", fileName);
        
        // 检查 localStorage 中有没有保存的视图参数
        const savedView = localStorage.getItem("cad_view_" + fileName);
        
        if (savedView) {
        // 有保存的视图参数，应用保存的视图
        console.log("找到保存的视图参数，应用中...");
        try {
            const viewParams = JSON.parse(savedView);
            console.log("视图参数:", viewParams);
            
            if (this.mxcad && this.mxcad.zoomCenter && this.mxcad.zoomScale && this.mxcad.getViewCADCoord) {
            // 先获取当前视图宽度
            const currentView = this.mxcad.getViewCADCoord();
            if (currentView && currentView.pt1 && currentView.pt2) {
                const curMinX = Math.min(currentView.pt1.x, currentView.pt2.x, currentView.pt3.x, currentView.pt4.x);
                const curMaxX = Math.max(currentView.pt1.x, currentView.pt2.x, currentView.pt3.x, currentView.pt4.x);
                const curWidth = curMaxX - curMinX;
                const targetWidth = viewParams.width;
                const scale = curWidth / targetWidth;
                
                console.log("当前宽度:", curWidth, "目标宽度:", targetWidth, "缩放比例:", scale);
                
                // 先设置中心点
                this.mxcad.zoomCenter(viewParams.centerX, viewParams.centerY);
                
                // 再缩放
                this.mxcad.zoomScale(scale);
                
                console.log("已应用保存的视图参数（zoomCenter + zoomScale 方式）");
                
                // 延迟隐藏加载遮罩
                setTimeout(() => {
                this.loading = false;
                }, 300);
            } else {
                console.warn("无法获取当前视图宽度，直接显示初始视图");
                this.loading = false;
            }
            } else {
            console.warn("zoomCenter 或 zoomScale 不存在，直接显示初始视图");
            this.loading = false;
            }
        } catch (e) {
            console.error("应用保存的视图参数失败:", e);
            this.loading = false;
        }
        } else {
        // 没有保存的视图参数，直接显示初始视图
        console.log("没有保存的视图参数，显示初始视图");
        console.log("提示：您可以手动调整视图后，点击\"保存当前视图\"按钮，下次打开自动恢复");
        this.loading = false;
        }
        
        // 获取当前视图范围
        try {
        if (this.mxcad && this.mxcad.getViewCADCoord) {
            const view = this.mxcad.getViewCADCoord();
            console.log("当前视图范围:", view);
            if (view && view.pt1 && view.pt2) {
            const minX = Math.min(view.pt1.x, view.pt2.x, view.pt3.x, view.pt4.x);
            const maxX = Math.max(view.pt1.x, view.pt2.x, view.pt3.x, view.pt4.x);
            const minY = Math.min(view.pt1.y, view.pt2.y, view.pt3.y, view.pt4.y);
            const maxY = Math.max(view.pt1.y, view.pt2.y, view.pt3.y, view.pt4.y);
            console.log("当前视图范围（计算后）:", {
                minX, minY, maxX, maxY,
                width: maxX - minX,
                height: maxY - minY
            });
            }
        }
        } catch (e) {
        console.warn("获取视图范围失败:", e);
        }
        
        // 主动获取图层数据（防止 uiSetLayerData 事件未触发）
        try {
        if (this.mxcad && this.mxcad.getDatabase) {
            const layerTable = this.mxcad.getDatabase().getLayerTable();
            const aryId = layerTable.getAllRecordId();
            console.log("主动获取图层数量:", aryId.length);
            
            if (aryId.length > 0 && this.layers.length === 0) {
            this.layers = aryId.map((id) => {
                const record = id.getMcDbLayerTableRecord();
                if (record) {
                let colorValue = 0;
                try {
                    if (record.color && record.color.getColorValue) {
                    colorValue = record.color.getColorValue();
                    }
                } catch (e) {}
                
                return {
                    name: record.name,
                    id: id,
                    off: record.isOff,
                    colorValue: colorValue
                };
                }
                return {
                name: "未知图层",
                id: id,
                off: false,
                colorValue: 0
                };
            });
            this.layerCount = this.layers.length;
            console.log("主动获取图层数据成功，图层数量:", this.layerCount);
            console.log("图层列表:", this.layers.map((l) => l.name));
            }
        }
        } catch (e) {
        console.warn("主动获取图层数据失败:", e);
        }
        // 收集点位数据
        const allPointEntities = this.getAllMcDbPoint();
        this.pointList = allPointEntities;
    },

    /**
     * 获取所有 POINT 实体（含块引用）
     */
    getAllMcDbPoint() {
        const cadApp = MxCpp.getCurrentMxCAD();
        if (!cadApp) {
        console.warn("CAD实例未初始化");
        return [];
        }

        const db = cadApp.getDatabase();
        const currentSpace = db.currentSpace;
        if (!currentSpace) return [];

        const entityIds = currentSpace.getAllEntityId();
        const result = [];

        for (const id of entityIds) {
        if (!id.isValid()) continue;

        // 检查是否为 POINT 实体
        const isPoint = id.isKindOf && id.isKindOf('McDbPoint');
        // 检查是否为块引用（块引用也可以视为点位）
        const isBlockRef = id.isKindOf && id.isKindOf('McDbBlockReference');

        if (!isBlockRef) continue;

        const ent = id.getMcDbEntity();
        const pos = ent.position;
        if (!pos) continue;

        result.push({
            x: pos.x,
            y: pos.y,
            z: pos.z,
            handle: ent.getHandle ? ent.getHandle() : '',
            layer: ent.layer || '',
            entity: ent,
            objectId: id
        });
        }

        console.log(`共找到 ${result.length} 个点位`);
        return result;
    },

    // ============== Ctrl+左键平移 ==============

    /**
     * 初始化 Ctrl + 左键平移
     */
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
     * 模拟中键事件
     */
    simulateMiddleButtonEvent(e, type) {
        // 创建一个新的鼠标事件，把 button 改成 1（中键）
        const simulatedEvent = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1,
            screenX: e.screenX,
            screenY: e.screenY,
            clientX: e.clientX,
            clientY: e.clientY,
            ctrlKey: false,  // 去掉 ctrlKey，避免 mxdraw 有特殊处理
            altKey: false,
            shiftKey: false,
            metaKey: false,
            button: 1,  // 中键
            buttons: 4,  // 中键按下的状态
            relatedTarget: e.relatedTarget
        });

        // 在 canvas 上派发模拟的事件
        const canvas = document.getElementById("mxcad");
        if (canvas) {
            canvas.dispatchEvent(simulatedEvent);
        }
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
  }
}
