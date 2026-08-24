import chooseDialog from '../dialog/chooseDialog'
import ViewerPanel from '../components/ViewerPanel/ViewerPanel.vue';
import ViewerPanel1 from '../components/ViewerPanel/ViewerPanel1.vue';
import { createMxCad, MxCpp, McDbCircle, McGePoint3d, McCmColor, McDbXData, McDbPoint, MxCADUtility, McDbBlockReference } from "mxcad";
import { MxFun, MrxDbgUiPrPoint, MrxDbgUtils, McEdGetPointWorldDrawObject, MxDbLine, MxDbCircleShape, MxDbAnyLine, MxDbImage } from "mxdraw";
import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
import { MyRect } from "@/test/DrawRect";
import * as THREE from "three";
import { mapState } from 'vuex'
let rafPending = false
export default {
    data() {
        return {
            steps: [
                { title: "选择图纸", },
                { title: "图纸解析", },
                { title: "点位绑定", },
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
                "TZPZ_USR": "",
                "TZPZ_DAT": "",
                "TZPZ_STA": "01",
                "resourceUrl": "",
                "TZXX_ID": "",
                "TZLX_NAM": "",
                "TZ_VERSION": "",
                TZPZ_NO: "",
            },
            viewChangeHandler: null,
            markerList: [],
            // 必须渲染的点位
            forceShowIds: new Set(),
            isRenderPending: false,
            matchSvgWrapper: null,
            matchSvgLine: null,
            matchLineIds: null,
            showTz: false,
            points: [],
            orgNo: ''
        }
    },
    components: {
        ViewerPanel,
        ViewerPanel1
    },
    mounted() {
        this.pointList = [
        {
            "X_VALUE": 23369467.890141826,
            "Y_VALUE": -30382998.077860042,
            "z": 0,
            "LAYER_ID": "288127",
            "LAYER_NAM": "A通风系统图",
            "POINT_NAM": "A$C379E0320",
            "POINT_ID": "58a6"
        },
        {
            "X_VALUE": 23369439.109730206,
            "Y_VALUE": -30382957.704416513,
            "z": 0,
            "LAYER_ID": "288127",
            "LAYER_NAM": "A通风系统图",
            "POINT_NAM": "A$C379E0320",
            "POINT_ID": "58a7"
        },
        {
            "X_VALUE": 23114724.227396417,
            "Y_VALUE": -28141241.35896348,
            "z": 0,
            "LAYER_ID": "288125",
            "LAYER_NAM": "底图",
            "POINT_NAM": "栅栏2",
            "POINT_ID": "6472"
        },
        {
            "X_VALUE": 23114953.04550457,
            "Y_VALUE": -28137480.675759755,
            "z": 0,
            "LAYER_ID": "288125",
            "LAYER_NAM": "底图",
            "POINT_NAM": "栅栏2",
            "POINT_ID": "6666"
        },
        {
            "X_VALUE": 23369400.29165956,
            "Y_VALUE": -30383083.760237556,
            "z": 0,
            "LAYER_ID": "288125",
            "LAYER_NAM": "底图",
            "POINT_NAM": "A$C095F2CEC",
            "POINT_ID": "7b38"
        },
        {
            "X_VALUE": 23372829.43129492,
            "Y_VALUE": -30382923.520400725,
            "z": 0,
            "LAYER_ID": "288125",
            "LAYER_NAM": "底图",
            "POINT_NAM": "A$C095F2CEC",
            "POINT_ID": "7b45"
        },
        {
            "X_VALUE": 23372754.41310084,
            "Y_VALUE": -30382938.718711346,
            "z": 0,
            "LAYER_ID": "288125",
            "LAYER_NAM": "底图",
            "POINT_NAM": "A$C095F2CEC",
            "POINT_ID": "7b48"
        },
        {
            "X_VALUE": 23370027.331389386,
            "Y_VALUE": -30382984.480325278,
            "z": 0,
            "LAYER_ID": "288125",
            "LAYER_NAM": "底图",
            "POINT_NAM": "A$C095F2CEC",
            "POINT_ID": "7b4a"
        },
        {
            "X_VALUE": 23366674.88328121,
            "Y_VALUE": -30383334.350133996,
            "z": 0,
            "LAYER_ID": "288125",
            "LAYER_NAM": "底图",
            "POINT_NAM": "A$C38615BD1",
            "POINT_ID": "7b61"
        },
        {
            "X_VALUE": 23366674.583281208,
            "Y_VALUE": -30384035.850133996,
            "z": 0,
            "LAYER_ID": "288125",
            "LAYER_NAM": "底图",
            "POINT_NAM": "A$C38615BD1",
            "POINT_ID": "7b62"
        }
    ].map(item => {
                    item.pointName = item.POINT_NAM
                    item.pointNo = item.POINT_ID
                    item.x = item.X_VALUE
                    item.y = item.Y_VALUE
                    return item
                })
                this.points = [
        {
            "I2P_NO": "133777110241938767871",
            "TZPZ_NO": "133775589162091020281",
            "POINT_X_VALUE": "",
            "MATCH_STA": "匹配",
            "POINT_ID": "",
            "POINT_NAM": "",
            "PT_Y_VALUE": "-30388651.27496908",
            "PT_NAM": "氧气1",
            "PT_NO": "128681301464609980416",
            "MATCH_TYP": "",
            "DALTA_XY": "",
            "PT_ID": "61080201921101MN001200001816",
            "PT_X_VALUE": "23372898.909408778",
            "POINT_Y_VALUE": "",
            "POINT_NO": ""
        },
        {
            "I2P_NO": "133777110241938767872",
            "TZPZ_NO": "133775589162091020288",
            "POINT_X_VALUE": "",
            "MATCH_STA": "未匹配",
            "POINT_ID": "",
            "POINT_NAM": "",
            "PT_Y_VALUE": "-30382999.282143094",
            "PT_NAM": "氧气",
            "PT_NO": "128681301464609980416",
            "MATCH_TYP": "",
            "DALTA_XY": "",
            "PT_ID": "61080201921101MN001200001818",
            "PT_X_VALUE": "23369467.220270775",
            "POINT_Y_VALUE": "",
            "POINT_NO": ""
        },
        {
            "I2P_NO": "133777112498138775552",
            "TZPZ_NO": "133775589162091020288",
            "POINT_X_VALUE": "",
            "MATCH_STA": "未匹配",
            "POINT_ID": "",
            "POINT_NAM": "",
            "PT_Y_VALUE": "39394974.134983465",
            "PT_NAM": "环境温度",
            "PT_NO": "128681301465683722240",
            "MATCH_TYP": "",
            "DALTA_XY": "",
            "PT_ID": "61080201921101MN000300000200",
            "PT_X_VALUE": "-63240812.58022698",
            "POINT_Y_VALUE": "",
            "POINT_NO": ""
        },
        {
            "I2P_NO": "133777112498138775552",
            "TZPZ_NO": "133775589162091020288",
            "POINT_X_VALUE": "",
            "MATCH_STA": "未匹配",
            "POINT_ID": "",
            "POINT_NAM": "",
            "PT_Y_VALUE": "",
            "PT_NAM": "环境温度",
            "PT_NO": "128681301465683722240",
            "MATCH_TYP": "",
            "DALTA_XY": "",
            "PT_ID": "61080201921101MN000300000200",
            "PT_X_VALUE": "",
            "POINT_Y_VALUE": "",
            "POINT_NO": ""
        }
    ]
    this.entity = {
                "TZPZ_ID": "",
                "TZXX_NO": "11",
                "TZPZ_USR": "111",
                "TZPZ_DAT": "2026-11-12",
                "TZPZ_STA": "04",
                "resourceUrl": "",
                "TZXX_ID": "",
                "TZLX_NAM": "",
                "TZ_VERSION": "",
                TZPZ_NO: "",
            }
        const params = new URLSearchParams(location.search)
        if (params.get('TZPZ_NO')) {
            this.entity.TZPZ_NO = params.get('TZPZ_NO')
            this.getTzpzInfo()
        }
        this.orgNo = params.get('orgNo')
        // _bindMarkerClickEvent 在 initViewer 内部调用（mxdraw 就绪后）
    },
    computed: {
        ...mapState(['tzInfo'])
    },
    watch: {
        // '$store.state.tzInfo': {
        //     handler(val) {
        //         this.entity.TZXX_NO = val.TZXX_NO
        //         this.entity.TZ_VERSION = val.TZ_VERSION
        //         this.entity.TZXX_ID = val.TZXX_ID
        //     },
        //     immediate: true
        // },
        // '$store.state.points': {
        //     handler(val) {
        //         this.getIot()
        //     },
        //     immediate: true
        // }
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
        onSelectTz(data) {
            this.entity.TZXX_NO = data.TZXX_NO
            this.entity.TZXX_ID = data.TZXX_ID
            this.entity.TZ_VERSION = data.TZ_VERSION
            // this.entity.TZLX_NAM = data.TZLX_NAM
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
        getViewPixelScale(mxobj) {
            // 取世界上100单位的长度，算出它占多少屏幕像素
            const p1 = mxobj.cadCoord2View(0, 0);
            const p2 = mxobj.cadCoord2View(100, 0);
            const pxLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            // pxLen：100世界单位对应的屏幕像素
            return pxLen / 100;
        },
        /**
         * 添加一个测点标记
         * @param {Number} worldX 世界坐标
         * @param {Number} worldY
         * @param {String} type '1'|'2'
         * @param {Object} bizData 业务 {id,name,...}
         */
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
                if ((pixelScale < 0.05 || isNearPoint(screenPos.x, screenPos.y) && pixelScale < 5 && !this.isMarkerForceShow(m))) {
                    continue;
                }
                // 将当前点存入像素网格
                const gx = Math.floor(screenPos.x / gridSize);
                const gy = Math.floor(screenPos.y / gridSize);
                const key = `${gx},${gy}`;
                if (!pixelGrid.has(key)) {
                    pixelGrid.set(key, []);
                }
                pixelGrid.get(key).push({ x: screenPos.x, y: screenPos.y });

                // 创建DOM标记节点
                const div = document.createElement("div");
                div.className = "marker-icon";
                div.id = m.biz.id;
                div.title = m.biz.name;
                div.biz = m.biz;
                div.style.position = "absolute";
                div.style.left = (screenPos.x - 8) + "px";
                div.style.top = (screenPos.y - 8) + "px";
                div.style.width = "16px";
                div.style.height = "16px";
                div.style.pointerEvents = "auto";
                div.style.backgroundSize = "contain";
                div.style.backgroundRepeat = "no‑repeat";
                div.style.backgroundImage = m.type === '1' ? `url(/image/icon9.svg)` : `url(/image/icon10.svg)`;
                markerLayer.appendChild(div);
                if (this.matchLineIds) {
                    this.tryRedrawMatchLine();
                }
            }
        },

        clearAllMarker() {
            this.markerList = [];
            this.forceShowIds.clear();
            this.triggerRenderMarker();
        },
        async postData(url = "", data = {}) {
            data.orgNo = this.orgNo
            const response = await fetch(url, {
                method: "POST",

                body: JSON.stringify(data),
            });
            return response.json();
        },
        selectTz() {
            this.showTz = true
            // if (parent && parent.getTz) {
            //     parent.getTz()
            // }
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
        upsertTzpp(data) {
            this.postData('/api/scaqyzt/upsertTzpp', data).then(data => {
                this.getTzpzInfo()
            })
        },
        getTzpzInfo() {
            this.postData('/api/scaqyzt/getTzpzInfo', {
                "TZPZ_NO": this.entity.TZPZ_NO
            }).then(data => {
                this.entity = data.data
                this.fileUrlInput = data.data.resourceUrl || './models/YTSF-001.mxweb'
            })
        },
        upsertLayer(data) {
            this.postData('/api/scaqyzt/upsertLayer', data).then(data => {

            })
        },
        upsertPoint(data) {
            this.postData('/api/scaqyzt/upsertPoint', data).then(data => {
                this.getPoint()
            })
        },
        getPoint() {
            this.postData('/api/scaqyzt/getPoint', {
                "pageSize": "10000",
                "pageNum": "1",
                "TZPZ_NO": this.entity.TZPZ_NO
            }).then(data => {
                this.pointList = data.data.data.map(item => {
                    item.pointName = item.POINT_NAM
                    item.pointNo = item.POINT_ID
                    item.x = item.X_VALUE
                    item.y = item.Y_VALUE
                    return item
                })
            })
        },
        upsertIot(data) {
            this.postData('/api/scaqyzt/upsertIot', data).then(data => {
                this.getIot()
            })
        },
        deleteIot(data) {
            this.postData('/api/scaqyzt/deleteIot', data).then(data => {
                this.getIot();
            })
        },
        getIot() {
            this.postData('/api/scaqyzt/getIot', {
                "pageSize": "10000",
                "pageNum": "1",
                "TZPZ_NO": this.entity.TZPZ_NO
            }).then(data => {
                this.points = data.data.data
            })
        },
        autoMatch(data) {
            this.postData('/api/scaqyzt/autoMatch', data).then(data => {
                this.getIot()
            })
        },
        manualMatch(data) {
            this.postData('/api/scaqyzt/manualMatch', data).then(data => {
                this.getIot()
            })
        },
        autoAddAndMatch(data) {
            this.postData('/api/scaqyzt/autoAddAndMatch', data).then(data => {
                this.getIot()
            })
        },
        manualAddAndMatch(data) {
            this.postData('/api/scaqyzt/manualAddAndMatch', data).then(data => {
                this.getIot()
            })
        },
        cancelMatch(data) {
            this.postData('/api/scaqyzt/cancelMatch', data).then(data => {
                this.getIot()
            })
        },
        save() {
            if (this.currentStep === 0) {
                this.$refs.sForm.validate((valid) => {
                    if (!valid) {
                        this.$Message.error('请填写信息后再保存')
                        return
                    }
                    this.upsertTzpp({
                        "TZPZ_ID": this.entity.TZPZ_ID,
                        "TZXX_NO": this.entity.TZXX_NO,
                        "TZPZ_USR": this.entity.TZPZ_USR,
                        "TZPZ_DAT": this.entity.TZPZ_DAT,
                        "TZPZ_STA": this.entity.TZPZ_STA,
                        "TZPZ_NO": this.entity.TZPZ_NO
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
            } else {
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

                this.viewChangeHandler = () => {
                    // 已有排队渲染，直接跳过，防止重复入队
                    if (this.isRenderPending) return;
                    this.isRenderPending = true;
                    requestAnimationFrame(() => {
                        this.renderDomMarkers();
                        this.isRenderPending = false;
                    })
                };
                mxcad.mxdraw.on("viewchange", this.viewChangeHandler);

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
                                } catch (e) { }

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
                            //if (parent && parent.upsertLayer) {
                            this.upsertLayer({
                                TZPZ_NO: this.entity.TZPZ_NO,
                                data: this.layers.map(item => {
                                    return {
                                        "LAYER_ID": item.LAYER_ID,
                                        "LAYER_NAM": item.name
                                    }

                                })
                            })
                            //}
                        }
                    }
                }
            } catch (e) {
                console.warn("主动获取图层数据失败:", e);
            }
            // 收集点位数据
            if (this.entity.TZPZ_STA === '01') {
                const allPointEntities = this.getAllMcDbPoint();
                console.log(allPointEntities, 111)
                this.upsertPoint(allPointEntities)
            }
            if (this.pointList.length) {
                this.pointList.forEach(item => {
                    this.markerList.push({
                        worldPt: new McGePoint3d(item.x, item.y, 0),
                        type: '1',
                        biz: {
                            id: item.pointNo,
                            name: item.pointName,
                            type: '1'
                        }
                    });
                });
                this.renderDomMarkers();
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
            this.markerList = [];
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
                    //if (parent && parent.deleteIot) {
                    this.deleteIot({
                        TZPZ_NO: this.entity.TZPZ_NO,
                        I2P_NOs: points.map(item => item.I2P_NO)
                    })
                    //}
                }
            })
        },

        /**
         * 在图纸坐标处添加 DOM 标记圆点（替代 addMxEntity）
         * @param {number} x
         * @param {number} y
         * @param {string} type '1'|'2'|'3'
         * @param {string|null} biz
         */
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

        /**
         * 绑定标记图标点击事件，点击后打印点位信息并缩放到对应位置
         */
        /**
         * 绑定标记图标点击事件，点击后打印点位信息并缩放到对应位置
         */
        _bindMarkerClickEvent() {
            // marker-layer绑定事件
            const markerLayer = this.$refs.markerLayer;
            if (!markerLayer) return;

            // mousedown委托：阻止冒泡到canvas，只绑定1次
            this._onLayerMouseDown = (e) => {
                const target = e.target.closest('.marker-icon');
                if (!target) return;
                if (this.matchMode === 'manual-place-pick' && this.selectedSurveyPoint) {
                    return this._handleManualPlaceCanvasClick(event);
                }
                if (this.matchMode === 'manual-match' && this.selectedSurveyPoint) {
                    this.setForceShow(target.id)
                    if (target.biz.type != '1') {
                        this.$Message.warning('请点击一个未匹配的图纸点位');
                        return 0;
                    }
                    // 弹窗确认
                    this.manualMatchCallback(this.selectedSurveyPoint, target)
                    return
                }
                if (this.matchMode === 'manual-place' && this.selectedSurveyPoint) {
                    return this._handleManualPlaceCanvasClick(event);
                }
                e.stopPropagation(); // ✅阻止下发canvas mousedown
            }
            markerLayer.addEventListener('mousedown', this._onLayerMouseDown);
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
                        return this._handleManualMatchCanvasClick(event)
                    }
                    if (this.matchMode === 'manual-place' && this.selectedSurveyPoint) {
                        return this._handleManualPlaceCanvasClick(event);
                    }
                };
                // ✅直接绑定canvas DOM，不再走MxFun.addWindowsEvent全局事件
                canvas.addEventListener('mousedown', this._onCanvasMouseDown);

            } catch (e) {
                console.error('[_bindMarkerClickEvent] 失败:', e);
            }
        },
        manualMatchCallback(current, target) {
            this.matchLineIds = {
                i2pNo: current.PT_NO,
                pointNo: target.id
            };
            this.tryRedrawMatchLine();
            this.$Modal.confirm({
                title: '确认匹配',
                render: h => {
                    return h('div', {
                        style: {
                            lineHeight: 2
                        }
                    }, [
                        h('p', `实时测点： ${current.PT_NAM}`),
                        h('p', `图纸点位： ${target.title}`)
                    ])
                },
                okText: '匹配',
                onOk: () => {
                    this._clearHighlights();
                    this.matchMode = null;
                    // if (parent && parent.manualMatch) {
                    //     parent.manualMatch({
                    //         TZPZ_NO: this.entity.TZPZ_NO,
                    //         "I2P_NO": current.I2P_NO,
                    //         "POINT_NO": target.id
                    //     })
                    // }
                    this.manualMatch({
                        TZPZ_NO: this.entity.TZPZ_NO,
                        "I2P_NO": current.I2P_NO,
                        "POINT_NO": target.id
                    })
                    this.clearMatchLineState()
                    this.$Message.success('匹配成功');
                    this.selectedSurveyPoint = null;
                },
                onCancel() {

                }
            });
        },
        tryRedrawMatchLine() {
            if (!this.matchLineIds) return;
            const { i2pNo, pointNo } = this.matchLineIds;

            const domA = document.getElementById(i2pNo);
            const domB = document.getElementById(pointNo);

            if (!domA || !domB) {
                this.destroyMatchConnectLine();
                return;
            }
            this.createMatchConnectLine(domA, domB);
        },
        clearMatchLineState() {
            this.destroyMatchConnectLine();
            this.matchLineIds = null;
        },
        createMatchConnectLine(domA, domB) {
            this.destroyMatchConnectLine();

            const markerLayer = this.$refs.markerLayer;
            const lineContainer = this.$refs.matchLineContainer;
            if (!markerLayer || !lineContainer || !domA || !domB) return;

            const rectLayer = markerLayer.getBoundingClientRect();
            const rectA = domA.getBoundingClientRect();
            const rectB = domB.getBoundingClientRect();

            // 原始中心点
            const originX1 = rectA.left + rectA.width / 2 - rectLayer.left;
            const originY1 = rectA.top + rectA.height / 2 - rectLayer.top;
            const originX2 = rectB.left + rectB.width / 2 - rectLayer.left;
            const originY2 = rectB.top + rectB.height / 2 - rectLayer.top;

            const gap = 12; // 线条距离元素缩进
            const dx = originX2 - originX1;
            const dy = originY2 - originY1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < gap * 2) return;

            const offsetX = (dx / dist) * gap;
            const offsetY = (dy / dist) * gap;

            // 主线实际起止点
            const x1 = originX1 + offsetX;
            const y1 = originY1 + offsetY;
            const x2 = originX2 - offsetX;
            const y2 = originY2 - offsetY;

            // ========== 箭头参数 ==========
            const arrowLen = 10;    // 箭头长度
            const arrowWidth = 6;   // 箭头半宽
            // 单位方向向量（指向终点）
            const ux = dx / dist;
            const uy = dy / dist;
            // 垂直法向
            const vx = -uy;
            const vy = ux;

            // 箭头三角形三个顶点
            // 箭头尖点：主线终点 x2,y2
            const tipX = x2;
            const tipY = y2;
            // 箭头尾部两个角
            const tail1X = tipX - ux * arrowLen + vx * arrowWidth;
            const tail1Y = tipY - uy * arrowLen + vy * arrowWidth;
            const tail2X = tipX - ux * arrowLen - vx * arrowWidth;
            const tail2Y = tipY - uy * arrowLen - vy * arrowWidth;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.left = 0;
            svg.style.top = 0;
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = 100;
            svg.style.overflow = 'visible';

            // 1.主线实线
            const mainLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            mainLine.setAttribute('x1', x1);
            mainLine.setAttribute('y1', y1);
            mainLine.setAttribute('x2', x2);
            mainLine.setAttribute('y2', y2);
            mainLine.setAttribute('stroke', '#f56c6c');
            mainLine.setAttribute('stroke-width', '2');
            svg.appendChild(mainLine);

            // 2.箭头多边形（不使用marker）
            const arrowPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const pointsStr = `${tipX},${tipY} ${tail1X},${tail1Y} ${tail2X},${tail2Y}`;
            arrowPoly.setAttribute('points', pointsStr);
            arrowPoly.setAttribute('fill', '#f56c6c');
            svg.appendChild(arrowPoly);

            lineContainer.appendChild(svg);
            this.matchSvgWrapper = svg;
        },

        /**
         * 销毁连线
         */
        destroyMatchConnectLine() {
            if (this.matchSvgWrapper) {
                if (this.matchSvgWrapper.parentNode) {
                    this.matchSvgWrapper.parentNode.removeChild(this.matchSvgWrapper);
                }
                this.matchSvgWrapper = null;
            }
        },
        /**
         * 通过 DOM 标记查找最近的标记（替代 CAD 实体查找）
         */
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
                this.$refs.markerLayer.removeEventListener('mousedown', this._onLayerMouseDown)
                this._onCanvasMouseDown = null;
                this._onLayerMouseDown = null
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
                try { const el = document.getElementById(id); if (el) el.remove(); } catch (e) { }
            });
            this.highlightEntIds = [];
        },

        /**
         * 在图纸坐标处添加一个 DOM 临时高亮标记（type='3' 无 pointNo）
         */
        _addDomHighlightMarker(x, y) {
            const draw = MxFun.getCurrentDraw();
            if (!draw) return;
            const screenPos = draw.cadCoord2View(x, y);
            const markerLayer = this.$refs.markerLayer;
            if (!markerLayer || screenPos.x < -20 || screenPos.x > draw.getViewWidth() + 20 ||
                screenPos.y < -20 || screenPos.y > draw.getViewHeight() + 20) return;
            const div = document.createElement('div');
            div.className = 'marker-icon';
            div.style.position = 'absolute';
            div.style.left = (screenPos.x - 5) + 'px';
            div.style.top = (screenPos.y - 5) + 'px';
            div.style.width = '10px';
            div.style.height = '10px';
            div.style.pointerEvents = 'auto';
            div.style.backgroundSize = 'contain';
            div.style.backgroundRepeat = 'no-repeat';
            div.style.backgroundImage = 'url(/image/icon10.svg)';
            markerLayer.appendChild(div);
            this.highlightEntIds.push(div.id || `hl_${Date.now()}_${Math.random().toString(36).slice(2)}`);
            if (!div.id) div.id = this.highlightEntIds[this.highlightEntIds.length - 1];
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
            //if (parent && parent.autoMatch) {
            this.autoMatch({
                TZPZ_NO: this.entity.TZPZ_NO,
                threshold
            })
            this.$Message.success('匹配成功')
            //}
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
            this.selectedSurveyPoint = unmatched[0];
            if (!this.selectedSurveyPoint.PT_X_VALUE || !this.selectedSurveyPoint.PT_Y_VALUE) {
                this.$Message.warning('请选择有坐标的测点');
                return;
            }
            this.setForceShow(this.selectedSurveyPoint.PT_NO)
            this.zoomToPoint(this.selectedSurveyPoint.PT_X_VALUE, this.selectedSurveyPoint.PT_Y_VALUE);
            this._addImageAt(this.selectedSurveyPoint.PT_X_VALUE, this.selectedSurveyPoint.PT_Y_VALUE, '2', { id: this.selectedSurveyPoint.PT_NO, name: this.selectedSurveyPoint.PT_NAM, type: '2' });

            this.matchMode = 'manual-match';
            this._hidePanel1();
            // this._highlightSurveyPoint(this.selectedSurveyPoint);
            // this._highlightUnmatchedCADPoints();
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
                this.setForceShow(valid.PT_NO)
                this._addImageAt(x, y, '2', { id: survey.PT_NO, name: survey.PT_NAM, type: '2' });
            });
            //if (parent && parent.autoAddAndMatch) {
            this.autoAddAndMatch({
                "TZPZ_NO": this.entity.TZPZ_NO,
                I2P_NO: valid[0].I2P_NO
            })
            //}
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
            this.$Modal.confirm({
                title: '提示',
                content: '请选择已匹配状态的测点。点击后弹出提示：解除匹配后不可撤销，确定吗？',
                onOk: () => {
                    //if (parent && parent.cancelMatch) {
                    this.cancelMatch({
                        TZPZ_NO: this.entity.TZPZ_NO,
                        I2P_NO: points[0].I2P_NO
                    })
                    //}
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

                const hoverMarker = this._findMarkerByDistance(mxobj, event.offsetX, event.offsetY);
                if (!hoverMarker) return;
                const pointNo = hoverMarker.biz && hoverMarker.biz.id;
                if (pointNo === undefined) return;
                const point = this.pointList.find(p => p.pointNo === pointNo);
                if (point) {
                    this.setForceShow(point.pointNo)
                }
                if (!point) {
                    this.$Message.warning('请点击一个未匹配的图纸点位');
                    return 0;
                }
                // 弹窗确认
                this.manualMatchCallback(this.selectedSurveyPoint, {
                    id: point.pointNo,
                    title: point.pointName
                })
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
                    this.manPlacePendingX = pt.x;
                    this.manPlacePendingY = pt.y;
                    this.matchMode = null;
                    this.$refs.manualPlaceForm && this.$refs.manualPlaceForm.onFillCoord(pt.x, pt.y);
                    this.manualPlaceVisible = true
                    return 0;
                }
                // 弹窗确认后手动输入坐标的放置模式
                if (this.matchMode === 'manual-place') {
                    this._addImageAt(pt.x, pt.y, '2', { id: this.selectedSurveyPoint.PT_NO, name: this.selectedSurveyPoint.PT_NAM, type: '2' });
                    this._clearHighlights();
                    this.matchMode = null;
                    this.selectedSurveyPoint = null;
                    this.$Message.success('布点成功');
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
            this._addImageAt(x, y, '2', { id: survey.PT_NO, name: survey.PT_NAM, type: '2' });
            survey.coordValue = { x, y };
            console.log({
                "TZPZ_NO": this.entity.TZPZ_NO,
                "X_VALUE": x,
                "Y_VALUE": y
            })
            //if (parent && parent.manualAddAndMatch) {
            this.manualAddAndMatch({
                "TZPZ_NO": this.entity.TZPZ_NO,
                "X_VALUE": x,
                "Y_VALUE": y
            })
            //}
            this.matchMode = null;
            this.selectedSurveyPoint = null;
            this.manualPlaceVisible = false
        },

        /**
         * 弹窗取消
         */
        onAddPoints(points) {
            points.forEach(pt => {
                this.points.push({
                    ...pt,
                    MATCH_STA: '未匹配',
                    POINT_X_VALUE: '',
                    POINT_Y_VALUE: '',
                    MATCH_TYP: '',
                    DALTA_XY: '',
                    POINT_NAM: '',
                    POINT_ID: '',
                    I2P_NO: '',
                    POINT_NO: ''
                })
            })
            this.$Message.success(`已添加 ${points.length} 个测点`)
        },
        onManualPlaceCancel() {
            this.matchMode = null;
            this.selectedSurveyPoint = null;
            this._clearHighlights();
            this.manualPlaceVisible = false
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
