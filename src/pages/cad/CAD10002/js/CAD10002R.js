import ViewerPanel from '../components/ViewerPanel/ViewerPanel.vue';
import ViewerPanel1 from '../components/ViewerPanel/ViewerPanel1.vue';
import ViewerPanel2 from '../components/ViewerPanel/ViewerPanel2.vue';
import ViewerPanel3 from '../components/ViewerPanel/ViewerPanel3.vue';
import PersonInfoModal from '../dialog/PersonInfoModal.vue';
import SafetyCheckModal from '../dialog/SafetyCheckModal.vue';
import AlarmHandleModal from '../dialog/AlarmHandleModal.vue';
import EquipInfoModal from '../dialog/EquipInfoModal.vue';
import TzModal from '../dialog/tzModal.vue';
import { createMxCad, MxCpp, McDbCircle, McGePoint3d, McCmColor, McDbXData, McDbPoint, MxCADUtility, McDbBlockReference } from "mxcad";
import { MxFun, MrxDbgUiPrPoint, MrxDbgUtils, McEdGetPointWorldDrawObject, MxDbLine, MxDbCircleShape, MxDbAnyLine, MxDbImage } from "mxdraw";
import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
import { MyRect } from "@/test/DrawRect";
import * as THREE from "three";
import { mapState } from 'vuex'
let _allMarkerIds = {}
export default {
    data() {
        return {
            TZPZ_NO: "",
            tabs: ['安全监测', '水文监测', '瓦斯抽采', '人员定位'],
            tabIndex: 0,
            fileName: '图纸1',
            panelCollapsed: true,
            panelCollapsed1: true,
            categories: [],
            categories1: [],
            categories2: [],
            categories3: [],
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
            showTz: false,
            showPersonModal: false,
            showSafetyCheckModal: false,
            showAlarmModal: false,
            currentAlarm: {},
            showEquipModal: false,
            viewChangeHandler: null,
            markerList: [],
            // 必须渲染的点位
            forceShowIds: new Set(),
            isRenderPending: false,
            matchSvgWrapper: null,
            matchSvgLine: null,
            matchLineIds: null,
            pointList: [],
            // 告警 tooltip 状态
            tooltipVisible: false,
            tooltipContent: '',
            tooltipX: 0,
            tooltipY: 0,
            tooltipMarkerId: null,
            tooltipStyle: {
                left: '0px',
                top: '0px'
            }
        }
    },
    beforeDestroy() {
        this._unbindMarkerClickEvent();
    },
    components: {
        ViewerPanel,
        ViewerPanel1,
        ViewerPanel2,
        ViewerPanel3,
        PersonInfoModal,
        SafetyCheckModal,
        AlarmHandleModal,
        EquipInfoModal,
        TzModal
    },
    mounted() {
        // if (false) {
        //     this.pointList = [
        //         {
        //             "I2P_NO": "133777110241938767871",
        //             "TZPZ_NO": "133775589162091020281",
        //             "POINT_X_VALUE": "",
        //             "MATCH_STA": "匹配",
        //             "POINT_ID": "",
        //             "POINT_NAM": "",
        //             "PT_Y_VALUE": "-30388651.27496908",
        //             "PT_NAM": "氧气1",
        //             "PT_NO": "128681301464609980416",
        //             "MATCH_TYP": "",
        //             "DALTA_XY": "",
        //             "PT_ID": "61080201921101MN001200001816",
        //             "PT_X_VALUE": "23372898.909408778",
        //             "POINT_Y_VALUE": "",
        //             "POINT_NO": ""
        //         },
        //         {
        //             "I2P_NO": "133777110241938767872",
        //             "TZPZ_NO": "133775589162091020288",
        //             "POINT_X_VALUE": "",
        //             "MATCH_STA": "未匹配",
        //             "POINT_ID": "",
        //             "POINT_NAM": "",
        //             "PT_Y_VALUE": "-30382999.282143094",
        //             "PT_NAM": "氧气",
        //             "PT_NO": "128681301464609980416",
        //             "MATCH_TYP": "",
        //             "DALTA_XY": "",
        //             "PT_ID": "61080201921101MN001200001818",
        //             "PT_X_VALUE": "23369467.220270775",
        //             "POINT_Y_VALUE": "",
        //             "POINT_NO": ""
        //         },
        //         {
        //             "I2P_NO": "133777112498138775552",
        //             "TZPZ_NO": "133775589162091020288",
        //             "POINT_X_VALUE": "",
        //             "MATCH_STA": "未匹配",
        //             "POINT_ID": "",
        //             "POINT_NAM": "",
        //             "PT_Y_VALUE": "39394974.134983465",
        //             "PT_NAM": "环境温度",
        //             "PT_NO": "128681301465683722240",
        //             "MATCH_TYP": "",
        //             "DALTA_XY": "",
        //             "PT_ID": "61080201921101MN000300000200",
        //             "PT_X_VALUE": "-63240812.58022698",
        //             "POINT_Y_VALUE": "",
        //             "POINT_NO": ""
        //         },
        //         {
        //             "I2P_NO": "133777112498138775552",
        //             "TZPZ_NO": "133775589162091020288",
        //             "POINT_X_VALUE": "",
        //             "MATCH_STA": "未匹配",
        //             "POINT_ID": "",
        //             "POINT_NAM": "",
        //             "PT_Y_VALUE": "",
        //             "PT_NAM": "环境温度",
        //             "PT_NO": "128681301465683722240",
        //             "MATCH_TYP": "",
        //             "DALTA_XY": "",
        //             "PT_ID": "61080201921101MN000300000200",
        //             "PT_X_VALUE": "",
        //             "POINT_Y_VALUE": "",
        //             "POINT_NO": ""
        //         }
        //     ]
        //     this.initViewer()
        //     this.$nextTick(() => {
        //         this.initCtrlPan();
        //     });
        // }
        this.postData('/api/scaqyzt/getTzpzList', {
            "pageSize": "1000",
            "pageNum": "1",
            param_orgNo: this.orgNo
        }).then(data => {
            const tz = data.data.data.filter(item => item.TZPZ_STA == '04')

        })
    },
    methods: {
        async postData(url = "", data = {}) {
            data.orgNo = this.orgNo
            const response = await fetch(url, {
                method: "POST",

                body: JSON.stringify(data),
            });
            return response.json();
        },
        getGroupedIotInfo() {
            this.postData('/api/scaqyzt/getGroupedIotInfo', {
                TZPZ_NO: this.TZPZ_NO
            }).then(data => {
                const allData = data.data
                if (allData['安全监测']) {
                    this.categories1 = Object.keys(allData['安全监测']).map((key, index) => {
                        return {
                            name: key,
                            "expanded": index === 0 ? true : false,
                            "currentPage": 1,
                            "pageSize": 10,
                            "selectedPoints": [],
                            "points": allData['安全监测'][key]
                        }
                    })
                    this.categories2 = [{
                        name: '水文监测',
                        "expanded": index === 0 ? true : false,
                        "currentPage": 1,
                        "pageSize": 10,
                        "selectedPoints": [],
                        "points": allData['水文监测']
                    }]
                    this.categories3 = [{
                        name: '瓦斯抽取',
                        "expanded": index === 0 ? true : false,
                        "currentPage": 1,
                        "pageSize": 10,
                        "selectedPoints": [],
                        "points": allData['瓦斯抽取']
                    }]
                    this.categories4 = [{
                        name: '人员定位',
                        "expanded": index === 0 ? true : false,
                        "currentPage": 1,
                        "pageSize": 10,
                        "selectedPoints": [],
                        "points": allData['人员定位']
                    }]
                }

            })
        },
        onTabClick(item, index) {
            this.tabIndex = index
            this.panelCollapsed = true
        },
        onAlarmHandle(alarm) {
            if (alarm && Object.keys(alarm).length > 0) {
                this.currentAlarm = alarm
            } else {
                this.currentAlarm = {
                    level: '一级告警',
                    title: '瓦斯浓度超限',
                    subtitle: '回风巷瓦斯监测点，当前 1.26%，阈值 1%',
                    alarmNo: 'ALM-001',
                    status: '告警发生',
                    time: '2026-07-29 10:18',
                    responsibleUnit: '通风队',
                    deadline: '30 分钟',
                    responseLevel: '一级告警'
                }
            }
            this.showAlarmModal = true
        },
        onAlarmStepChange(step) {
            // 子步骤变化时同步状态
        },
        onAlarmDispatch() {
            this.$Message.success('派单成功')
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
                const mxcad = await createMxCad({
                    canvas: "#mxcad",
                    locateFile: (fileName) => {
                        return new URL(wasmPath + fileName, window.location.origin + window.location.pathname).href;
                    },
                    // fileUrl: "./models/HDMY-XJH.mxweb",
                    // fileUrl:"./models/HDMY-XJH-v2.mxweb",
                    fileUrl: this.fileUrlInput,
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
                this.viewChangeHandler = () => {
                    // 已有排队渲染，直接跳过，防止重复入队
                    if (this.isRenderPending) return;
                    this.isRenderPending = true;
                    requestAnimationFrame(() => {
                        this.renderDomMarkers();
                        // 平移缩放时同步更新 tooltip 位置（不重建 DOM，避免频闪）
                        if (this.tooltipVisible && this.tooltipMarkerId) {
                            this.updateTooltipPosition();
                        }
                        this.isRenderPending = false;
                    })
                };
                mxcad.mxdraw.on("viewchange", this.viewChangeHandler);

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
        setForceShow(id) {
            this.forceShowIds.add(id);
            this.triggerRenderMarker();
        },
        /**
         * 取消点位强制显示
         * @param {number|string} id
         */
        cancelForceShow(id) {
            this.forceShowIds.delete(id);
            this.triggerRenderMarker();
        },
        /**
         * 清空全部强制显示
         */
        clearAllForceShow() {
            this.forceShowIds.clear();
            this.triggerRenderMarker();
        },
        isMarkerForceShow(m) {
            return this.forceShowIds.has(m.biz.id);
        },

        // 统一触发渲染（复用rAF节流）
        triggerRenderMarker() {
            if (this.isRenderPending) return;
            this.isRenderPending = true;
            requestAnimationFrame(() => {
                this.renderDomMarkers();
                this.isRenderPending = false;
            })
        },
        initCadViewListen() {
            const draw = MxFun.getCurrentDraw();
            if (!draw) return;
            // 视图（缩放/平移）发生变化触发
            this.viewChangeHandler = () => {
                this.renderDomMarkers();
            };
            draw.on("viewChange", this.viewChangeHandler);
        },
        unListenCadView() {
            const draw = MxFun.getCurrentDraw();
            if (draw && this.viewChangeHandler) {
                draw.off("viewChange", this.viewChangeHandler);
            }
        },
        addMarker(worldX, worldY, type, bizData) {
            this.markerList.push({
                worldPt: new McGePoint3d(worldX, worldY, 0),
                type,
                biz: bizData
            });
            this.triggerRenderMarker();
        },

        /**
         * 把全部测点世界坐标转屏幕像素，渲染DOM图标
         */
        renderDomMarkers() {
            const draw = MxFun.getCurrentDraw();
            if (!draw) return;
            const markerLayer = this.$refs.markerLayer;
            if (!markerLayer) return;
            markerLayer.innerHTML = "";

            // 计算当前视图像素缩放：1个世界单位对应多少屏幕像素
            const p1 = draw.cadCoord2View(0, 0);
            const p2 = draw.cadCoord2View(100, 0);
            const pixelScale = Math.hypot(p2.x - p1.x, p2.y - p1.y) / 100;

            // 根据缩放动态设置聚合阈值(像素)
            let mergeThreshold;
            if (pixelScale < 0.3) {
                mergeThreshold = 24;
            } else if (pixelScale < 0.8) {
                mergeThreshold = 16;
            } else {
                mergeThreshold = 8;
            }

            const w = draw.getViewWidth();
            const h = draw.getViewHeight();
            const pixelGrid = new Map();
            const gridSize = mergeThreshold;

            // 内部工具：判断该屏幕点是否和已渲染点过近
            function isNearPoint(screenX, screenY) {
                const gx = Math.floor(screenX / gridSize);
                const gy = Math.floor(screenY / gridSize);
                // 只检查周围3x3网格
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const key = `${gx + dx},${gy + dy}`;
                        const list = pixelGrid.get(key);
                        if (!list) continue;
                        for (const p of list) {
                            const dist = Math.hypot(screenX - p.x, screenY - p.y);
                            if (dist < gridSize) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }

            for (const m of this.markerList) {
                const screenPos = draw.cadCoord2View(m.worldPt.x, m.worldPt.y);

                // 视口外过滤
                if (screenPos.x < -20 || screenPos.x > w + 20 || screenPos.y < -20 || screenPos.y > h + 20) {
                    continue;
                }
                // 网格分桶距离判断，替代全量循环renderedScreenPoints
                if ((pixelScale < 0.1 || isNearPoint(screenPos.x, screenPos.y) && pixelScale < 5 && !this.isMarkerForceShow(m))) {
                    continue;
                }
                // 将当前点存入像素网格
                const gx = Math.floor(screenPos.x / gridSize);
                const gy = Math.floor(screenPos.y / gridSize);
                const key = `${gx},${gy}`;
                if (!pixelGrid.has(key)) {
                    pixelGrid.set(key, []);
                }
                let imgUrl = 'url(/image/icon1.png)'
                if (m.type === '1') {
                    if (!m.isWarning) {
                        imgUrl = 'url(/image/icon1.png)'
                    } else {
                        imgUrl = 'url(/image/icon2.png)'
                    }
                } else if (m.type === '2') {
                    if (!m.isWarning) {
                        imgUrl = 'url(/image/icon3.png)'
                    } else {
                        imgUrl = 'url(/image/icon4.png)'
                    }
                } else if (m.type === '3') {
                    if (!m.isWarning) {
                        imgUrl = 'url(/image/icon5.png)'
                    } else {
                        imgUrl = 'url(/image/icon6.png)'
                    }
                } else if (m.type === '4') {
                    if (!m.isWarning) {
                        imgUrl = 'url(/image/icon7.png)'
                    } else {
                        imgUrl = 'url(/image/icon8.png)'
                    }
                }
                pixelGrid.get(key).push({ x: screenPos.x, y: screenPos.y });

                // 创建DOM标记节点
                let className = 'marker-icon'
                if (m.isWarning) {
                    className += ' marker-warning'
                }
                const div = document.createElement("div");
                div.className = className;
                div.id = m.biz.id;
                div.title = m.biz.name;
                div.biz = m.biz;
                div.style.position = "absolute";
                div.style.left = (screenPos.x - 14) + "px";
                div.style.top = (screenPos.y - 19) + "px";
                div.style.width = "28px";
                div.style.height = "38px";
                div.style.pointerEvents = "auto";
                div.style.backgroundSize = "contain";
                div.style.backgroundRepeat = "no‑repeat";
                div.style.backgroundImage = imgUrl;
                if (m.isWarning) {
                    div.addEventListener('mouseenter', () => this.onMarkerHover(m, screenPos));
                    div.addEventListener('mouseleave', () => this.onMarkerLeave());
                }
                markerLayer.appendChild(div);
            }
        },

        clearAllMarker() {
            this.markerList = [];
            this.forceShowIds.clear();
            this.tooltipVisible = false;
            this.tooltipMarkerId = null;
            this.triggerRenderMarker();
        },
        async postData(url = "", data = {}) {
            const response = await fetch(url, {
                method: "POST",

                body: JSON.stringify(data),
            });
            return response.json();
        },
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
            if (this.pointList.length) {
                this.pointList.forEach(item => {
                    this.markerList.push({
                        worldPt: new McGePoint3d(item.x, item.y, 0),
                        type: item.type,
                        isWarning: item.isWarning,
                        warningText: item.warningText || this.buildWarningText(item),
                        biz: {
                            id: item.pointNo,
                            name: item.pointName,
                            type: item.type
                        }
                    });
                });
                this.renderDomMarkers();
            }
        },
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
        _clearAllMarkers() {
            this.markerList = [];
            this.tooltipVisible = false;
            this.tooltipMarkerId = null;
            this.renderDomMarkers();
        },

        /**
         * 删除指定点位的 DOM 标记
         * @param {Array} points - 要删除标记的点位对象数组
         */
        _deletePointMarkers(points) {
            if (!points) return;
            points.forEach(point => {
                this.markerList = this.markerList.filter(m => {
                    return !(m.biz && m.biz.id === point.pointNo);
                });
            });
            this.renderDomMarkers();
        },
        _addImageAt(x, y, type, biz) {
            try {
                if (!biz.id) return null;
                // 避免重复添加
                if (this.markerList.some(m => m.id === biz.id)) return null;

                this.addMarker(x, y, type, biz);
                return true;
            } catch (e) {
                console.error('[_addImageAt] 失败:', e);
                return null;
            }
        },
        _bindMarkerClickEvent() {
            // marker-layer绑定事件
            const viewerContent = this.$refs.viewerContent;
            if (!viewerContent) return;

            // mousedown委托：阻止冒泡到canvas，只绑定1次
            this._onLayerMouseDown = (e) => {
                const target = e.target.closest('.marker-icon');
                if (!target) return;
                const bizData = target.biz
                if (bizData.type === '1') {
                    this.showSafetyCheckModal = true
                } else if (bizData.type === '2' || bizData.type === '3') {
                    this.showEquipModal = true
                } else if (bizData.type === '4') {
                    this.showPersonModal = true
                }
                e.stopPropagation(); // ✅阻止下发canvas mousedown
            }
            viewerContent.addEventListener('click', this._onLayerMouseDown);
        },


        _findMarkerByDistance(mxobj, screenX, screenY) {
            try {
                if (!mxobj || this.markerList.length === 0) return null;
                let bestMarker = null;
                let bestDist = Infinity;
                const THRESHOLD = 20;
                for (const m of this.markerList) {
                    const screenPt = mxobj.cadCoord2View(m.worldPt.x, m.worldPt.y, m.worldPt.z || 0);
                    if (!screenPt) continue;
                    const dx = screenPt.x - screenX;
                    const dy = screenPt.y - screenY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < THRESHOLD && dist < bestDist) {
                        bestDist = dist;
                        bestMarker = m;
                    }
                }
                return bestMarker;
            } catch (e) {
                console.error('[_findMarkerByDistance] 失败:', e);
                return null;
            }
        },

        _unbindMarkerClickEvent() {
            this.$refs.viewerContent.removeEventListener('mousedown', this._onLayerMouseDown)
            this._onLayerMouseDown = null
        },

        // ============== 告警 Tooltip ==============
        buildWarningText(item) {
            // 根据数据类型生成告警文本
            const typeMap = {
                '1': '水位',
                '2': '瓦斯',
                '3': '甲烷',
                '4': '风速'
            }
            const typeName = typeMap[item.type] || '监测'
            const value = item.value || item.currentValue || '0'
            const overValue = item.overValue || item.alertValue || '0'
            return `${typeName}${overValue}m 超标+${overValue}m`
        },
        onMarkerHover(marker, screenPos) {
            if (!marker.isWarning || !marker.warningText) return
            this.tooltipMarkerId = marker.biz.id
            this.tooltipContent = marker.warningText
            this._updateTooltipPosition(screenPos)
            this.tooltipVisible = true
        },
        onMarkerLeave() {
            this.tooltipMarkerId = null
            this.tooltipVisible = false
        },
        _updateTooltipPosition(screenPos) {
            this.tooltipX = screenPos.x + 36
            this.tooltipY = screenPos.y - 19
        },
        updateTooltipPosition() {
            if (!this.tooltipVisible || !this.tooltipMarkerId) return
            const marker = this.markerList.find(m => m.biz && m.biz.id === this.tooltipMarkerId)
            if (!marker) return
            const draw = MxFun.getCurrentDraw()
            if (!draw) return
            const screenPos = draw.cadCoord2View(marker.worldPt.x, marker.worldPt.y)
            this._updateTooltipPosition(screenPos)
            // 直接操作 DOM，不经过 Vue 响应式更新，避免闪烁
            const tooltipEl = this.$refs.alarmTooltip
            if (tooltipEl) {
                tooltipEl.style.left = this.tooltipX + 'px'
                tooltipEl.style.top = this.tooltipY + 'px'
            }
        },
        /**
             * 在图纸上高亮未匹配的点位（DOM 放大标记）
             */
        _highlightUnmatchedCADPoints() {
            // DOM 标记通过 renderDomMarkers 刷新即可，此处仅需记录状态供需要时清理
            this.highlightEntIds = [];
        },

        /**
         * 高亮定位到指定测点（用于人工匹配/人工布点）
         */
        _highlightSurveyPoint(survey) {
            const coord = this._parseSurveyCoord(survey);
            if (!coord) { this.$Message.warning('该测点无有效坐标，无法定位'); return; }
            const [x, y] = coord;
            if (this.mxcad) this.mxcad.zoomCenter(x, y);
            // 在图纸坐标处加一个 DOM 红色临时标记（type='3' 无 pointNo，不加入 markerList）
            // this._addDomHighlightMarker(x, y);
        },
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
    },
}
