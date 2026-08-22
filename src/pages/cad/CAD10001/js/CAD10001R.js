import chooseDialog from '../dialog/chooseDialog'
import ViewerPanel from '../components/ViewerPanel/ViewerPanel.vue';
import ViewerPanel1 from '../components/ViewerPanel/ViewerPanel1.vue';
import { createMxCad, MxCpp, McDbCircle, McGePoint3d, McCmColor, McDbXData, McDbPoint, MxCADUtility, McDbBlockReference } from "mxcad";
import { MxFun, MrxDbgUiPrPoint, MrxDbgUtils, McEdGetPointWorldDrawObject,  MxDbLine, MxDbCircleShape, MxDbAnyLine, MxDbImage } from "mxdraw";
import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
import { MyRect } from "@/test/DrawRect";
import * as THREE from "three";
import { mapState } from 'vuex'
let _allMarkerIds = {}
let rafPending = false
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
        stepInfo: {
            '01': '待解析',
            '02': '待绑定',
            '03': '待发布',
            '04': '发布'
        },
        pointList: [],
        layers: [],
        panelCollapsed: true,
        panelCollapsed1: true,
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

        // 点位绑定模式
        matchMode: null, // 'manual-match' | 'manual-place' | null
        selectedSurveyPoint: null,
        manPlacePendingId: null,
        highlightEntIds: [],
        // 人工布点弹窗
        manualPlaceVisible: false,
        manualPlaceHasCoordFill: false,
        manPlacePendingX: null,
        manPlacePendingY: null,

        // 表单数据
        entity: {
            "TZPZ_ID": "",
            "TZXX_NO": "",
            "TZPZ_USR": "11",
            "TZPZ_DAT": "2026-11-02",
            "TZPZ_STA": "04",
            "resourceUrl": "",
            "TZXX_ID": "",
            "TZ_VERSION": "",
            TZPZ_NO: ""
        },
    }
  },
  components: {
    ViewerPanel,
    ViewerPanel1
  },
  mounted() {
    // _bindMarkerClickEvent 在 initViewer 内部调用（mxdraw 就绪后）
  },
  computed:{
    ...mapState(['points', 'tzInfo', 'tzPoints'])
  },
  watch: {
    '$store.state.tzInfo': {
        handler(val) {
            this.entity.TZLX_ID = val.TZLX_ID
            this.entity.resourceUrl = val.resourceUrl
            this.entity.TZXX_NO = val.TZXX_NO
            this.entity.TZ_VERSION = val.TZ_VERSION
        },
        immediate: true
    },
    '$store.state.tzPoints': {
        handler(val) {
            this.pointList = val.map(item => {
                item.pointName = item.POINT_NAM
                item.pointNo = item.POINT_ID
                item.x = item.X_VALUE
                item.y = item.Y_VALUE
                return item
            })
        },
        immediate: true
    },
    '$store.state.tzpzInfo': {
        handler(val) {
            this.entity.TZPZ_NO = val.TZPZ_NO
        },
        immediate: true,
        deep: true
    }
  },
  beforeDestroy() {
    this._unbindMarkerClickEvent();
    this._clearHighlights();
    this.matchMode = null;
    this.selectedSurveyPoint = null;
    this.manualPlaceVisible = false;
    this.manualPlaceHasCoordFill = false;
  },
  methods: {
    async postData(url = "", data = {}) {
        const response = await fetch(url, {
            method: "POST",
            
            body: JSON.stringify(data),
        });
        return response.json();
    },
    selectTz() {
        if (parent && parent.getTz) {
            parent.getTz()
        }
    },
    stopVersion() {
        this.$Modal.confirm({
            title: '提示',
            content: '停用后前台将无法展示，确定停用吗？停用后，页面跳转至点位绑定页面',
            onOk: () => {

            }
        })
    },
    setDefault() {

    },
    save() {
        if (this.currentStep === 0) {
            this.$refs.sForm.validate((valid) => {
                if (!valid) {
                    this.$Message.error('请填写信息后再保存')
                    return
                }
                this.postData('/api/scaqyzt/upsertTzpp', {
                    "TZPZ_ID": this.entity.TZPZ_ID,
                    "TZXX_NO": this.entity.TZXX_NO,
                    "TZPZ_USR": this.entity.TZPZ_USR,
                    "TZPZ_DAT": this.entity.TZPZ_DAT,
                    "TZPZ_STA": this.entity.TZPZ_STA,
                    "TZPZ_NO": this.entity.TZPZ_NO
                }).then(data => {
                    this.entity.TZPZ_NO = data.data
                })
                // if (parent && parent.upsertTzpp) {
                //     parent.upsertTzpp({
                //         "TZPZ_ID": this.entity.TZPZ_ID,
                //         "TZXX_NO": this.entity.TZXX_NO,
                //         "TZPZ_USR": this.entity.TZPZ_USR,
                //         "TZPZ_DAT": this.entity.TZPZ_DAT,
                //         "TZPZ_STA": this.entity.TZPZ_STA,
                //         "TZPZ_NO": this.entity.TZPZ_NO
                //     })
                // }
            })
        }
    },
    upsertPoint(points) {
        if (parent && parent.upsertPoint) {
            parent.upsertPoint({
                TZPZ_NO: this.entity.TZPZ_NO,
                data: points.map(item => {
                    return {
                        "POINT_ID": item.pointNo,
                        "POINT_NAM": item.pointName,
                        "X_VALUE": item.x,
                        "Y_VALUE": item.y,
                        "LAYER_ID": item.LAYER_ID,
                        "LAYER_NAM": item.LAYER_NAM,
                    }
                })
            })
        }
        this.postData('/api/scaqyzt/upsertTzpp', {
            TZPZ_NO: this.entity.TZPZ_NO,
                data: points.map(item => {
                    return {
                        "POINT_ID": item.pointNo,
                        "POINT_NAM": item.pointName,
                        "X_VALUE": item.x,
                        "Y_VALUE": item.y,
                        "LAYER_ID": item.LAYER_ID,
                        "LAYER_NAM": item.LAYER_NAM,
                    }
                })
        }).then(data => {
            this.entity.TZPZ_NO = data.data
        })
    },
    getCePoint() {

    },
    onStep(index) {
        if (this.currentStep > index) {
            this.currentStep = index
            return
        }
        if (index > 2) {
            if (this.entity.TZPZ_STA !== '04') {
                this.$Message.error('请完成点位绑定并执行发布后再进行下一步操作')
                return
            }
            this.currentStep = index
        } else if (index > 1) {
            if (this.entity.TZPZ_STA === '01' || !this.entity.TZPZ_STA) {
                this.$Message.error('请解析图纸完后再进行下一步操作')
                return
            }
            this.currentStep = index
        } else if (index > 0) {
            this.$refs.sForm.validate((valid) => {
                if (!valid) {
                    this.$Message.error('请填写信息保存后再进行下一步操作')
                    return
                }
                if (index === 0) {
                    this.save()
                }
                this.currentStep = index
                if (index > 0) {
                    if (!this.mxcad) {
                        this.initViewer()
                        this.$nextTick(() => {
                            this.initCtrlPan();
                        });
                    }
                }
                
            })
        }  else {
            this.currentStep = index
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
        this.mxcad = mxcad;
        this.mxDraw = mxcad.mxdraw;
        this.fileUrl = this.fileUrlInput; // 记录当前文件URL

        // 设置浅灰色背景（使用稍深的灰色避免触发SDK自动反色）
        mxcad.setViewBackgroundColor(255, 255, 255);

        // 启用鼠标中键平移（我们会把 Ctrl + 左键模拟成中键事件）
        try {
            mxcad.mxdraw.setMouseMiddlePan(true);
        } catch (e) {
            console.warn("设置中键平移失败:", e);
        }
        
        // 设置滚轮缩放速度（数值越小缩放越慢）
        try {
            mxcad.mxdraw.setZoomSpeed(1.8);
        } catch (e) {
            console.warn("设置缩放速度失败:", e);
        }

        // 二次注册命令（mxcad 实例创建后可能会重置 MxFun 状态）
        RegistMxCommands();
        RxInitMxEntity();

        this.loadingStep = "初始化完成";
        this.loadingProgress = 90;

        // 监听文件加载完成
        mxcad.mxdraw.on("openFileComplete", () => {
            this.onFileLoaded();
        });

        // mxcad.mxdraw.on("viewchange", () => {
        //     if (rafPending) return
        //     rafPending = true

        //     requestAnimationFrame(() => {
        //         if (this.pointList.length) {
        //             this.pointList.forEach(point => {
        //                 const screen = this.dwgToDomPoint(point)
        //                 this.$set(point, 'screenX', screen.x)
        //                 this.$set(point, 'screenY', screen.y)
        //             })
        //             console.log(this.pointList, 1111)
        //         }

        //         rafPending = false // 释放锁，允许下一帧调度
        //     })
        // })


        // 监听图层数据更新
        mxcad.mxdraw.on("uiSetLayerData", (listLayer) => {
            console.log("图层数据更新:", listLayer);
            this.layers = listLayer.map(v => {
                return {
                    name: v.name,
                    id: v.id,
                    LAYER_ID: v.getHandle() || '',
                    off: v.off,
                    colorValue: v.colorValue,
                }
            });
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
        this._bindMarkerClickEvent();
    },
    /**
   * 文件加载完成回调
   */
  
    onFileLoaded() {
        
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
        
        // 主动获取图层数据，用 getAllRecordId() 拿到正确的 mxcad ID 对象
        try {
        if (this.mxcad && this.mxcad.getDatabase) {
            const layerTable = this.mxcad.getDatabase().getLayerTable();
            const aryId = layerTable.getAllRecordId();
            console.log("主动获取图层数量:", aryId.length);

            if (aryId.length > 0) {
            // 构建 name -> 当前 off 状态的映射（保留事件中用户已有的操作）
            const offMap = {};
            this.layers.forEach(l => { offMap[l.name] = l.off; });
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
                    LAYER_ID: record.getHandle(),
                    id: id,  // 正确的 mxcad ID 对象
                    off: offMap[record.name] !== undefined ? offMap[record.name] : record.isOff,
                    colorValue: colorValue
                };
                }
                return {
                name: "未知图层",
                id: id,
                LAYER_ID: '',
                off: false,
                colorValue: 0
                };
            });
            this.layerCount = this.layers.length;
            if (this.entity.TZPZ_STA === '01') {
                if (parent && parent.upsertLayer) {
                    parent.upsertLayer({
                        TZPZ_NO: this.entity.TZPZ_NO,
                        data: this.layers.map(item => {
                            return {
                                "LAYER_ID": item.LAYER_ID,
                                "LAYER_NAM": item.name
                            }
                            
                        })
                    })
                }
            }
            }
        }
        } catch (e) {
        console.warn("主动获取图层数据失败:", e);
        }
        // 收集点位数据
        if (this.entity.TZPZ_STA === '01') {
            const allPointEntities = this.getAllMcDbPoint();
            this.upsertPoint(allPointEntities)
        }
        if (this.pointList.length) {
            this._addPointMarkers();
        }
    },

    /**
     * 切换图层显示/隐藏
     */
    onToggleLayer(seq, visible) {
        try {
            // ViewerPanel 发出的是 1-based 序号，转为 0-based 索引
            const index = seq - 1;
            let layer = this.layers[index];
            const record = layer.id.getMcDbLayerTableRecord();
            if (record) {
                // 设置图层是否关闭
                record.isOff = !visible;
                // 更新图层状态
                layer.off = !visible;
                console.log("切换图层:", layer.name, "显示:", visible);
                
                // 更新图层显示状态（关键！）
                if (this.mxcad.updateLayerDisplayStatus) {
                this.mxcad.updateLayerDisplayStatus();
                }
                
                // 触发重绘
                if (this.mxcad.updateDisplay) {
                this.mxcad.updateDisplay();
                } else if (MxFun && MxFun.updateDisplay) {
                MxFun.updateDisplay();
                }
            }
        } catch (e) {
            console.error("切换图层失败:", e);
        }
    },

    /**
     * 缩放视图到指定坐标点
     * @param {number} x - CAD 文档坐标 X
     * @param {number} y - CAD 文档坐标 Y
     * @param {number} zoomFactor - 放大倍数，默认 3
     */
    zoomToPoint(x, y, zoomFactor = 3) {
        if (!x || !y) {
            return
        }
        try {
            if (!this.mxcad || !this.mxcad.zoomCenter || !this.mxcad.zoomScale) return;
            this.mxcad.zoomCenter(x, y);
            this.mxcad.zoomScale(zoomFactor);
            console.log(`[zoomToPoint] 定位到 (${x}, ${y}) scale=${zoomFactor}`);
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
        if (!this.mxDraw || !this.pointList || this.pointList.length === 0) return;
        this.pointList.forEach((point) => {
            // 避免同一个点多次添加
            if (_allMarkerIds[point.pointNo]) {
                return
            }
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
     * 删除指定点位的标记
     * @param {Array} points - 要删除标记的点位对象数组
     */
    _deletePointMarkers(points) {
        if (!this.mxDraw || !points) return;
        points.forEach(point => {
            if (point.markerIds && point.markerIds.length > 0) {
                point.markerIds.forEach(id => {
                    if (id >= 0) this.mxDraw.eraseMxEntity(id);
                });
                point.markerIds = [];
            }
        });
        
        this.mxcad.regen();
    },

    /**
     * 删除指定点位及其标记圆点
     * @param {Array} points - 要删除的点位对象数组
     */
    onDeletePoints(points) {
        if (!points || points.length === 0) {
            this.$Message.warning('请先选择测点');
            return;
        };
        if (points.some(item => item.MATCH_STA === '匹配')) {
            this.$Message.warning('只能选择未匹配的测点');
            return;
        }
        this.$Modal.confirm({
            title: '提示',
            content: '确定要删除所选测点嘛？',
            onOk: () => {
                if (parent && parent.deleteIot) {
                    parent.deleteIot({
                        TZPZ_NO: this.entity.TZPZ_NO,
                        I2P_NOs: points.map(item => item.I2P_NO)
                    })
                }
            }
        })
    },

    /**
     * 在 CAD 文档坐标处添加标记圆点
     * @param {number} x
     * @param {number} y
     */
    _addImageAt(x, y,type, pointNo) {
        try {
            if (!this.mxDraw) return null;
            let imgUrl = type === '1' ? './image/icon9.svg' : type === '2' ? './image/icon10.svg' : './image/icon10.svg';
            const marker = new MxDbImage();
            marker.setPoint1(new THREE.Vector3(x - 5, y + 5, 0));
            marker.setPoint2(new THREE.Vector3(x + 5, y - 5, 0));
            marker.setImagePath(imgUrl);
            const id = this.mxDraw.addMxEntity(marker);
            marker.userData.pointNo = pointNo;
            marker.userData.type = type;
            this.zoomToPoint(x, y)
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
        const mxobj = MxFun.getCurrentDraw();
        if (!mxobj) return;
        const canvas = mxobj.getCanvas();
        if (!canvas) return;

        // 保存回调引用，组件销毁用来解绑
        this._onCanvasMouseDown = (event) => {
            console.log('[canvas mousedown] button:', event.button, 'ctrl:', event.ctrlKey);
            if (event.ctrlKey && event.button === 0) return;

            // 👉event 是canvas原生MouseEvent
            // clientX/clientY：浏览器全局坐标
            // offsetX / offsetY：**相对于canvas内部像素坐标（原生canvas事件下才可靠）**

            // 人工布点模式
            if (this.matchMode === 'manual-place-pick' && this.selectedSurveyPoint) {
                return this._handleManualPlaceCanvasClick(event);
            }
            if (this.matchMode === 'manual-match' && this.selectedSurveyPoint) {
                return this._handleManualMatchCanvasClick(event);
            }
            if (this.matchMode === 'manual-place' && this.selectedSurveyPoint) {
                return this._handleManualPlaceCanvasClick(event);
            }
            try {
                // screenCoord2Doc 入参 clientX/clientY
                const pt = mxobj.screenCoord2Doc(event.clientX, event.clientY);
                if (!pt) return;

                const ent = ents && ents.length > 0 ? ents[0] : null;
                // 兜底拾取，原生canvas事件 event.offsetX/event.offsetY 是可靠的
                const fallback = this._findMarkerByDistance(mxobj, event.offsetX, event.offsetY);
                const targetEnt = ent || fallback;

                if (!targetEnt) return;
                const pointNo = targetEnt.userData && targetEnt.userData.pointNo;
                if (pointNo === undefined) return;
                const point = this.pointList.find(p => p.pointNo === pointNo);
                // if (point) {
                //     console.log('标记图标点击', point);
                //     this.zoomToPoint(point.x, point.y, 3);
                // }
            } catch (e) {
                console.error('[canvas mousedown]', e);
            }
        };

        // canvas mousemove，原生绑定，仅画布触发
        this._onCanvasMouseMove = (event) => {
            if (this._hoverTimer !== null) return;
            // 捕获坐标，防止event复用
            const captureX = event.offsetX;
            const captureY = event.offsetY;
            const captureClientX = event.clientX;
            const captureClientY = event.clientY;

            this._hoverTimer = window.setTimeout(() => {
                this._hoverTimer = null;
                try {
                    const mxobj = MxFun.getCurrentDraw();
                    if (!mxobj) {
                        this._clearHoverTooltip();
                        return;
                    }
                    const hoverEnt = this._findMarkerByDistance(mxobj, captureX, captureY);
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
                    console.error('[canvas mousemove]', err);
                    this._clearHoverTooltip();
                }
            }, 20);
        };

        // ✅直接绑定canvas DOM，不再走MxFun.addWindowsEvent全局事件
        canvas.addEventListener('mousedown', this._onCanvasMouseDown);
        canvas.addEventListener('mousemove', this._onCanvasMouseMove);

    } catch (e) {
        console.error('[_bindMarkerClickEvent] 失败:', e);
    }
},
    // _bindMarkerClickEvent() {
    //     try {
    //         if (!MxFun) return;
    //         this._windowsEventHandler = (type, event) => {
    //             // 调试：打印所有事件类型
    //             console.log('[event]', type, 'button:', event.button, 'ctrl:', event.ctrlKey);
    //             if (type === 'mousedown') {
    //                 if (event.ctrlKey && event.button === 0) return 0;

    //                 // 人工布点模式（从弹窗进入拾取）
    //                 if (this.matchMode === 'manual-place-pick' && this.selectedSurveyPoint) {
    //                     return this._handleManualPlaceCanvasClick(event);
    //                 }

    //                 // 人工匹配模式：已选中测点，本次点击是选择图纸点位
    //                 if (this.matchMode === 'manual-match' && this.selectedSurveyPoint) {
    //                     return this._handleManualMatchCanvasClick(event);
    //                 }
    //                 // 人工布点模式：本次点击是选择布点位置
    //                 if (this.matchMode === 'manual-place' && this.selectedSurveyPoint) {
    //                     return this._handleManualPlaceCanvasClick(event);
    //                 }

    //                 try {
    //                     const mxobj = MxFun.getCurrentDraw();
    //                     if (!mxobj) return 0;
    //                     const pt = mxobj.screenCoord2Doc(event.offsetX, event.offsetY);
    //                     console.log(pt, 4444)
    //                     if (!pt) return 0;
    //                     // 方法1：findMxEntityAtPoint
    //                     const ents = mxobj.findMxEntityAtPoint(pt);
    //                     const ent = ents && ents.length > 0 ? ents[0] : null;
    //                     // 方法2：兜底
    //                     const fallback = this._findMarkerByDistance(mxobj, event.offsetX, event.offsetY);
    //                     const targetEnt = ent || fallback;
    //                     if (!targetEnt) return 0;
    //                     const pointNo = targetEnt.userData && targetEnt.userData.pointNo;
    //                     if (pointNo === undefined) return 0;
    //                     const point = this.pointList.find(p => p.pointNo === pointNo);
    //                     if (point) {
    //                         console.log('========== 标记图标点击 ==========');
    //                         console.log('  点位编号:', point.pointNo);
    //                         console.log('  点位名称:', point.pointName);
    //                         console.log('  坐标 X:', point.x, 'Y:', point.y);
    //                         console.log('================================');
    //                         this.zoomToPoint(point.x, point.y, 3);
    //                         return 1;
    //                     }
    //                 } catch (e) {
    //                     console.error('[_windowsEventHandler mousedown] 失败:', e);
    //                 }
    //             }
    //             if (type === 'mousemove') {
    //                 if (this._hoverTimer !== null) return 0;
    //                 // 立即捕获坐标，避免 20ms 后 event 对象被 SDK 回收
    //                 const captureX = event.offsetX;
    //                 const captureY = event.offsetY;
    //                 const captureClientX = event.clientX;
    //                 const captureClientY = event.clientY;
    //                 this._hoverTimer = window.setTimeout(() => {
    //                     this._hoverTimer = null;
    //                     console.log('[hover tick]');
    //                     try {
    //                         const mxobj = MxFun.getCurrentDraw();
    //                         if (!mxobj) {
    //                             this._clearHoverTooltip();
    //                             return;
    //                         }
    //                         const hoverEnt = this._findMarkerByDistance(mxobj, captureX, captureY);
    //                         console.log('hoverEnt:', hoverEnt);
    //                         if (hoverEnt) {
    //                             if (this._lastHoverEnt !== hoverEnt) {
    //                                 this._clearHoverTooltip();
    //                                 this._lastHoverEnt = hoverEnt;
    //                                 const pointNo = hoverEnt.userData.pointNo;
    //                                 const point = this.pointList.find(p => p.pointNo === pointNo);
    //                                 if (point) {
    //                                     this._showHoverTooltip(captureClientX, captureClientY, point.pointName);
    //                                     hoverEnt.scale = 1.3;
    //                                     mxobj.updateDisplay();
    //                                 }
    //                             }
    //                         } else {
    //                             this._clearHoverTooltip();
    //                         }
    //                     } catch (err) {
    //                         console.error('[mousemove hover]', err);
    //                         this._clearHoverTooltip();
    //                     }
    //                 }, 20);
    //                 return 0;
    //             }
    //             return 0;
    //         };
    //         MxFun.addWindowsEvent(this._windowsEventHandler);
    //     } catch (e) {
    //         console.error('[_bindMarkerClickEvent] 失败:', e);
    //     }
    // },
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
            const THRESHOLD = 20; // 文档坐标距离阈值
            Object.values(_allMarkerIds).forEach(id => {
                const ent = mxobj.getMxEntity(id);
                if (!ent || !ent.userData || !ent.userData.pointNo) return;
                const pointNo = ent.userData.pointNo;
                const point = this.pointList.find(p => p.pointNo === pointNo);
                if (!point) return;
                // 与点击位置的文档坐标距离
                 const screenPt = mxobj.cadCoord2View(point.x, point.y, point.z || 0);
                 console.log(screenPt, 1111)
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
    screenCoord2Cad(x, y) {
        const mxobj = MxFun.getCurrentDraw();
        if (mxobj) {
            const docPt = mxobj.screenCoord2Doc(x, y);
            const cadPt = MxFun.docCoord2Cad(docPt.x, docPt.y, 0);
            return [cadPt.x, cadPt.y];
        }
        return null
    },
    _unbindMarkerClickEvent() {
        try {
            const mxobj = MxFun.getCurrentDraw();
            if (!mxobj) return;
            const canvas = mxobj.getCanvas();
            if (!canvas) return;

            canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
            canvas.removeEventListener('mousemove', this._onCanvasMouseMove);

            if (this._hoverTimer) {
                clearTimeout(this._hoverTimer);
                this._hoverTimer = null;
            }
            this._clearHoverTooltip();
            this._onCanvasMouseDown = null;
            this._onCanvasMouseMove = null;
        } catch (e) {
            // SDK 已销毁，跳过清理
        }
    },
    dwgToDomPoint(dwgPt) {
        const mxDraw = MxFun.getCurrentDraw();
        if (!mxDraw) return null;
        const docPt = MxFun.cadCoord2Doc(dwgPt.x, dwgPt.y, 0); // CAD → 文档坐标
        const screen = MxFun.docCoord2Screen(docPt.x, docPt.y, 0);
        const canvas = this.mxDraw.getCanvas();
        return {
            x: screen.x + canvas.offsetLeft,
            y: screen.y + canvas.offsetTop
        };
    },
    // _unbindMarkerClickEvent() {
    //     try {
    //         if (MxFun && this._windowsEventHandler) {
    //             MxFun.addWindowsEvent(() => 0); // 注册空事件以覆盖
    //             this._windowsEventHandler = null;
    //         }
    //     } catch (e) {
    //         console.error('[_unbindMarkerClickEvent] 失败:', e);
    //     }
    // },

    // ============== 坐标解析 ==============
    _parseSurveyCoord(survey) {
        
        if (survey.PT_X_VALUE && survey.PT_Y_VALUE) return [parseFloat(survey.PT_X_VALUE), parseFloat(survey.PT_Y_VALUE)];
        return null;
    },

    // ============== 面板控制 ==============
    /**
     * 隐藏 ViewerPanel1，展开画布区域用于选点操作
     */
    _hidePanel1() {
        this.panelCollapsed1 = true;
    },
    /**
     * 恢复 ViewerPanel1 显示
     */
    _showPanel1() {
        this.panelCollapsed1 = false;
    },

    // ============== 高亮辅助 ==============
    _clearHighlights() {
        this.highlightEntIds.forEach(id => {
            try { this.mxDraw.eraseMxEntity(id); } catch (e) {}
        });
        this.highlightEntIds = [];
        if (this.mxDraw) this.mxDraw.updateDisplay();
    },

    /**
     * 在图纸上高亮未匹配的点位（放大标记）
     */
    _highlightUnmatchedCADPoints() {
        this.pointList.forEach(p => {
            if (p.MATCH_STA === '未匹配') {
                const id = _allMarkerIds[p.pointNo];
                if (id) {
                    const ent = this.mxDraw.getMxEntity(id);
                    if (ent) { ent.scale = 1.5; this.highlightEntIds.push(id); }
                }
            }
        });
        if (this.mxDraw) this.mxDraw.updateDisplay();
    },

    /**
     * 高亮定位到指定测点（用于人工匹配/人工布点）
     */
    _highlightSurveyPoint(survey) {
        const coord = this._parseSurveyCoord(survey);
        if (!coord) { this.$Message.warning('该测点无有效坐标，无法定位'); return; }
        const [x, y] = coord;
        if (this.mxcad) this.mxcad.zoomCenter(x, y);
        // 在图纸坐标处加一个红色临时标记
        const id = this._addImageAt(x, y, '3', null);
        if (id !== null) this.highlightEntIds.push(id);
    },

    // ============== 按钮方法 ==============

    /**
     * 三、自动匹配
     */
    onAutoMatch(points, threshold) {
        // const unmatched = points.filter(p => p.MATCH_STA === '未匹配');
        // if (unmatched.length === 0) {
        //     this.$Message.warning('请选择未匹配状态的测点');
        //     return;
        // }
        console.log({
                TZPZ_NO: this.entity.TZPZ_NO,
                threshold
            }, 7777)
        if (parent && parent.autoMatch) {
            parent.autoMatch({
                TZPZ_NO: this.entity.TZPZ_NO,
                threshold
            })
            this.$Message.success('匹配成功')
        }
    },

    /**
     * 四、人工匹配
     */
    onManualMatch(points) {
        if (!points || points.length !== 1) {
            this.$Message.warning('请选择一个未匹配状态的测点');
            return;
        }
        const unmatched = points.filter(p => p.MATCH_STA === '未匹配');
        if (unmatched.length === 0) {
            this.$Message.warning('请选择一个未匹配状态的测点');
            return;
        }
        this._clearHighlights();
        this.selectedSurveyPoint = unmatched[0];
        this.zoomToPoint(this.selectedSurveyPoint.PT_X_VALUE, this.selectedSurveyPoint.PT_Y_VALUE)
        if (!_allMarkerIds[this.selectedSurveyPoint.PT_NO]) {
            const id = this._addImageAt(this.selectedSurveyPoint.PT_X_VALUE, this.selectedSurveyPoint.PT_Y_VALUE, '2', this.selectedSurveyPoint.PT_NO)
            _allMarkerIds[this.selectedSurveyPoint.PT_NO] = id
        }
        
        this.matchMode = 'manual-match';
        this._hidePanel1();
        this._highlightSurveyPoint(this.selectedSurveyPoint);
        this._highlightUnmatchedCADPoints();
        this.$Message.info('请在图纸上点击一个未匹配的图纸点位完成匹配');
    },

    /**
     * 五、自动布点
     */
    onAutoPlace(points) {
        const pts = points;
        const valid = pts.filter(p =>
            p.MATCH_STA === '未匹配' && this._parseSurveyCoord(p)
        );
        if (valid.length !== 1) {
            this.$Message.warning('请选择一个未匹配且有坐标的测点');
            return;
        }
        this._hidePanel1()
        valid.forEach(survey => {
            const coord = this._parseSurveyCoord(survey);
            if (!coord) return;
            const [x, y] = coord;
            if (!_allMarkerIds[survey.PT_NO]) {
                const id = this._addImageAt(x, y, '2', survey.PT_NO);
                _allMarkerIds[survey.PT_NO] = id
                if (id !== null) survey.objectId = id;
            }
        });
        console.log({
                "TZPZ_NO": this.entity.TZPZ_NO,
                I2P_NO: valid[0].I2P_NO
            }, 2222)
        if (parent && parent.autoAddAndMatch) {
            parent.autoAddAndMatch({
                "TZPZ_NO": this.entity.TZPZ_NO,
                I2P_NO: valid[0].I2P_NO
            })
        }
        if (this.mxcad) this.mxcad.regen();
        this.$Message.success('布点成功')
    },

    /**
     * 六、人工布点
     */
    onManualPlace(points) {
        if (!points || points.length !== 1) {
            this.$Message.warning('请选择一个测点');
            return;
        }
        const unmatched = points.filter(p => p.MATCH_STA === '未匹配');
        if (unmatched.length === 0) {
            this.$Message.warning('请选择未匹配状态的测点');
            return;
        }
        this.selectedSurveyPoint = unmatched[0];
        if (this.selectedSurveyPoint.PT_X_VALUE && this.selectedSurveyPoint.PT_Y_VALUE) {
            this.$Message.warning('请选择没有坐标的测点');
            return;
        }
        // 打开弹窗，不进入图纸拾取模式
        this._hidePanel1();
        this.$refs.manualPlaceForm.resetPos()
        this.manualPlaceVisible = true;
    },

    /**
     * 七、解除匹配
     */
    onUnmatch(points) {
        if (!points || points.length !== 1) {
            this.$Message.warning('请先选择要一个要解除绑定的测点');
            return;
        }
        if (points.some(item => item.MATCH_STA === '未匹配')) {
            this.$Message.warning('只能选择匹配的测点');
            return;
        }
        console.log(points)
        this.$Modal.confirm({
            title: '提示',
            content: '请选择已匹配状态的测点。点击后弹出提示：解除匹配后不可撤销，确定吗？',
            onOk: () => {
                if (parent && parent.cancelMatch) {
                    parent.cancelMatch({
                        TZPZ_NO: this.entity.TZPZ_NO,
                        I2P_NO: points[0].I2P_NO
                    })
                }
            }
        })
    },

    /**
     * 人工匹配模式下，在图纸上点击了某个点位
     */
    _handleManualMatchCanvasClick(event) {
        try {
            const mxobj = MxFun.getCurrentDraw();
            if (!mxobj) return 0;

            const fallback = this._findMarkerByDistance(mxobj, event.offsetX, event.offsetY);
            const targetEnt = fallback;

            if (!targetEnt) return;
            const pointNo = targetEnt.userData && targetEnt.userData.pointNo;
            if (pointNo === undefined) return;
            const point = this.pointList.find(p => p.pointNo === pointNo);
            if (!point) {
                this.$Message.warning('请点击一个未匹配的图纸点位');
                return 0;
            }
            // 连线
            const surveyCoord = this._parseSurveyCoord(this.selectedSurveyPoint);
            if (surveyCoord) {
                const line = new MxDbLine();
                line.pt1 = new THREE.Vector3(surveyCoord[0], surveyCoord[1], 0);
                line.pt2 = new THREE.Vector3(point.x, point.y, 0);
                line.setColor('#ff4d4f');
                const lineId = this.mxDraw.addMxEntity(line);
                if (lineId !== null) {
                    this.highlightEntIds.push(lineId);
                    this.mxDraw.updateDisplay();
                }
            }
            // 弹窗确认
            this.$Modal.confirm({
                title: '确认匹配',
                render: h => {
                    return h('div', {
                        lineHeight: 2
                    },[
                        h('p', `实时测点： ${this.selectedSurveyPoint.PT_NAM}`),
                        h('p', `图纸点位： ${point.pointName}`)
                    ])
                },
                okText: '匹配',
                onOk: () => {
                    this._clearHighlights();
                    this.matchMode = null;
                    if (parent && parent.manualMatch) {
                        parent.manualMatch({
                            TZPZ_NO: this.entity.TZPZ_NO,
                            "I2P_NO":this.selectedSurveyPoint.I2P_NO,
                            "POINT_NO": point.POINT_NO
                        })
                    }
                    this.$Message.success('匹配成功');
                    this.selectedSurveyPoint = null;
                }
            });
            return 0;
        } catch (e) {
            console.error('[_handleManualMatchCanvasClick] 失败:', e);
            return 0;
        }
    },

    /**
     * 人工布点模式下，在图纸上点击了位置
     */
    _handleManualPlaceCanvasClick(event) {
        try {
            const mxobj = MxFun.getCurrentDraw();
            if (!mxobj) return 0;
            const docPt = mxobj.screenCoord2Doc(event.offsetX, event.offsetY);
            const pt = MxFun.docCoord2Cad(docPt.x, docPt.y, 0);
            if (!pt) return 0;
            // 拾取模式：回填坐标到表单，不关闭弹窗，不清空 selectedSurveyPoint
            if (this.matchMode === 'manual-place-pick') {
                this._clearHighlights();
                this.manPlacePendingX = pt.x;
                this.manPlacePendingY = pt.y;
                this.matchMode = null;
                this.$refs.manualPlaceForm && this.$refs.manualPlaceForm.onFillCoord(pt.x, pt.y);
                this.manualPlaceVisible = true
                return 0;
            }
            // 弹窗确认后手动输入坐标的放置模式
            if (this.matchMode === 'manual-place') {
                if (!_allMarkerIds[this.selectedSurveyPoint.PT_NO]) {
                    const id = this._addImageAt(pt.x, pt.y, '2', this.selectedSurveyPoint.PT_NO);
                    _allMarkerIds[this.selectedSurveyPoint.PT_NO] = id
                    if (id !== null) {
                        this.selectedSurveyPoint.objectId = id;
                    }
                }
                this._clearHighlights();
                this.matchMode = null;
                this.selectedSurveyPoint = null;
                if (this.mxcad) this.mxcad.regen();
                this.$Message.success('布点成功');
                this._showPanel1();
                this._refreshPointData().then(() => {});
                return 0;
            }
            return 0;
        } catch (e) {
            console.error('[_handleManualPlaceCanvasClick] 失败:', e);
            return 0;
        }
    },

    /**
     * 弹窗"选择坐标"按钮触发的图纸拾取
     */
    onPickCoordinateFromCanvas() {
        this.matchMode = 'manual-place-pick';
        this.manualPlaceVisible = false
    },

    /**
     * 坐标已由画布拾取回填（form 更新后触发）
     */
    onFillCoordToForm() {
        this.manualPlaceHasCoordFill = true;
    },

    /**
     * 弹窗确认布点（用户填写坐标后点击确认）
     */
    onManualPlaceConfirm(coords) {
        if (!this.selectedSurveyPoint) return;
        const survey = this.selectedSurveyPoint;
        const { x, y } = coords;
        // 添加标记
        if (!_allMarkerIds[survey.PT_NO]) {
            const id = this._addImageAt(x, y, '2', survey.PT_NO);
            _allMarkerIds[survey.PT_NO] = id
            if (id !== null) {
                survey.objectId = id;
                survey.coordValue = { x, y };
            }
        }
        console.log({
                "TZPZ_NO": this.entity.TZPZ_NO,
                "X_VALUE": x,
                "Y_VALUE": y
            })
        if (parent && parent.manualAddAndMatch) {
            parent.manualAddAndMatch({
                "TZPZ_NO": this.entity.TZPZ_NO,
                "X_VALUE": x,
                "Y_VALUE": y
            })
        }
        this.matchMode = null;
        this.selectedSurveyPoint = null;
        if (this.mxcad) this.mxcad.regen();
        this.manualPlaceVisible = false
        this._refreshPointData().then(() => {});
    },

    /**
     * 弹窗取消
     */
    onManualPlaceCancel() {
        this.matchMode = null;
        this.selectedSurveyPoint = null;
        this._clearHighlights();
        this.manualPlaceVisible = false
    },

    /**
     * 刷新点位数据（操作完成后调用）
     * TODO: 替换为实际接口请求
     */
    _refreshPointData() {
        // 模拟 API 请求延迟
        return new Promise(resolve => {
            setTimeout(() => {
                // TODO: 此处替换为真实接口
                // fetch('/api/points/refresh', { method: 'POST', body: JSON.stringify(...) })
                //   .then(res => res.json()).then(data => {
                //     window.cadStore.commit('setPointData', data)
                //     resolve()
                //   })
                resolve()
            }, 300)
        })
    },

    /**
     * 在指定屏幕坐标处绘制红色圆点标记
     * @param screenX 屏幕X坐标（像素）
     * @param screenY 屏幕Y坐标（像素）
     * @param radius 圆点半径（文档坐标单位，默认50）
     */
    addMarkerAt(screenX, screenY, radius = 50) {
        try {
            if (!this.mxcad || !MxFun) {
                console.warn("[addMarkerAt] 查看器未就绪");
                return;
            }
            // 屏幕坐标转CAD文档坐标
            const docPt = MxFun.screenCoord2Doc(screenX, screenY);
            if (!docPt) {
                console.warn("[addMarkerAt] 坐标转换失败", screenX, screenY);
                return;
            }

            const mxObj = MxFun.getCurrentDraw();
            const circle = new MxDbCircleShape();
            circle.color = new THREE.Color("#ff0000");
            circle.startAngle = 0;
            circle.endAngle = Math.PI * 2;
            circle.center = docPt;
            circle.radius = radius;

            mxObj.addMxEntity(circle);
            if (this.mxcad.updateDisplay) {
                this.mxcad.updateDisplay();
            } else if (MxFun && MxFun.updateDisplay) {
                MxFun.updateDisplay();
            }
            console.log("[addMarkerAt] 红色圆点已添加到:", docPt.x.toFixed(2), docPt.y.toFixed(2));
        } catch (e) {
            console.error("[addMarkerAt] 绘制失败:", e);
        }
    },
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
            LAYER_ID: ent.layerId ? (ent.layerId.getMcDbLayerTableRecord().getHandle() || '') : '',
            LAYER_NAM: ent.layer || '',
            // 点位名称从块名取
            pointName: ent.blockName || '',
            pointNo: ent.getHandle()
        });
        }
        return result
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
