import ViewerPanel from '../components/ViewerPanel/ViewerPanel.vue';
import ViewerPanel1 from '../components/ViewerPanel/ViewerPanel1.vue';
import { createMxCad, MxCpp, McDbCircle, McGePoint3d, McCmColor, McDbXData, McDbPoint, MxCADUtility, McDbBlockReference } from "mxcad";
import { MxFun, MrxDbgUiPrPoint, MrxDbgUtils, McEdGetPointWorldDrawObject, MxDbLine, MxDbCircleShape, MxDbAnyLine, MxDbImage } from "mxdraw";
import { RegistMxCommands, RxInitMxEntity } from "@/test/command";
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
                '04': '已发布',
                '05': '已停用'
            },
            pointList: [],
            layers: [],
            panelCollapsed: true,
            panelCollapsed1: true,
            fileUrlInput: "",
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
                TZPZ_USER_NAM: ''
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
            viewerPanel1Ref: null,
            orgNo: '',
            lastFileUrl: '',
            annotationPoints: [],
            lastHoverGroup: null,
            tempLineObj: null,
            tempArrowHead: null,
            showManualMatchPop: false,
            popoverPos: { x: 0, y: 0 }, //弹窗在画布内坐标
            popData: {
                realPoint: null,
                drawPoint: null,
                matchGap: 0
            },
            pointInfo: '',
            showPointInfoModal: false,
            pointInfoTimer: null,
            detailPos: { x: 0, y: 0 },
            bloomComposer: null,
            // 辉光相关
            bloomComposer: null,
            bloomPass: null,
            bloomRenderCb: null,
            bloomResizeCb: null,
            // 辉光参数（可微调）
            bloomStrength: 0.6,
            bloomRadius: 0.5,
            bloomThreshold: 0.2,
            popoverTargetObj: null, // ✅ 直接存marker对象，不再存popoverWorldPos
            detailTargetObj: null, // ✅ 直接存marker对象，不再存detailWorldPos
            rafId: null,
            needUpdatePop: false,
            highlightTargetId: null,
            highlightMatchId: null,
            highlightLineGroup: null,
            highlightMeshList: [],
            highlightUseTempLine: false,
            isDev: true,
            pointParsed: false,
            annotationMeshMap: new Map(),
            // 多选高亮id集合
            selectedAnnotationSet: new Set(),
            // hover防抖标记
            hoverTick: null,
            isPopOverBottom: false
        }
    },
    components: {
        ViewerPanel,
        ViewerPanel1
    },
    mounted() {
        if (this.isDev) {
            this.pointList = [
                {
                    "X_VALUE": 23369467.890141826,
                    "Y_VALUE": -30382998.077860042,
                    "z": 0,
                    "LAYER_ID": "288127",
                    "LAYER_NAM": "A通风系统图",
                    "POINT_NAM": "A$C379E0320",
                    "POINT_ID": "58a6",
                    "MATCH_STA": "02"
                },
                {
                    "X_VALUE": 23369439.109730206,
                    "Y_VALUE": -30382957.704416513,
                    "z": 0,
                    "LAYER_ID": "288127",
                    "LAYER_NAM": "A通风系统图",
                    "POINT_NAM": "A$C379E0320",
                    "POINT_ID": "58a7",
                    "MATCH_STA": "02"
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
                "TZPZ_STA": "03",
                "resourceUrl": "./models/YTSF-001.mxweb",
                "TZXX_ID": "22",
                "TZLX_NAM": "11",
                "TZ_VERSION": "",
                TZPZ_NO: "",
            }
            this.fileUrlInput = './models/YTSF-001.mxweb'
        }
        const params = new URLSearchParams(location.search)
        this.orgNo = params.get('orgNo') || ''
        if (params.get('TZPZ_NO')) {
            this.entity.TZPZ_NO = params.get('TZPZ_NO')
            this.getTzpzInfo()
        } else if (!this.isDev) {
            this.entity = {
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
            }
        }
        this.currentStep = 0
        // _bindMarkerClickEvent 在 initViewer 内部调用（mxdraw 就绪后）
    },
    computed: {
        ...mapState(['userInfo'])
    },
    watch: {
        '$store.state.userInfo': {
            handler(val) {
                this.entity.TZPZ_USER = val.id
                this.entity.TZPZ_USER_NAM = val.desc
            },
            immediate: true
        },
    },
    beforeDestroy() {
        clearTimeout(this.pointInfoTimer);
        this.destroyAnnotationEvent();
        // this.unlistenPostRender();
        this.unlistenViewChange()
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.clearAllBindMarkers()
        this.matchMode = null;
        this.selectedSurveyPoint = null;
        this.manualPlaceVisible = false;
        this.manualPlaceHasCoordFill = false;
    },
    methods: {
        selectUser() {
            if (parent && parent.selectUser) {
                parent.selectUser()
            }
        },
        getGroupBaseScale(group) {
            const aid = group.userData.annotationId;
            const base = group.userData.originScale;
            if (this.selectedAnnotationSet.has(aid)) {
                return base.clone().multiplyScalar(1.2);  // 选中 → 永久放大1.2
            }
            return base.clone();  // 未选中 → 原始大小
        },
        setGroupHighlight(group, highlight, forceResetScale = false) {
            if (!group) return;
            // 材质发光
            const intensity = highlight ? 0.8 : 0.4;
            group.children.forEach((mesh) => {
                if (!mesh.material) return;
                mesh.material.emissiveIntensity = intensity;
            });

            // 全局清空场景：强制回到原始尺寸，忽略hover标记
            if (forceResetScale) {
                group.scale.copy(group.userData.originScale);
                return;
            }
            // 正常单点切换：如果当前正在hover这个点位，则不覆盖scale，避免hover闪烁
            if (this.lastHoverGroup !== group) {
                group.scale.copy(this.getGroupBaseScale(group));
            }
        },
        toggleAnnotationHighlightById(id) {
            const group = this.annotationMeshMap.get(id);
            if (!group) return;
            if (this.selectedAnnotationSet.has(id)) {
                this.selectedAnnotationSet.delete(id);
                this.setGroupHighlight(group, false);
            } else {
                this.selectedAnnotationSet.add(id);
                this.setGroupHighlight(group, true);
            }
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay(true);
        },
        clearAnnotationHighlight() {
            // 清空选中集合
            this.selectedAnnotationSet.clear();
            // 强制所有点位还原材质+原始scale
            for (const group of this.annotationMeshMap.values()) {
                this.setGroupHighlight(group, false, true);
            }
            // 清除hover缓存兜底，防止后续hover逻辑残留状态
            this.lastHoverGroup = null;
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay(true);
        },
        removeBindMarkerById(id) {
            if (!this.annotationMeshMap.has(id)) return;
            const group = this.annotationMeshMap.get(id);
            const mxObj = MxFun.getCurrentDraw();
            mxObj?.removeObject(group);
            // 删除mesh缓存
            this.annotationMeshMap.delete(id);
            // 删除业务数据
            this.annotationPoints = this.annotationPoints.filter((p) => p.id !== id);
            // 同步移除选中高亮
            this.selectedAnnotationSet.delete(id);
            mxObj && mxObj.updateDisplay(true);
        },
        renderMarkersByList(data) {
            data.forEach(bind => {
                this.addBindMarker(bind);
            });
        },
        setAnnotationHighlightById(targetId, bindMatchId) {
            // 先清上次高亮
            this.clearAnnotationHighlight();
            this.destroyTempLine()
            if (!targetId) return;
            this.selectedAnnotationSet.add(targetId)
            this.setGroupHighlight(this.annotationMeshMap.get(targetId), true)
            let targetPoint = this.annotationPoints.find(item => item.id === targetId);
            if (bindMatchId) {
                this.selectedAnnotationSet.add(bindMatchId)
                this.setGroupHighlight(this.annotationMeshMap.get(bindMatchId), true)
                const bindPoint = this.annotationPoints.find(item => item.id === bindMatchId);
                const startWorld = {
                    x: targetPoint.x,
                    y: targetPoint.y,
                    z: targetPoint.z || 0
                };
                const endWorld = {
                    x: bindPoint.x,
                    y: bindPoint.y,
                    z: bindPoint.z || 0
                };
                this.createTempLine(startWorld, endWorld);
                this.highlightUseTempLine = true;
            }

            this.highlightTargetId = targetId;
            const mxObj = MxFun.getCurrentDraw();
            if (mxObj) mxObj.updateDisplay(true);
        },
        world2Screen(worldPos) {
            if (!worldPos) return null;
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return null;
            const canvas = document.getElementById("mxcad");
            if (!canvas) return null;
            const screenPt = MxFun.worldCoord2Screen(worldPos.x, worldPos.y, worldPos.z || 0);
            const rect = canvas.getBoundingClientRect();
            return {
                x: screenPt.x,
                y: screenPt.y,
                rect
            };
        },
        // 统一更新标记，放入raf节流
        markNeedUpdate() {
            this.needUpdatePop = true;
            if (!this.rafId) {
                this.rafId = requestAnimationFrame(() => {
                    this.refreshAllPopPos();
                    this.rafId = null;
                    this.needUpdatePop = false;
                });
            }
        },
        refreshAllPopPos() {
            // 匹配弹窗
            if (this.showManualMatchPop && this.popoverTargetObj) {
                const worldPos = new THREE.Vector3();
                worldPos.setFromMatrixPosition(this.popoverTargetObj.matrixWorld); // ✅ 实时读取最新矩阵
                const res = this.world2Screen(worldPos);
                if (res) {
                    const rawX = res.x;
                    const rawY = res.y + 24;
                    // 不做边界溢出处理，直接赋值
                    this.popoverPos = { x: rawX, y: rawY }
                    // ===== 新增：判断弹窗下方是否超出屏幕 =====
                    const popHeight = 165; // 弹窗高度，和上面adjustPopBoundary第二个高度参数保持一致
                    const popBottom = rawY + popHeight;
                    const screenHeight = res.rect.height; // 画布/视口高度
                    // 标记是否向下溢出
                    this.isPopOverBottom = popBottom > screenHeight;
                }
            }
            // 详情弹窗
            if (this.showPointInfoModal && this.detailTargetObj) {
                const worldPos = new THREE.Vector3();
                worldPos.setFromMatrixPosition(this.detailTargetObj.matrixWorld);
                const res = this.world2Screen(worldPos);
                if (res) {
                    const rawX = res.x + 24;
                    const rawY = res.y - 15;
                    this.detailPos = { x: rawX, y: rawY }
                }
            }
        },
        listenCanvasViewChange() {
            const mxObj = MxFun.getCurrentDraw();
            // mxdraw视图变化事件（平移、滚轮缩放都会触发）
            this.viewChangeHandler = () => {
                this.markNeedUpdate();
            };
            mxObj.on("viewchange", this.viewChangeHandler);
            // 浏览器窗口大小变化
            this.winResizeHandler = () => {
                this.markNeedUpdate();
            };
            window.addEventListener("resize", this.winResizeHandler);
        },
        unlistenViewChange() {
            const mxObj = MxFun.getCurrentDraw();
            if (this.viewChangeHandler && mxObj) {
                mxObj.off("viewchange", this.viewChangeHandler);
            }
            if (this.winResizeHandler) {
                window.removeEventListener("resize", this.winResizeHandler);
            }
        },
        initAnnotationClick() {
            const canvas = document.getElementById("mxcad");
            if (!canvas) {
                console.warn("[标注点] 未找到 canvas 元素，1秒后重试");
                setTimeout(() => this.initAnnotationClick(), 1000);
                return;
            }
            canvas.addEventListener("mousedown", this.handleAnnotationClick, true);
            canvas.addEventListener("mousemove", this.handleAnnotationHover);
        },
        destroyAnnotationEvent() {
            const canvas = document.getElementById("mxcad");
            if (canvas) {
                canvas.removeEventListener("mousedown", this.handleAnnotationClick, true);
                canvas.removeEventListener("mousemove", this.handleAnnotationHover);
            }
            // this.tooltip.show = false;
            this.clearAnnotationHighlight()
            this.destroyTempLine()
        },
        handleAnnotationHover(e) {
            if (this.hoverTick) return;
            this.hoverTick = requestAnimationFrame(() => {
                try {
                    if (this.isAddingAnnotation) return;
                    const canvas = document.getElementById("mxcad");
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const mxObj = MxFun.getCurrentDraw();
                    if (!mxObj) return;
                    const scene = mxObj.getScene?.();
                    const camera = mxObj.getCamera?.();
                    if (!scene || !camera) return;
                    const ndcX = (mouseX / rect.width) * 2 - 1;
                    const ndcY = -(mouseY / rect.height) * 2 + 1;
                    const raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
                    const intersects = raycaster.intersectObjects(scene.children, true);
                    let hoverTargetGroup = null;
                    for (const intersect of intersects) {
                        if (intersect.object.userData?.isWaveRing) continue;
                        let curObj = intersect.object;
                        while (curObj) {
                            if (curObj.userData && curObj.userData.isAnnotationPoint) {
                                hoverTargetGroup = curObj;
                                break;
                            }
                            curObj = curObj.parent;
                        }
                        if (hoverTargetGroup) break;
                    }
                    // 清理上一次hover
                    if (this.lastHoverGroup) {
                        this.lastHoverGroup.scale.copy(this.getGroupBaseScale(this.lastHoverGroup));
                        this.lastHoverGroup = null;
                    }
                    if (hoverTargetGroup) {
                        if (!hoverTargetGroup.userData.originScale) {
                            hoverTargetGroup.userData.originScale = hoverTargetGroup.scale.clone();
                        }
                        hoverTargetGroup.scale.copy(hoverTargetGroup.userData.originScale).multiplyScalar(1.2);
                        this.lastHoverGroup = hoverTargetGroup;
                    }
                    canvas.style.cursor = hoverTargetGroup ? "pointer" : "";
                    mxObj.updateDisplay(true);
                } catch (err) {
                    console.error("hover异常", err);
                } finally {
                    this.hoverTick = null;
                }
            });
        },

        async handleAnnotationClick(e) {
            try {
                if (this.isAddingAnnotation) return;
                if (this.annotationPoints.length === 0) return;
                const canvas = document.getElementById("mxcad");
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                const mxObj = MxFun.getCurrentDraw();
                if (!mxObj) return;
                const scene = mxObj.getScene?.();
                const camera = mxObj.getCamera?.();
                if (!scene || !camera) return;

                const ndcX = (clickX / rect.width) * 2 - 1;
                const ndcY = -(clickY / rect.height) * 2 + 1;
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
                const intersects = raycaster.intersectObjects(scene.children, true);
                if (this.matchMode === 'manual-match') {
                    if (!this.selectedSurveyPoint) return;

                    for (const inter of intersects) {
                        if (inter.object.userData?.isWaveRing) continue;
                        let curObj = inter.object;
                        while (curObj) {
                            if (curObj.userData && curObj.userData.isAnnotationPoint) {
                                const ud = curObj.userData;
                                const id = curObj.userData.annotationId;
                                const targetDrawPoint = this.annotationPoints.find(b => b.id === id);
                                if (!targetDrawPoint) {
                                    curObj = curObj.parent;
                                    continue;
                                };
                                if (!targetDrawPoint.id || targetDrawPoint.type === '2' || targetDrawPoint.MATCH_STA === '02') {
                                    curObj = curObj.parent;
                                    continue;
                                }
                                // 绘制临时连线
                                const realScreen = MxFun.docCoord2Screen(
                                    this.selectedSurveyPoint.PT_X_VALUE,
                                    this.selectedSurveyPoint.PT_Y_VALUE
                                );
                                this.selectedAnnotationSet.add(id)
                                this.setGroupHighlight(this.annotationMeshMap.get(id), true)
                                const drawScreen = MxFun.docCoord2Screen(targetDrawPoint.x, targetDrawPoint.y);
                                const startVec = { x: this.selectedSurveyPoint.PT_X_VALUE, y: this.selectedSurveyPoint.PT_Y_VALUE };
                                const endVec = { x: targetDrawPoint.x, y: targetDrawPoint.y };
                                this.createTempLine(startVec, endVec);
                                const emitData = {
                                    realPoint: this.selectedSurveyPoint,
                                    drawPoint: targetDrawPoint,
                                    // matchGap: Number(gap.toFixed(2))
                                };
                                this.popoverTargetObj = curObj;
                                // 立刻计算一次屏幕位置
                                this.markNeedUpdate();
                                this.popData = {
                                    realPoint: this.selectedSurveyPoint,
                                    drawPoint: targetDrawPoint,
                                    // matchGap: Number(gap.toFixed(2))
                                };
                                this.showManualMatchPop = true;
                                return
                            }
                            curObj = curObj.parent;
                        }
                    }
                    return;
                }
                let hitAnnotationId = null;
                let hitTargetObj = null;
                for (const intersect of intersects) {
                    if (intersect.object.userData?.isWaveRing) continue;
                    let curObj = intersect.object;
                    // =========关键：向上遍历父节点，找到标记根group=========
                    while (curObj) {
                        if (curObj.userData && curObj.userData.isAnnotationPoint) {
                            const id = curObj.userData.annotationId;
                            const bindItem = this.annotationPoints.find(b => b.id === id);
                            if (bindItem) {
                                hitAnnotationId = id;
                                hitTargetObj = curObj;
                                break;
                            }
                        }
                        curObj = curObj.parent;
                    }
                    if (hitAnnotationId) break;
                }
                if (hitAnnotationId && hitTargetObj) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.detailTargetObj = hitTargetObj;
                    this.markNeedUpdate();
                    const bindItem = this.annotationPoints.find(b => b.id === hitAnnotationId);
                    this.pointInfo = bindItem.type === "1" ? `图纸点位：${bindItem.name}` : `实时测点：${bindItem.name}`;
                    this.showPointInfoModal = true;
                    clearTimeout(this.pointInfoTimer);
                    this.pointInfoTimer = setTimeout(() => {
                        this.showPointInfoModal = false;
                        this.pointInfoTimer = null;
                    }, 3000);
                    // 切换该点位高亮（多选/取消）
                    this.clearAnnotationHighlight();
                    this.toggleAnnotationHighlightById(hitAnnotationId);
                } else {
                    // 空白区域点击，清空所有高亮
                    this.clearAnnotationHighlight();
                    this.destroyTempLine()
                }
            } catch (err) {
                console.error("点击marker异常", err);
            }
        },
        //关闭弹窗，销毁箭头连线
        closeManualPop() {
            this.showManualMatchPop = false;
            this.clearAnnotationHighlight();
            this.destroyTempLine();
            this.popData = { realPoint: null, drawPoint: null, matchGap: 0 };
        },

        //点击匹配按钮
        async handlePopConfirm() {
            const { realPoint, drawPoint } = this.popData;
            await this.manualMatchCallback(realPoint, {
                id: drawPoint.id,
                title: drawPoint.name
            });
            this.showAllPoint()
            this.closeManualPop();
        },
        createTempLine(startWorld, endWorld) {
            this.destroyTempLine();
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return;

            const start = new THREE.Vector3(startWorld.x, startWorld.y, startWorld.z || 0);
            const end = new THREE.Vector3(endWorld.x, endWorld.y, endWorld.z || 0);
            const p2Rel = end.clone().sub(start);
            const dist = p2Rel.length();
            if (dist < 0.05) {
                console.warn("两点距离过小，跳过绘制连线");
                return;
            }
            const dir = p2Rel.clone().normalize();

            // 线段
            const points = [new THREE.Vector3(0, 0, 0), p2Rel];
            const geoLine = new THREE.BufferGeometry().setFromPoints(points);
            const matLine = new THREE.LineBasicMaterial({
                color: 0xff0000,
                depthTest: false,
                depthWrite: false
            });
            const line = new THREE.Line(geoLine, matLine);
            line.renderOrder = 9997; // ✅ 置顶层级，和你marker保持统一

            // 箭头圆锥
            const arrowSize = 6; // ✅ 调大默认尺寸，世界坐标，可视性更好
            const arrowGap = 6;
            const coneGeo = new THREE.ConeGeometry(arrowSize * 0.4, arrowSize, 4);
            const coneMat = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                depthTest: false,
                depthWrite: false
            });
            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.renderOrder = 9997;
            const quat = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir
            );
            cone.quaternion.copy(quat);
            cone.position.copy(p2Rel).addScaledVector(dir, -arrowSize / 2 - arrowGap);

            this.tempLineGroup = new THREE.Group();
            this.tempLineGroup.position.copy(start);
            this.tempLineGroup.add(line);
            this.tempLineGroup.add(cone);

            // ✅ 关键！不用 scene.add，使用 mxObj.addObject 托管（mxdraw标准写法）
            mxObj.addObject(this.tempLineGroup);

            // ✅ 删掉手动render、autoClear=false 这套逻辑！不再使用postRender二次渲染
            // this.postRenderCb = () => { renderer.render(scene, camera); };
            // mxObj.on("postRender", this.postRenderCb);

            // 视口刷新监听（平移缩放同步）
            this.viewChangeCb = () => {
                mxObj.updateDisplay(true);
            };
            mxObj.on("viewchange", this.viewChangeCb);

            mxObj.updateDisplay(true);
        },

        // 配套销毁方法，避免残留
        destroyTempLine() {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj || !this.tempLineGroup) {
                console.log('destroyTempLine: 无实例直接return');
                return;
            }
            console.log('destroyTempLine: 开始移除临时线组', this.tempLineGroup);
            // 解绑事件
            if (this.viewChangeCb) {
                mxObj.off("viewchange", this.viewChangeCb);
                this.viewChangeCb = null;
            }
            if (this.postRenderCb) {
                mxObj.off("postRender", this.postRenderCb);
                this.postRenderCb = null;
            }
            // 资源释放
            this.tempLineGroup.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
            // ✅ mxdraw 兜底：先尝试remove，再从场景直接移除（很多mxdraw版本removeObject失效）
            try {
                mxObj.removeObject(this.tempLineGroup);
                // 直接从three场景兜底删除
                if (this.tempLineGroup.parent) {
                    this.tempLineGroup.parent.remove(this.tempLineGroup);
                }
            } catch (e) {
                console.warn('remove tempLine error', e);
            }
            this.tempLineGroup = null;
            this.highlightUseTempLine = false; // ✅ 关键！把标记置false
            mxObj.updateDisplay(true);
            console.log('destroyTempLine: 销毁完成');
        },
        showBindPointInfo(bindItem) {
            this.currentEditPoint = bindItem;
            this.showPointInfoModal = true;
        },
        clearAllBindMarkers() {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return;
            const scene = mxObj.getScene?.();
            if (!scene) return;

            // 遍历场景全部子物体，找到所有标注组
            const toRemove = [];
            scene.traverse((obj) => {
                if (obj.userData && obj.userData.isAnnotationPoint) {
                    toRemove.push(obj);
                }
            });

            toRemove.forEach(group => {
                // 释放group内部所有mesh的geometry、material
                group.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
                // 从场景移除
                mxObj.removeObject(group);
            });

            // 清空hover缓存，防止残留状态
            this.lastHoverGroup = null;
            this.annotationPoints = []
            mxObj.updateDisplay(true);
        },
        /**
         * 按 ID 批量删除画布上的绑定点位（3D mesh）
         * @param {string[]} ids - 要删除的 annotationId（即 PT_NO）
         */
        clearBindMarkersByIds(ids) {
            if (!ids || ids.length === 0) return;
            const idSet = new Set(ids);
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return;
            const scene = mxObj.getScene?.();
            if (!scene) return;

            const toRemove = [];
            scene.traverse((obj) => {
                if (obj.userData && obj.userData.isAnnotationPoint && idSet.has(obj.userData.annotationId)) {
                    toRemove.push(obj);
                }
            });

            toRemove.forEach(group => {
                group.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
                mxObj.removeObject(group);
                // 同步从 annotationPoints 中移除
                const idx = this.annotationPoints.findIndex(item => item.id === group.userData.annotationId);
                if (idx !== -1) {
                    this.annotationPoints.splice(idx, 1);
                }
            });

            this.lastHoverGroup = null;
            mxObj.updateDisplay(true);
        },
        hasMarkerById(id) {
            return this.annotationPoints.some(item => item.id === id);
        },
        createBindMarker(bindItem) {
            if (this.hasMarkerById(bindItem.id)) {
                console.log(`点位${bindItem.id}已存在，跳过创建`);
                return null;
            }
            this.annotationPoints.push(bindItem)
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return null;
            const docX = bindItem.x;
            const docY = bindItem.y;
            const docZ = bindItem.z || 0;
            const baseSize = 10;
            const group = new THREE.Object3D();
            group.position.set(docX, docY, docZ);
            group.userData = {
                isAnnotationPoint: true,
                annotationId: bindItem.id,
                originScale: new THREE.Vector3(baseSize, baseSize, 1),
                type: bindItem.type,
                // 存储光晕实例和动画帧ID
                ringMesh: null,
                ringAnimId: null
            };

            if (bindItem.type === "2") {
                // 绿色方块 #26C557 + 白色边框
                const geoSquare = new THREE.PlaneGeometry(1, 1);
                const matSquare = new THREE.MeshStandardMaterial({
                    color: 0x26c557,
                    emissive: 0x26c557,
                    emissiveIntensity: 0.4,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                const squareMesh = new THREE.Mesh(geoSquare, matSquare);
                squareMesh.renderOrder = 9999;
                const geoBorder = new THREE.PlaneGeometry(1.2, 1.2);
                const matBorder = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.2,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                const borderMesh = new THREE.Mesh(geoBorder, matBorder);
                borderMesh.renderOrder = 9998;
                group.add(borderMesh);
                group.add(squareMesh);
            } else {
                // 红色圆点 #EC3000
                const geoCircle = new THREE.CircleGeometry(0.5, 32);
                const matCircle = new THREE.MeshStandardMaterial({
                    color: 0xec3000,
                    emissive: 0xec3000,
                    emissiveIntensity: 0.4,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                const circleMesh = new THREE.Mesh(geoCircle, matCircle);
                circleMesh.renderOrder = 9999;
                group.add(circleMesh);
            }

            group.scale.set(baseSize, baseSize, 1);
            this.annotationMeshMap.set(bindItem.id, group);
            mxObj.addObject(group);
            mxObj.updateDisplay(true);
            return group;
        },
        onSelectTz(data) {
            this.entity.TZXX_NO = data.TZXX_NO
            this.entity.TZXX_ID = data.TZXX_ID
            this.entity.TZLX_NAM = data.TZLX_NAM
            this.entity.TZ_VERSION = data.TZ_VERSION
            if (data.resourceUrl && this.lastFileUrl !== data.resourceUrl) {
                this.fileUrlInput = data.resourceUrl
                this.pointParsed = false
            }
            // this.entity.TZLX_NAM = data.TZLX_NAM
        },
        async postData(url = "", data = {}) {
            data.param_orgNo = this.orgNo
            const response = await fetch(url, {
                method: "POST",

                body: JSON.stringify(data),
            });
            return response.json();
        },
        selectTz() {
            this.showTz = true
        },
        stopVersion() {
            this.$Modal.confirm({
                title: '提示',
                content: '停用后前台将无法展示，确定停用吗？停用后，页面跳转至点位绑定页面',
                onOk: () => {
                    this.upsertTzpp({
                        "TZPZ_STA": '05',
                        "TZPZ_NO": this.entity.TZPZ_NO
                    })
                }
            })
        },
        setDefault() {
            this.setDefaultTZPZ({ TZPZ_NO: this.entity.TZPZ_NO })
        },
        setDefaultTZPZ(data) {
            this.postData('/api/scaqyzt/setDefaultTZPZ', data).then(data => {
                if (data.data.flg) {
                    this.$Message.success('设置默认页成功')
                } else {
                    this.$Message.error('设置默认页失败')
                }

            })
        },
        upsertTzpp(data) {
            this.postData('/api/scaqyzt/upsertTzpp', data).then(data => {
                this.entity.TZPZ_NO = data.data.TZPZ_NO || this.entity.TZPZ_NO
                this.getTzpzInfo()
            })
        },
        getTzpzInfo() {
            this.postData('/api/scaqyzt/getTzpzInfo', {
                "TZPZ_NO": this.entity.TZPZ_NO
            }).then(data => {
                this.entity = { ...this.entity, ...data.data }
                this.fileUrlInput = data.data.resourceUrl || ''
                this.lastFileUrl = this.fileUrlInput
                if (this.entity.TZPZ_STA && this.entity.TZPZ_STA != '01') {
                    this.pointParsed = true
                }
            })
        },
        upsertLayer(data) {
            this.postData('/api/scaqyzt/upsertLayer', data).then(data => {

            })
        },
        upsertPoint(data) {
            this.postData('/api/scaqyzt/upsertPoint', data).then(data => {
                this.getPoint(true)
                this.pointParsed = true
                this.upsertTzpp({
                    "TZPZ_STA": '02',
                    "TZPZ_NO": this.entity.TZPZ_NO
                })
            })
        },
        getPoint(flag) {
            this.postData('/api/scaqyzt/getPoint', {
                "pageSize": "10000",
                "pageNum": "1",
                "TZPZ_NO": this.entity.TZPZ_NO
            }).then(data => {
                this.pointList = data.data.data.map(item => {
                    item.id = item.POINT_NO || item.POINT_ID,
                        item.pointName = item.POINT_NAM
                    item.pointNo = item.POINT_ID
                    item.x = item.X_VALUE
                    item.y = item.Y_VALUE
                    return item
                })
                if (flag) {
                    this.renderMarkersByList(this.pointList.map(item => {
                        item.id = item.POINT_NO,
                            item.name = item.pointName,
                            item.type = '1'
                        return item
                    }));
                }

            })
        },
        upsertIot(data) {
            this.postData('/api/scaqyzt/upsertIot', data).then(() => {
                this.refreshViewer1Data()
            })
        },
        deleteIot(data, ptNos) {
            this.postData('/api/scaqyzt/deleteIot', data).then(() => {
                // 清理画布上对应点位
                if (ptNos && ptNos.length) {
                    this.clearBindMarkersByIds(ptNos);
                }
                this.refreshViewer1Data();
            })
        },
        refreshViewer1Data() {
            if (this.$refs.viewerPanel1) {
                this.$refs.viewerPanel1.refreshData();
            }
        },
        autoMatch(data) {
            this.postData('/api/scaqyzt/autoMatch', data).then(() => {
                this.refreshViewer1Data()
                this.getPoint()
            })
        },
        manualMatch(data) {
            this.postData('/api/scaqyzt/manualMatch', data).then(() => {
                this.refreshViewer1Data()
                this.getPoint()
            })
        },
        autoAddAndMatch(data) {
            this.postData('/api/scaqyzt/autoAddAndMatch', data).then(() => {
                this.refreshViewer1Data()
            })
        },
        manualAddAndMatch(data) {
            this.postData('/api/scaqyzt/manualAddAndMatch', data).then(() => {
                this.refreshViewer1Data()
            })
        },
        cancelMatch(data) {
            this.postData('/api/scaqyzt/cancelMatch', data).then(() => {
                this.refreshViewer1Data()
            })
        },
        onFabu() {
            this.postData('/api/scaqyzt/upsertTzpp', {
                "TZPZ_NO": this.entity.TZPZ_NO,
                "TZPZ_STA": '04',
            }).then(data => {
                if (data.data.flg) {
                    this.entity.TZPZ_STA = '04'
                    this.onStep(3)
                } else {
                    this.$Message.error('请完成点位绑定')
                }

            })
        },
        save() {
            if (this.entity.TZPZ_STA === '01') {
                if (this.currentStep === 0) {
                        console.log(typeof this.entity.TZPZ_STA)
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
                    })
                } else if (this.currentStep === 1) {
                    this.upsertPoint(
                        {
                            "TZPZ_NO": this.entity.TZPZ_NO,
                            data: this.pointList.map(item => {
                                return {
                                    "POINT_NO": "",
                                    "POINT_ID": item.no,
                                    "POINT_NAM": item.name,
                                    "X_VALUE": item.x,
                                    "Y_VALUE": item.y,
                                    "LAYER_NO": "",
                                    "LAYER_ID": item.LAYER_ID,
                                    "LAYER_NAM": item.LAYER_NAM
                                }
                            })
                        }
                    )
                }

            }
        },
        async onStep(index) {
            if (this.currentStep > index) {
                this.currentStep = index
                return
            }
            if (index == 3) {
                if (this.entity.TZPZ_STA !== '04') {
                    this.$Message.error('请完成点位绑定并执行发布后再进行下一步操作')
                    return
                }
                this.currentStep = index
            } else if (index == 2) {
                if (this.entity.TZPZ_STA === '01' || !this.entity.TZPZ_STA) {
                    this.$Message.error('请完成解析图纸后再进行下一步操作')
                    return
                }
                this.currentStep = index
            } else if (index == 1) {
                this.$refs.sForm.validate(async (valid) => {
                    if (!valid) {
                        this.$Message.error('请填写信息保存后再进行下一步操作')
                        return
                    }
                    if (this.entity.TZPZ_STA === '01' || !this.entity.TZPZ_STA) {
                        this.save()
                    }
                    if (this.fileUrlInput !== this.lastFileUrl) {
                        if (this.mxcad) {
                            this.clearAllBindMarkers()
                            await this.mxcad.openWebFile(this.fileUrlInput)
                        }
                        this.lastFileUrl = this.fileUrlInput;
                    }
                    this.currentStep = index
                })
            } else {
                this.currentStep = index
            }
            if (index > 0) {
                if (!this.mxcad) {
                    console.log(this.fileUrlInput, 2222)
                    this.initViewer()
                    this.$nextTick(() => {
                        this.initCtrlPan();
                    });
                }
            }
        },
        async initViewer() {
            try {
                this.loading = true;
                this.loadingText = "正在初始化查看器...";
                this.loadingStep = "加载核心模块";
                this.loadingProgress = 10;
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
                MxFun.listenForCommandLineInput((msg) => {
                    // 如果有测量结果，更新显示
                    if (msg.msCmdDisplay && msg.msCmdDisplay.length > 0) {
                        this.measureResult = msg.msCmdDisplay;
                    }
                });

                this.viewerReady = true;
                this.loadingProgress = 100;
                this.fileName = this.fileUrlInput.split("/").pop() || "remote";

            } catch (error) {
                console.error("MxCAD 初始化失败:", error);
                this.loading = false;
                this.$Message.error("MxCAD 查看器初始化失败: " + error.message);
            }
            this.initAnnotationClick()
            this.listenCanvasViewChange();
        },
        /**
       * 文件加载完成回调
       */

        async onFileLoaded() {
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
            if (this.entity.TZPZ_STA === '01' || !this.entity.TZPZ_STA) {
                const pointList = await this.getAllMcDbPoint();
                this.upsertPoint(
                    {
                        "TZPZ_NO": this.entity.TZPZ_NO,
                        data: pointList.map(item => {
                            return {
                                "POINT_NO": "",
                                "POINT_ID": item.no,
                                "POINT_NAM": item.name,
                                "X_VALUE": item.x,
                                "Y_VALUE": item.y,
                                "LAYER_NO": "",
                                "LAYER_ID": item.LAYER_ID,
                                "LAYER_NAM": item.LAYER_NAM
                            }
                        })
                    }
                )
            } else {
                this.getPoint(true)
            }
            if (this.isDev) {
                this.renderMarkersByList(this.pointList.map(item => {
                    item.id = item.POINT_NO || item.pointNo,
                        item.name = item.pointName,
                        item.type = '1'
                    return item
                }));
                this.pointParsed = true
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
        zoomToPoint(x, y, id, zoomFactor = 3) {
            const strX = String(x ?? '').trim();
            const strY = String(y ?? '').trim();
            if (strX === '' || strY === '') {
                console.warn(`[zoomToPoint] 坐标为空字符串，跳过 x=${x},y=${y}`);
                return;
            }
            // 转为数字
            const numX = Number(x);
            const numY = Number(y);
            // 判断是否是有效数字（修复0被误拦截问题）
            if (isNaN(numX) || isNaN(numY)) {
                console.warn(`[zoomToPoint] 坐标无效，非数字 x=${x},y=${y}`);
                return;
            }
            if (!this.mxcad || !this.mxcad.zoomCenter || !this.mxcad.zoomScale) return;

            try {
                // 获取图纸实体包围盒，校验坐标是否在图纸范围内
                const { minPt, maxPt } = this.mxcad.getDatabase().currentSpace.getBoundingBox();
                // 超出图纸边界直接拒绝定位
                if (numX < minPt.x || numX > maxPt.x || numY < minPt.y || numY > maxPt.y) {
                    console.warn(`[zoomToPoint] 坐标(${numX},${numY})超出图纸范围，放弃定位`);
                    return;
                }

                this.mxcad.zoomCenter(numX, numY);
                this.mxcad.zoomScale(zoomFactor);
                this.clearAnnotationHighlight()
                this.toggleAnnotationHighlightById(id)
                this.mxcad.updateDisplay(); // 强制刷新画布，重要
                console.log(`[zoomToPoint] 定位到 (${numX}, ${numY}) scale=${zoomFactor}`);
            } catch (e) {
                console.error('[zoomToPoint] 失败:', e);
            }
        },

        async zoomToPoint1(row, zoomFactor = 3) {
            try {
                if (row.MATCH_STA == '02' && !this.hasMarkerById(row.PT_NO)) {
                    const group = this.addBindMarker({
                        id: row.PT_NO,
                        name: row.PT_NAM,
                        x: row.PT_X_VALUE,
                        y: row.PT_Y_VALUE,
                        z: 0,
                        type: '2',
                        ...row
                    })
                }
                this.zoomToPoint(row.PT_X_VALUE, row.PT_Y_VALUE)
                this.panelCollapsed1 = true
                this.$nextTick(() => {
                    this.setAnnotationHighlightById(row.PT_NO, row.POINT_NO)
                })
            } catch (e) {
                console.error('[zoomToPoint] 失败:', e);
            }
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
            if (points.some(item => item.MATCH_STA === '02')) {
                this.$Message.warning('只能选择未匹配的测点');
                return;
            }
            this.$Modal.confirm({
                title: '提示',
                content: '确定要删除所选测点嘛？',
                onOk: () => {
                    const ptNos = points.map(item => item.PT_NO);
                    this.deleteIot({
                        TZPZ_NO: this.entity.TZPZ_NO,
                        I2P_NOs: points.map(item => item.I2P_NO)
                    }, ptNos);
                }
            })
        },
        manualMatchCallback(current, target) {
            this.manualMatch({
                TZPZ_NO: this.entity.TZPZ_NO,
                "I2P_NO": current.I2P_NO,
                "POINT_NO": target.id
            })
            this.$Message.success('匹配成功');
            this.selectedSurveyPoint = null;
            this.matchMode = null
        },

        // ============== 坐标解析 ==============
        _parseSurveyCoord(survey) {

            if (survey.PT_X_VALUE && survey.PT_Y_VALUE) return [parseFloat(survey.PT_X_VALUE), parseFloat(survey.PT_Y_VALUE)];
            return null;
        },
        _hidePanel1() {
            this.panelCollapsed1 = true;
        },
        /**
         * 三、自动匹配
         */
        onAutoMatch(points, threshold) {
            this.autoMatch({
                TZPZ_NO: this.entity.TZPZ_NO,
                threshold
            })
        },
        addBindMarker(data) {
            this.createBindMarker(data)
        },
        /**
         * 四、人工匹配
         */
        async onManualMatch(points) {
            if (!points || points.length !== 1) {
                this.$Message.warning('请选择一个未匹配状态的测点');
                return;
            }
            const unmatched = points.filter(p => p.MATCH_STA !== '02');
            if (unmatched.length === 0) {
                this.$Message.warning('请选择一个未匹配状态的测点');
                return;
            }
            this.selectedSurveyPoint = unmatched[0];
            if (!this.selectedSurveyPoint.PT_X_VALUE || !this.selectedSurveyPoint.PT_Y_VALUE) {
                this.$Message.warning('请选择有坐标的测点');
                return;
            }
            this.destroyTempLine()
            this.hideMatchPoint()
            this.zoomToPoint(this.selectedSurveyPoint.PT_X_VALUE, this.selectedSurveyPoint.PT_Y_VALUE);
            this.addBindMarker({
                id: this.selectedSurveyPoint.PT_NO,
                name: this.selectedSurveyPoint.PT_NAM,
                x: this.selectedSurveyPoint.PT_X_VALUE,
                y: this.selectedSurveyPoint.PT_Y_VALUE,
                z: 0,
                type: '2',
                ...this.selectedSurveyPoint
            })
            this.selectedAnnotationSet.add(this.selectedSurveyPoint.PT_NO)
            this.matchMode = 'manual-match';
            this.$nextTick(() => {
                this.setGroupHighlight(this.annotationMeshMap.get(this.selectedSurveyPoint.PT_NO), true)
            })
            this._hidePanel1();
            this.$Message.info('请在图纸上点击一个未匹配的图纸点位完成匹配');
        },
        hideMatchPoint() {
            this.pointList.forEach(item => {
                if (item.MATCH_STA === '02') {
                    const group = this.annotationMeshMap.get(item.POINT_NO || item.POINT_ID)
                    const key = item.POINT_NO || item.POINT_ID
                    console.log('【隐藏】key', key, '是否存在map', this.annotationMeshMap.has(key), group)
                    if (group) {
                        group.visible = false
                    }
                }
            })
            const mxObj = MxFun.getCurrentDraw();
            if (mxObj) mxObj.updateDisplay(true);
        },
        showAllPoint() {
            this.pointList.forEach(item => {
                const group = this.annotationMeshMap.get(item.POINT_NO || item.POINT_ID)
                const key = item.POINT_NO || item.POINT_ID
                console.log('【显示】key', key, '是否存在map', this.annotationMeshMap.has(key), group)
                if (group) {
                    group.visible = true
                }
            })
            const mxObj = MxFun.getCurrentDraw();
            if (mxObj) mxObj.updateDisplay(true);
        },
        /**
         * 五、自动布点
         */
        onAutoPlace(points) {
            const pts = points;
            const valid = pts.filter(p =>
                p.MATCH_STA !== '02' && this._parseSurveyCoord(p)
            );
            if (valid.length !== 1) {
                this.$Message.warning('请选择一个未匹配且有坐标的测点');
                return;
            }
            this._hidePanel1()
            valid.forEach(async survey => {
                const coord = this._parseSurveyCoord(survey);
                if (!coord) return;
                const [x, y] = coord;
                const mesh = await this.createBindMarker({
                    id: survey.PT_NO,
                    name: survey.PT_NAM,
                    x: x,
                    y: y,
                    z: 0,
                    type: '2',
                    ...survey
                })
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
            const unmatched = points.filter(p => p.MATCH_STA !== '02');
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
            if (points.some(item => item.MATCH_STA !== '02')) {
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
         * 弹窗"选择坐标"按钮触发的图纸拾取
         */
        async onPickCoordinateFromCanvas() {
            this.matchMode = 'manual-place-pick';
            this.manualPlaceVisible = false
            const getPoint = new MrxDbgUiPrPoint();
            const point = await getPoint.go();
            if (!point) {
                return
            }

            this.manPlacePendingX = point.x;
            this.manPlacePendingY = point.y;
            this.matchMode = null;
            this.$refs.manualPlaceForm && this.$refs.manualPlaceForm.onFillCoord(point.x, point.y);

            this.manualPlaceVisible = true
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
        async onManualPlaceConfirm(coords) {
            if (!this.selectedSurveyPoint) return;
            const survey = this.selectedSurveyPoint;
            const { x, y } = coords;
            // 添加标记
            this.addBindMarker({
                id: survey.PT_NO,
                name: survey.PT_NAM,
                x: x,
                y: y,
                z: 0,
                type: '2',
                ...survey
            })
            //if (parent && parent.manualAddAndMatch) {
            this.manualAddAndMatch({
                "TZPZ_NO": this.entity.TZPZ_NO,
                I2P_NO: survey.I2P_NO,
                "X_VALUE": x,
                "Y_VALUE": y
            })
            //}
            this.matchMode = null;
            this.selectedSurveyPoint = null;
            this.$nextTick(() => {
                this.stopCommand();
            });
            this.manualPlaceVisible = false
        },

        stopCommand() {
            if (MxFun) {
                MxFun.stopRunCommand();
            }
        },

        /**
         * 弹窗取消
         */
        onAddPoints(points) {
            this.upsertIot({
                TZPZ_NO: this.entity.TZPZ_NO,
                PT_NOs: points.map(item => item.PT_NO)
            })
        },
        onManualPlaceCancel() {
            this.matchMode = null;
            this.selectedSurveyPoint = null;
            this._clearHighlights();
            this.manualPlaceVisible = false
        },
        async getAllMcDbPoint() {
            try {
                if (!this.mxcad || !this.mxcad.getDatabase) {
                    console.warn("mxcad未初始化");
                    return [];
                }
                const db = this.mxcad.getDatabase();
                const blockTable = db.getBlockTable();
                const blockRecordIds = blockTable.getAllRecordId();
                console.log("块表记录数量:", blockRecordIds.length);
                let modelSpace = null;
                // 查找模型空间
                for (let i = 0; i < blockRecordIds.length; i++) {
                    const blkRecId = blockRecordIds[i];
                    try {
                        const blkRec = blkRecId.getMcDbBlockTableRecord();
                        if (blkRec) {
                            const name = blkRec.name || (typeof blkRec.getName === 'function' ? blkRec.getName() : "");
                            if (name === "*Model_Space" || name === "Model_Space" || name.includes("Model")) {
                                modelSpace = blkRec;
                                console.log("找到模型空间:", name);
                                break;
                            }
                        }
                    } catch (e) {
                        console.warn("读取块记录异常", e);
                    }
                }
                if (!modelSpace) {
                    console.warn("未找到模型空间");
                    return [];
                }
                const entityIds = modelSpace.getAllEntityId();
                console.log("模型空间实体数量:", entityIds.length);
                const pointList = [];
                let pointIndex = 0;
                let blockIndex = 0;
                // 分片配置，每批50个实体，可根据图纸大小调整，越大越快越容易溢出
                const batchSize = 50;
                const total = entityIds.length;
                // 异步分片遍历，防止wasm内存溢出、主线程卡死
                for (let start = 0; start < total; start += batchSize) {
                    const end = Math.min(start + batchSize, total);
                    const batch = entityIds.slice(start, end);
                    for (const entId of batch) {
                        try {
                            if (!entId) continue;
                            // 1. 处理McDbPoint点实体
                            if (entId.isKindOf("McDbPoint")) {
                                const pointEnt = entId.getMcDbEntity();
                                if (!pointEnt || !pointEnt.position) continue;
                                const pos = pointEnt.position;
                                let layerName = "未知图层";
                                let layerHandle = "";
                                try {
                                    const lid = pointEnt.layerId;
                                    if (lid) {
                                        const layerRec = lid.getMcDbLayerTableRecord();
                                        if (layerRec) {
                                            layerName = layerRec.name || "未知图层";
                                            layerHandle = typeof layerRec.getHandle === 'function' ? layerRec.getHandle() : '';
                                        }
                                    }
                                } catch (e) { }
                                pointIndex++;
                                pointList.push({
                                    id: entId,
                                    type: "point",
                                    name: `点${pointIndex}`,
                                    x: pos.x,
                                    y: pos.y,
                                    z: pos.z || 0,
                                    LAYER_NAM: layerName,
                                    LAYER_ID: layerHandle,
                                    description: `图层: ${layerName}`,
                                    visible: true,
                                    index: pointList.length + 1,
                                    no: typeof pointEnt.getHandle === 'function' ? pointEnt.getHandle() : ''
                                });
                            }
                            // 2. 处理McDbBlockReference块引用
                            if (entId.isKindOf("McDbBlockReference")) {
                                const blkRef = entId.getMcDbEntity();
                                if (!blkRef || !blkRef.position) continue;
                                const pos = blkRef.position;
                                const blockName = blkRef.blockName || "未知块";
                                let layerName = "未知图层";
                                let layerHandle = "";
                                try {
                                    const lid = blkRef.layerId;
                                    if (lid) {
                                        const layerRec = lid.getMcDbLayerTableRecord();
                                        if (layerRec) {
                                            layerName = layerRec.name || "未知图层";
                                            layerHandle = typeof layerRec.getHandle === 'function' ? layerRec.getHandle() : '';
                                        }
                                    }
                                } catch (e) { }
                                let attributes = [];
                                let pointName = "";
                                let pointDesc = "";
                                try {
                                    if (typeof blkRef.getAllAttribute === 'function') {
                                        const attrIds = blkRef.getAllAttribute();
                                        if (attrIds && Array.isArray(attrIds) && attrIds.length > 0) {
                                            for (let j = 0; j < attrIds.length; j++) {
                                                try {
                                                    const attrEnt = attrIds[j].getMcDbEntity();
                                                    if (!attrEnt) continue;
                                                    const tag = attrEnt.tag || "";
                                                    const value = attrEnt.textString || "";
                                                    attributes.push({ tag, value });
                                                    if (!pointName && (tag.includes("名称") || tag.includes("编号") ||
                                                        tag.toLowerCase().includes("name") || tag.toLowerCase().includes("code") ||
                                                        tag.toLowerCase().includes("id") || tag.includes("号"))) {
                                                        pointName = value;
                                                    }
                                                } catch (e) { }
                                            }
                                        }
                                    }
                                } catch (e) { }
                                if (attributes.length > 0) {
                                    pointDesc = attributes.map((a) => `${a.tag}: ${a.value}`).join(", ");
                                } else {
                                    pointDesc = `块: ${blockName}, 图层: ${layerName}`;
                                }
                                if (!pointName) {
                                    blockIndex++;
                                    pointName = `${blockName}${blockIndex}`;
                                }
                                pointList.push({
                                    id: entId,
                                    type: "block",
                                    blockName: blockName,
                                    name: pointName,
                                    x: pos.x,
                                    y: pos.y,
                                    z: pos.z || 0,
                                    LAYER_NAM: layerName,
                                    LAYER_ID: layerHandle,
                                    description: pointDesc,
                                    attributes: attributes,
                                    visible: true,
                                    no: typeof blkRef.getHandle === 'function' ? blkRef.getHandle() : '',
                                    index: pointList.length + 1
                                });
                            }
                        } catch (e) {
                            console.warn("单个实体读取异常跳过", e);
                        }
                    }
                    // 让出主线程，释放wasm临时内存，核心防溢出
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                console.log("获取点位数据成功，点位总数:", pointList.length);
                console.log("其中点实体:", pointIndex, "个，块引用:", blockIndex, "个");
                return pointList;
            } catch (e) {
                console.warn("获取点位数据整体失败:", e);
                return [];
            }
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
