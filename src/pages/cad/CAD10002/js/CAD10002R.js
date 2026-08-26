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
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
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
            showTz: false,
            showPersonModal: false,
            showSafetyCheckModal: false,
            showAlarmModal: false,
            currentAlarm: {},
            showEquipModal: false,
            viewChangeHandler: null,
            markerList: [],
            // ViewerPanel 选中状态（key → Set<PT_ID>）
            panelSelectedIds: {
                safety: new Set(),
                hydro: new Set(),
                gas: new Set(),
                person: new Set()
            },
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
            },
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
            annotationPoints: [],
            lastHoverGroup: null,
        }
    },
    beforeDestroy() {
        this.destroyAnnotationEvent();
        this.destroyAnnotationBloom();
        // this.unlistenPostRender();
        this.unlistenViewChange()
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
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
        const params = new URLSearchParams(location.search)
        this.orgNo = params.get('orgNo') || ''
        if (false) {
            this.pointList = [
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
            this.pointList = [
            {
                "X_VALUE": 23369467.890141826,
                "Y_VALUE": -30382998.077860042,
                "z": 0,
                "LAYER_ID": "288127",
                "LAYER_NAM": "A通风系统图",
                "POINT_NAM": "A$C379E0320",
                "POINT_ID": "58a6",
                type: '1'
            },
            {
                "X_VALUE": 23369439.109730206,
                "Y_VALUE": -30382957.704416513,
                "z": 0,
                "LAYER_ID": "288127",
                "LAYER_NAM": "A通风系统图",
                "POINT_NAM": "A$C379E0320",
                "POINT_ID": "58a7",
                type: '2'
            },
            {
                "X_VALUE": 23114724.227396417,
                "Y_VALUE": -28141241.35896348,
                "z": 0,
                "LAYER_ID": "288125",
                "LAYER_NAM": "底图",
                "POINT_NAM": "栅栏2",
                "POINT_ID": "6472",
                 type: '3'
            },
            {
                "X_VALUE": 23114953.04550457,
                "Y_VALUE": -28137480.675759755,
                "z": 0,
                "LAYER_ID": "288125",
                "LAYER_NAM": "底图",
                "POINT_NAM": "栅栏2",
                "POINT_ID": "6666",
                type: '4'
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
        }
        
        this.getDefaultTz()
    },
    methods: {
        getDefaultTz() {
            this.postData('/api/scaqyzt/getDefaultTZPZ').then(data => {
                this.TZPZ_NO = data.data
                if (this.TZPZ_NO) {
                    this.getTzpzInfo()
                    this.getGroupedIotInfo()
                }
            })
        },
        getTzpzInfo() {
            this.postData('/api/scaqyzt/getTzpzInfo', {
                "TZPZ_NO": this.TZPZ_NO
            }).then(data => {
                this.fileUrlInput = data.data.resourceUrl || ''
                this.initViewer()
                this.$nextTick(() => {
                    this.initCtrlPan();
                });
            })
        },
        onConfirmTz(data) {
            this.fileUrlInput = data.resourceUrl;
            if (this.mxcad) {
                this.mxcad.openWebFile(this.fileUrlInput)
                this.annotationPoints = []
                this.clearAllBindMarkers()
                this.TZPZ_NO = data.TZPZ_NO
                this.getGroupedIotInfo()
            }
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
        adjustPopBoundary(screenX, screenY, rect, popW = 160, popH = 80) {
            let x = screenX;
            let y = screenY;
            // canvas容器内边界
            const maxX = rect.width - popW;
            const maxY = rect.height - popH;
            if (x > maxX) x = maxX;
            if (y > maxY) y = maxY;
            if (x < 0) x = 0;
            if (y < 0) y = 0;
            return { x, y };
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
                console.log(res)
                if (res) {
                    const rawX = res.x + 24;
                    const rawY = res.y - 16;
                    const pos = this.adjustPopBoundary(rawX, rawY, res.rect, 160, 80);
                    this.popoverPos = pos;
                }
            }
            // 详情弹窗
            if (this.showPointInfoModal && this.detailTargetObj) {
                const worldPos = new THREE.Vector3();
                worldPos.setFromMatrixPosition(this.detailTargetObj.matrixWorld);
                const res = this.world2Screen(worldPos);
                console.log(res)
                if (res) {
                    const rawX = res.x + 24;
                    const rawY = res.y - 15;
                    const pos = this.adjustPopBoundary(rawX, rawY, res.rect, 140, 60);
                    this.detailPos = pos;
                }
            }
            // tooltip
            //   if (this.lastHoverGroup) {
            //     const worldPos = new THREE.Vector3();
            //     worldPos.setFromMatrixPosition(this.lastHoverGroup.matrixWorld);
            //     const res = this.world2Screen(worldPos);
            //     if (res) {
            //       const rawX = res.x + 12;
            //       const rawY = res.y;
            //       const pos = this.adjustPopBoundary(rawX, rawY, res.rect, 120, 32);
            //       this.tooltip.x = pos.x;
            //       this.tooltip.y = pos.y;
            //     }
            //   }
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
        initAnnotationBloom() {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return;
            const scene = mxObj.getScene();
            const camera = mxObj.getCamera();
            const renderer = mxObj.getRenderer();
            if (!scene || !camera || !renderer) return;
            if (this.bloomComposer) return;

            // 创建辉光合成器
            this.bloomComposer = new EffectComposer(renderer);
            const renderPass = new RenderPass(scene, camera);
            this.bloomComposer.addPass(renderPass);

            this.bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                this.bloomStrength,
                this.bloomRadius,
                this.bloomThreshold
            );
            this.bloomComposer.addPass(this.bloomPass);

            // 关键：关闭自动清屏，让 mxdraw 先画 CAD，再叠加辉光
            renderer.autoClear = false;

            // 注册 mxdraw 渲染后回调，叠加辉光
            this.bloomRenderCb = () => {
                if (this.bloomComposer) {
                    this.bloomComposer.render();
                }
            };
            mxObj.on("postRender", this.bloomRenderCb);

            // 窗口大小变化
            this.bloomResizeCb = () => {
                if (this.bloomPass) {
                    this.bloomPass.setSize(window.innerWidth, window.innerHeight);
                }
            };
            window.addEventListener("resize", this.bloomResizeCb);

            mxObj.updateDisplay(true);
            console.log("✅ 辉光初始化完成");
        },
        destroyAnnotationBloom() {
            const mxObj = MxFun.getCurrentDraw();
            if (this.bloomRenderCb && mxObj) {
                mxObj.off("postRender", this.bloomRenderCb);
                this.bloomRenderCb = null;
            }
            if (this.bloomResizeCb) {
                window.removeEventListener("resize", this.bloomResizeCb);
                this.bloomResizeCb = null;
            }
            if (this.bloomComposer) {
                this.bloomComposer.passes.forEach((pass) => {
                    if (pass.dispose) pass.dispose();
                });
                this.bloomComposer = null;
            }
            this.bloomPass = null;
            // 恢复渲染器默认状态
            if (mxObj && mxObj.getRenderer()) {
                mxObj.getRenderer().autoClear = true;
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
        },
        handleAnnotationHover(e) {
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

                if (this.lastHoverGroup) {
                    if (this.lastHoverGroup.userData.originScale) {
                        this.lastHoverGroup.scale.copy(this.lastHoverGroup.userData.originScale);
                    }
                    this.lastHoverGroup.traverse((obj) => {
                        if (obj.material && obj.material.emissiveIntensity !== undefined) {
                            obj.material.emissiveIntensity = 0.4;
                        }
                    });
                    this.lastHoverGroup = null;
                }

                if (hoverTargetGroup) {
                    if (!hoverTargetGroup.userData.originScale) {
                        hoverTargetGroup.userData.originScale = hoverTargetGroup.scale.clone();
                    }
                    hoverTargetGroup.scale.copy(hoverTargetGroup.userData.originScale).multiplyScalar(1.4);
                    this.lastHoverGroup = hoverTargetGroup;
                    hoverTargetGroup.traverse((obj) => {
                        if (obj.material && obj.material.emissiveIntensity !== undefined) {
                            obj.material.emissiveIntensity = 1.2;
                        }
                    });
                    //   const bindItem = hoverTargetGroup.userData.bindItem;
                    //   const tipText = bindItem.type === "1" ? `图纸点位：${bindItem.name}` : `实时测点：${bindItem.name}`;
                    //   this.tooltip.show = true;
                    //   const screenPos = this.world2Screen(hoverTargetGroup.position);
                    //   if (screenPos) {
                    //     this.tooltip.x = screenPos.x + 12;
                    //     this.tooltip.y = screenPos.y;
                    //   }
                    //   this.tooltip.text = tipText;
                } else {
                    // this.tooltip.show = false;
                }
                canvas.style.cursor = hoverTargetGroup ? "pointer" : "";
                mxObj.updateDisplay(true);
            } catch (err) {
                console.error("hover异常", err);
            }
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
                for (const intersect of intersects) {
                    let curObj = intersect.object;
                    // =========关键：向上遍历父节点，找到标记根group=========
                    while (curObj) {
                        if (curObj.userData && curObj.userData.isAnnotationPoint) {
                            const id = curObj.userData.annotationId;
                            const bindItem = this.annotationPoints.find(b => b.id === id);
                            if (bindItem) {
                                e.preventDefault();
                                e.stopPropagation();
                                this.clickCallback(bindItem)
                                return;
                            }
                        }
                        curObj = curObj.parent;
                    }
                }
            } catch (err) {
                console.error("点击marker异常", err);
            }
        },
        screenToThreeWorld(screenX, screenY) {
            const mxDraw = MxFun.getCurrentDraw();
            const camera = mxDraw.getCamera();
            const renderer = mxDraw.getRenderer();
            const size = new THREE.Vector2();
            renderer.getSize(size);

            const x = (screenX / size.x) * 2 - 1;
            const y = -(screenY / size.y) * 2 + 1;

            const vec = new THREE.Vector3(x, y, 0.5);
            vec.unproject(camera);
            return vec;
        },
        //关闭弹窗，销毁箭头连线
        closeManualPop() {
            this.showManualMatchPop = false;
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
            this.closeManualPop();
        },
        createTempLine(startVec, endVec) {
            this.destroyTempLine();
            const mxObj = MxFun.getCurrentDraw();
            const scene = mxObj.getScene();
            const camera = mxObj.getCamera();
            const renderer = mxObj.getRenderer();

            const start = new THREE.Vector3(startVec.x, startVec.y, startVec.z);
            const end = new THREE.Vector3(endVec.x, endVec.y, endVec.z);

            const dir = new THREE.Vector3().subVectors(end, start);
            const dist = dir.length();
            if (dist < 0.05) {
                console.warn("两点距离过小，跳过绘制连线");
                return;
            }
            dir.normalize();

            // =====大坐标偏移核心：以start为基准，顶点使用相对坐标=====
            const basePos = start.clone();
            const p1Rel = new THREE.Vector3(0, 0, 0);
            const p2Rel = end.clone().sub(basePos);

            // 主线(原生Line，仅1px)
            const points = [p1Rel, p2Rel];
            const geoLine = new THREE.BufferGeometry().setFromPoints(points);
            const matLine = new THREE.LineBasicMaterial({
                color: 0xff7700,
                depthTest: false,
                depthWrite: false
            });
            const line = new THREE.Line(geoLine, matLine);

            // 箭头圆锥
            const arrowSize = 2.2;
            const coneGeo = new THREE.ConeGeometry(arrowSize * 0.4, arrowSize, 4);
            const coneMat = new THREE.MeshBasicMaterial({
                color: 0xff7700,
                depthTest: false,
                depthWrite: false
            });
            const cone = new THREE.Mesh(coneGeo, coneMat);

            // 朝向：Cone默认尖向+Y；旋转到dir方向
            const quat = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir
            );
            cone.quaternion.copy(quat);
            // ✅关键：向线段反方向偏移半个圆锥高度，锥尖正好落在end点
            cone.position.copy(p2Rel).addScaledVector(dir, -arrowSize / 2);

            // group整体放置到CAD真实世界位置
            this.tempLineGroup = new THREE.Group();
            this.tempLineGroup.position.copy(basePos);
            this.tempLineGroup.add(line);
            this.tempLineGroup.add(cone);
            scene.add(this.tempLineGroup);

            // =====叠加渲染，解决被CAD画布遮挡=====
            renderer.autoClear = false;
            this.postRenderCb = () => {
                renderer.render(scene, camera);
            };
            mxObj.on("postRender", this.postRenderCb);

            mxObj.updateDisplay(true);
        },
        destroyTempLine() {
            const mxObj = MxFun.getCurrentDraw();
            const scene = mxObj?.getScene?.();
            const renderer = mxObj?.getRenderer?.();

            // 解绑渲染回调
            if (this.postRenderCb) {
                mxObj.off("postRender", this.postRenderCb);
                this.postRenderCb = null;
            }

            // 销毁group下所有几何体材质
            if (this.tempLineGroup && scene) {
                this.tempLineGroup.traverse((obj) => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) obj.material.dispose();
                });
                scene.remove(this.tempLineGroup);
                this.tempLineGroup = null;
            }

            // 恢复渲染器默认状态，不干扰mxdraw自身绘制
            if (renderer) {
                renderer.autoClear = true;
            }

            mxObj?.updateDisplay(true);
        },
        // createTempLine(startVec, endVec) {
        //     this.destroyTempLine();
        //     const mxObj = MxFun.getCurrentDraw();
        //     const scene = mxObj.getScene();

        //     // 保险：强制转成真正Vector3
        //     const start = new THREE.Vector3(startVec.x, startVec.y, startVec.z);
        //     const end = new THREE.Vector3(endVec.x, endVec.y, endVec.z);

        //     const dir = new THREE.Vector3().subVectors(end, start);
        //     const dist = dir.length();
        //     if (dist < 0.05) {
        //         console.warn("两点距离过小，跳过绘制连线");
        //         return;
        //     }
        //     dir.normalize();

        //     // ---------- 1.绘制主线 橙色粗线 ----------
        //     const points = [start, end];
        //     const geoLine = new THREE.BufferGeometry().setFromPoints(points);
        //     const matLine = new THREE.LineBasicMaterial({
        //         color: 0xff7700,
        //         depthTest: false,
        //         depthWrite: false
        //     });
        //     this.tempLineObj = new THREE.Line(geoLine, matLine);
        //     scene.add(this.tempLineObj);

        //     // ----------2.手动绘制箭头头部小三角----------
        //     const arrowSize = 2.2;
        //     const quat = new THREE.Quaternion().setFromUnitVectors(
        //         new THREE.Vector3(0, 1, 0),
        //         dir
        //     );
        //     const coneGeo = new THREE.ConeGeometry(arrowSize * 0.4, arrowSize, 4);
        //     const coneMat = new THREE.MeshBasicMaterial({
        //         color: 0xff7700,
        //         depthTest: false,
        //         depthWrite: false
        //     });
        //     this.tempArrowHead = new THREE.Mesh(coneGeo, coneMat);
        //     this.tempArrowHead.position.copy(end);
        //     this.tempArrowHead.quaternion.copy(quat);
        //     scene.add(this.tempArrowHead);
        //     mxObj.updateDisplay(true);
        // },

        // destroyTempLine() {
        //     const mxObj = MxFun.getCurrentDraw();
        //     const scene = mxObj?.getScene?.();
        //     if (this.tempLineObj) {
        //         scene.remove(this.tempLineObj);
        //         this.tempLineObj.geometry?.dispose();
        //         this.tempLineObj.material?.dispose();
        //         this.tempLineObj = null;
        //     }
        //     if (this.tempArrowHead) {
        //         scene.remove(this.tempArrowHead);
        //         this.tempArrowHead.geometry?.dispose();
        //         this.tempArrowHead.material?.dispose();
        //         this.tempArrowHead = null;
        //     }
        //     mxObj?.updateDisplay(true);
        // },

        /**
         * 刷新点位显示：已匹配isMatched=true则隐藏
         */
        refreshDrawMarkerDisplay() {
            this.annotationPoints.forEach(item => {
                item.mesh.visible = !item.isMatched;
            });
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay && mxObj.updateDisplay(true);
        },
        docCoordToWorld(docX, docY, docZ = 0) {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj || !mxObj.docCoord2World) {
                return { x: docX, y: docY, z: docZ };
            }
            const wp = mxObj.docCoord2World(docX, docY, docZ);
            return wp ? { x: wp.x, y: wp.y, z: wp.z } : { x: docX, y: docY, z: docZ };
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
                // 停止波纹动画，清理光晕资源
                this.stopRingWave(group);
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
            mxObj.updateDisplay(true);
        },
        createBindMarker(bindItem) {
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
                bindItem: bindItem
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
            mxObj.addObject(group);
            mxObj.updateDisplay(true);
            return group;
        },
        createBindMarker1(bindItem) {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return null;

            const docX = bindItem.x;
            const docY = bindItem.y;
            const docZ = bindItem.z || 0;

            const iconSize = 10;
            const group = new THREE.Object3D();
            group.position.set(docX, docY, docZ);

            let imgUrl;
            if (bindItem.type === '1') {
                imgUrl = '/image/icon1.png';
            } else if (bindItem.type === '2') {
                imgUrl = '/image/icon3.png';
            } else if (bindItem.type === '3') {
                imgUrl = '/image/icon5.png';
            } else if (bindItem.type === '4') {
                imgUrl = '/image/icon7.png';
            }
            if (!imgUrl) return null;

            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                depthTest: false,
                depthWrite: false,
                side: THREE.DoubleSide,
                map: null
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.set(1, 1, 1);
            group.scale.set(14, 18, 1);
            mesh.renderOrder = 9999;
            group.add(mesh);

            group.userData.isAnnotationPoint = true;
            group.userData.annotationId = bindItem.id;
            group.userData.originScale = group.scale.clone();

            mxObj.addObject(group);
            mxObj.updateDisplay(true);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                console.log("✅Image onload成功", imgUrl);
                const texture = new THREE.Texture(img);
                texture.flipY = true;

                // ========= 核心修复贴图模糊参数 =========
                texture.generateMipmaps = false;   // 关闭mipmap，小图标必关
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                // ========================================

                texture.needsUpdate = true;

                material.map = texture;
                material.needsUpdate = true;

                mxObj.updateDisplay(true);
            };
            img.onerror = (e) => {
                console.error("❌图片加载失败", imgUrl, e);
            };
            img.src = imgUrl;

            return group;
        },
        renderMarkersByList(data) {
            data.forEach(bind => {
                const mesh = this.createBindMarker1(bind);
                this.annotationPoints.push({ ...bind, mesh: mesh });
            });
        },
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
                            "points": (allData['安全监测'][key] || []).map(item => {
                                item.type = '1'
                                return item
                            })
                        }
                    })
                    this.categories2 = [{
                        name: '水文监测',
                        "expanded": index === 0 ? true : false,
                        "currentPage": 1,
                        "pageSize": 10,
                        "selectedPoints": [],
                        "points": (allData['水文监测'] || []).map(item => {
                                item.type = '1'
                                return item
                            })
                    }]
                    this.categories3 = [{
                        name: '瓦斯抽取',
                        "expanded": index === 0 ? true : false,
                        "currentPage": 1,
                        "pageSize": 10,
                        "selectedPoints": [],
                        "points": (allData['瓦斯抽取'] || []).map(item => {
                                item.type = '1'
                                return item
                            })
                    }]
                    this.categories4 = [{
                        name: '人员定位',
                        "expanded": index === 0 ? true : false,
                        "currentPage": 1,
                        "pageSize": 10,
                        "selectedPoints": [],
                        "points": (allData['人员定位'] || []).map(item => {
                                item.type = '1'
                                return item
                            })
                    }]
                }

            })
        },
        onTabClick(item, index) {
            this.tabIndex = index
            this.panelCollapsed = true
        },
        /**
         * 任一 ViewerPanel 选中变化时统一回调
         * 只收集真正变化的项做 diff，避免全量重建
         */
        onPanelSelectChange(payload) {
            const { panelKey, selected } = payload
            if (!panelKey) return
            const ids = new Set((selected || []).map(item => item.PT_ID || item.id))
            this.$set(this.panelSelectedIds, panelKey, ids)
            this.rebuildMarkersFromPanels()
        },
        rebuildMarkersFromPanels() {
            // 从 4 个面板数据中收集全部选中项
            const allSelected = []
            const panelMap = {
                safety: this.categories1,
                hydro: this.categories2,
                gas: this.categories3,
                person: this.categories4
            }
            for (const [key, categories] of Object.entries(panelMap)) {
                const ids = this.panelSelectedIds[key]
                if (!ids || ids.size === 0) continue
                for (const cat of (categories || [])) {
                    for (const item of (cat.points || [])) {
                        const id = item.PT_ID || item.id
                        if (ids.has(id)) {
                            allSelected.push(item)
                        }
                    }
                }
            }
            console.log(allSelected, 11111)
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
            this.initAnnotationClick()
            this.initAnnotationBloom();
            this.listenCanvasViewChange();
        },
        onFileLoaded() {
            if (this.pointList.length) {
                this.renderMarkersByList(this.pointList.map(item => {
                    item.id = item.pointNo,
                        item.name = item.pointName,
                        item.type = '1'
                    return item
                }));
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
