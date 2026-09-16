import ViewerPanel from '../components/ViewerPanel/ViewerPanel.vue';
import RiskWarning from '../components/RiskWarning/RiskWarning.vue';
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
            panelCollapsed: true,
            panelCollapsed1: true,
            categories: [],
            categories1: [],
            categories2: [],
            categories3: [],
            fileUrlInput: "",
            fileName: "",
            loading: true,
            loadingText: "正在初始化查看器...",
            loadingStep: "准备中",
            loadingProgress: 0,
            viewerReady: false,
            mxcad: null,
            mxDraw: null,
            currentCommand: "",
            showTz: false,
            showPersonModal: false,
            showSafetyCheckModal: false,
            showAlarmModal: false,
            currentAlarm: {},
            showEquipModal: false,
            viewChangeHandler: null,
            markerList: [],
            panelSelectedIds: {
                safety: new Set(),
                hydro: new Set(),
                gas: new Set(),
                person: new Set()
            },
            forceShowIds: new Set(),
            isRenderPending: false,
            matchSvgWrapper: null,
            matchSvgLine: null,
            matchLineIds: null,
            pointList: [],
            tooltip: {
                show: false,
                x: 0,
                y: 0,
                text: ''
            },
            popoverTargetObj: null,
            detailTargetObj: null,
            rafId: null,
            needUpdatePop: false,
            annotationPoints: [],
            annotationById: new Map(),
            markerRoot: null,
            markerPickables: [],
            markerGeometry: null,
            markerRippleGeometry: null,
            renderTaskId: 0,
            raycaster: new THREE.Raycaster(),
            pointerNdc: new THREE.Vector2(),
            lastHoverGroup: null,
            currentData: null,
            markerTextureCache: new Map(),
            isDev: true,
            activeWarningGroups: new Set(),
            globalAnimateRaf: null,
            globalAnimateLastTime: 0,
            globalAnimateLastRenderTime: 0,
            globalAnimateLastVisibilityTime: 0,
            globalAnimateWorldPos: new THREE.Vector3(),
            globalAnimateCanvasRect: null,
            markerDisplayRaf: null,
            rippleMaterialCache: new Map(),
            realData: {},
            globalAllSelectedIds: [],
            timer: null,
            orgNo: '',
            // =========优化新增参数========
            hoverThrottleTimer: null, // hover节流定时器
            WARNING_ANIMATE_INTERVAL: 120, // 告警动画刷新间隔
            batchChunkSize: 100, // 分片创建marker每批数量
            isCanvasVisibleBounds: null, // 视口边界
        }
    },
    beforeDestroy() {
        this.renderTaskId++;
        this.destroyAnnotationEvent();
        this.clearAllBindMarkers()
        this.markerGeometry?.dispose();
        this.markerGeometry = null;
        this.markerRippleGeometry?.dispose();
        this.markerRippleGeometry = null;
        this.markerTextureCache.forEach(texture => texture.dispose());
        this.markerTextureCache.clear();
        this.rippleMaterialCache.forEach(mat => mat.dispose());
        this.rippleMaterialCache.clear();
        this.stopGlobalWarningAnimate();
        this.unlistenViewChange()
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
        if (this.hoverThrottleTimer) {
            clearTimeout(this.hoverThrottleTimer);
            this.hoverThrottleTimer = null;
        }
        if (this.markerDisplayRaf) {
            cancelAnimationFrame(this.markerDisplayRaf);
            this.markerDisplayRaf = null;
        }
    },
    components: {
        ViewerPanel,
        PersonInfoModal,
        SafetyCheckModal,
        AlarmHandleModal,
        EquipInfoModal,
        TzModal,
        RiskWarning
    },
    mounted() {
        const params = new URLSearchParams(location.search)
        this.orgNo = params.get('orgNo') || ''
        if (this.isDev) {
            this.fileUrlInput = "./models/YTSF-001.mxweb";
            const devSafePoints = [
                {
                    PT_NO: "dev‑001",
                    X_VALUE: 23369467.890141826,
                    Y_VALUE: -30382998.077860042,
                    z: 0,
                    POINT_NAM: "通风测点‑01",
                    GJ_FLG: 'Y', // Y=告警
                    value: "瓦斯浓度：1.4%【超限告警】"
                },
                {
                    PT_NO: "dev‑002",
                    X_VALUE: 23369420.12,
                    Y_VALUE: -30382940.33,
                    z: 0,
                    POINT_NAM: "通风测点‑02",
                    GJ_FLG: 'N',
                    value: "瓦斯浓度：0.3%正常"
                }
            ];

            // 水文监测 type=2
            const devHydroPoints = [
                {
                    PT_NO: "dev‑003",
                    X_VALUE: 23369380.55,
                    Y_VALUE: -30382890.22,
                    z: 0,
                    POINT_NAM: "水文测点‑01",
                    GJ_FLG: 'Y',
                    GZBH_DSC: "水位：8.2m【水位超限告警】"
                },
                {
                    PT_NO: "dev‑004",
                    X_VALUE: 23369340.77,
                    Y_VALUE: -30382840.11,
                    z: 0,
                    POINT_NAM: "水文测点‑02",
                    GJ_FLG: 'N',
                    GZBH_DSC: "水位：3.1m正常"
                }
            ];

            // 瓦斯抽采 type=3
            const devGasPoints = [
                {
                    PT_NO: "dev‑005",
                    X_VALUE: 23369300.44,
                    Y_VALUE: -30382790.66,
                    z: 0,
                    POINT_NAM: "抽采测点‑01",
                    GJ_FLG: 'Y',
                    GZBH_DSC: "抽采浓度：35%【超限告警】"
                },
                {
                    PT_NO: "dev‑006",
                    X_VALUE: 23369260.88,
                    Y_VALUE: -30382740.55,
                    z: 0,
                    POINT_NAM: "抽采测点‑02",
                    GJ_FLG: 'N',
                    GZBH_DSC: "抽采浓度：12%正常"
                }
            ];

            // 人员定位 type=4
            const devPersonPoints = [
                {
                    CARD_CODE: "dev‑007",
                    X_VALUE: 23369220.22,
                    Y_VALUE: -30382690.33,
                    z: 0,
                    PL_NAM: "一号工作面",
                    ORG_SHOT_NAM: "张三【越界告警】",
                    GJ_FLG: 'Y'
                },
                {
                    CARD_CODE: "dev‑008",
                    X_VALUE: 23369180.66,
                    Y_VALUE: -30382640.77,
                    z: 0,
                    PL_NAM: "一号工作面",
                    ORG_SHOT_NAM: "李四‑工作区域内",
                    GJ_FLG: 'N'
                }
            ];

            // --------填充 categories（安全监测 tabIndex=0）--------
            this.categories = [{
                name: "模拟安全监测分组",
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: devSafePoints.map(item => {
                    item.id = item.PT_NO;
                    item.x = item.X_VALUE;
                    item.y = item.Y_VALUE;
                    item.isWarning = item.GJ_FLG === 'Y';
                    item.type = '1';
                    this.realData[item.id] = item;
                    return item;
                })
            }];

            // --------填充 categories1（水文监测 tabIndex=1）--------
            this.categories1 = [{
                name: "水文监测",
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: devHydroPoints.map(item => {
                    item.id = item.PT_NO;
                    item.x = item.X_VALUE;
                    item.y = item.Y_VALUE;
                    item.isWarning = item.GJ_FLG === 'Y';
                    item.type = '2';
                    item.value = item.GZBH_DSC;
                    this.realData[item.id] = item;
                    return item;
                })
            }];

            // --------填充 categories2（瓦斯抽采 tabIndex=2）--------
            this.categories2 = [{
                name: "瓦斯抽采",
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: devGasPoints.map(item => {
                    item.id = item.PT_NO;
                    item.x = item.X_VALUE;
                    item.y = item.Y_VALUE;
                    item.isWarning = item.GJ_FLG === 'Y';
                    item.type = '3';
                    item.value = item.GZBH_DSC;
                    this.realData[item.id] = item;
                    return item;
                })
            }];

            // --------填充 categories3（人员定位 tabIndex=3）--------
            this.categories3 = [{
                name: "一号工作面",
                expanded: true,
                currentPage: 1,
                pageSize: 10,
                selectedPoints: [],
                points: devPersonPoints.map(item => {
                    item.id = item.CARD_CODE;
                    item.x = item.X_VALUE;
                    item.y = item.Y_VALUE;
                    item.isWarning = item.GJ_FLG === 'Y';
                    item.type = '4';
                    item.value = item.ORG_SHOT_NAM;
                    this.realData[item.id] = item;
                    return item;
                })
            }];
            this.initViewer()
            this.panelCollapsed = false
            this.$nextTick(() => {
                this.initCtrlPan();
            });
        }
        this.getDefaultTz()
    },
    methods: {
        clearAllBindMarkers() {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return;
            const markerRoot = this.markerRoot;
            const toRemove = markerRoot ? [...markerRoot.children] : this.annotationPoints.map(item => item.mesh).filter(Boolean);
            toRemove.forEach(group => {
                group.userData._destroyed = true;
                if (group.userData.ripplePool) {
                    group.userData.ripplePool.forEach(ripple => {
                        ripple.mesh.material = null; // don't dispose shared material
                    })
                    group.userData.ripplePool = [];
                }
                group.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry !== this.markerGeometry &&
                            child.geometry !== this.markerRippleGeometry) {
                            child.geometry?.dispose();
                        }
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                            child.material = null;
                        }
                    }
                });
                if (group.parent) group.parent.remove(group);
            });
            if (markerRoot) {
                try {
                    mxObj.removeObject(markerRoot, false);
                } catch (e) {
                    if (markerRoot.parent) markerRoot.parent.remove(markerRoot);
                }
            }
            this.lastHoverGroup = null;
            this.annotationPoints = [];
            this.annotationById.clear();
            this.markerPickables = [];
            this.markerRoot = null;
            this.activeWarningGroups = new Set();
            this.stopGlobalWarningAnimate();
            this.selectedPointIds = []
            this.realData = {}
            this.currentData = null;
            if (this.timer) {
                clearInterval(this.timer)
                this.timer = null
            }
            mxObj.updateDisplay(true);
        },
        async renderMarkersFullReset(newData) {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return;
            this.clearAllBindMarkers();
            this.lastHoverGroup = null;
            this.activeWarningGroups = new Set();
            this.stopGlobalWarningAnimate();
            this.annotationPoints = [];
            // 分片创建marker，避免大数据量阻塞主线程
            const taskId = ++this.renderTaskId;
            const total = newData.length;
            let index = 0;
            while (index < total) {
                if (taskId !== this.renderTaskId) return;
                const slice = newData.slice(index, index + this.batchChunkSize);
                slice.forEach(bindItem => {
                    const group = this.createBindMarker1(bindItem);
                    if (group) {
                        const point = { ...bindItem, mesh: group };
                        this.annotationPoints.push(point);
                        this.annotationById.set(point.id, point);
                    }
                })
                index += this.batchChunkSize;
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            if (this.activeWarningGroups.size > 0) {
                this.startGlobalWarningAnimate();
            }
            mxObj.updateDisplay(true);
        },
        startGlobalWarningAnimate() {
            if (this.globalAnimateRaf || this.activeWarningGroups.size === 0) return;
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return;
            const period = 1200;
            const rippleSpawnInterval = 500;
            let rippleSpawnTimer = 0;
            const canvas = document.getElementById('mxcad');
            const loop = (timestamp) => {
                if (this.activeWarningGroups.size === 0) {
                    this.globalAnimateRaf = null;
                    return;
                }
                const now = timestamp || performance.now();
                if (!this.globalAnimateLastTime) this.globalAnimateLastTime = now;
                const deltaTime = Math.min(now - this.globalAnimateLastTime, 100);
                if (now - this.globalAnimateLastTime < this.WARNING_ANIMATE_INTERVAL) {
                    this.globalAnimateRaf = requestAnimationFrame(loop);
                    return;
                }
                this.globalAnimateLastTime = now;
                rippleSpawnTimer += deltaTime;
                const needSpawnRipple = rippleSpawnTimer >= rippleSpawnInterval;
                if (needSpawnRipple) rippleSpawnTimer %= rippleSpawnInterval;
                let changed = false;
                // 视口剔除：只在视口内的报警 group 才执行动画，减少无效 CPU 和渲染开销
                // 每次循环重新获取 rect，避免窗口 resize 后剔除失效
                const rect = canvas ? canvas.getBoundingClientRect() : null;
                const rectWidth = rect ? rect.width : 0;
                const rectHeight = rect ? rect.height : 0;
                for (const group of this.activeWarningGroups) {
                    if (group.userData._destroyed) {
                        this.activeWarningGroups.delete(group);
                        continue;
                    }
                    // 视口剔除：计算 group 屏幕坐标，不在视口内则跳过
                    if (rectWidth > 0 && rectHeight > 0) {
                        const sp = MxFun.worldCoord2Screen(group.position.x, group.position.y, group.position.z || 0);
                        if (!sp || sp.x < -50 || sp.x > rectWidth + 50 || sp.y < -50 || sp.y > rectHeight + 50) {
                            continue;
                        }
                    }
                    if (this.lastHoverGroup === group) continue;
                    const offset = group.userData.phaseOffset || 0;
                    const t = ((now + offset) % period) / period;
                    const factor = (Math.sin(t * Math.PI * 2) + 1) / 2;
                    const scaleRate = 1 + factor * 0.2;
                    const opacity = 0.55 + factor * 0.45;
                    const mesh = group.userData.mesh;
                    if (Math.abs(group.scale.x - group.userData.originScale.x * scaleRate) > 0.01) {
                        group.scale.copy(group.userData.originScale).multiplyScalar(scaleRate);
                        changed = true;
                    }
                    if (mesh?.material && Math.abs(mesh.material.opacity - opacity) > 0.01) {
                        mesh.material.opacity = opacity;
                        changed = true;
                    }
                    if (needSpawnRipple && group.userData.ripplePool?.length) {
                        const ripple = group.userData.ripplePool[group.userData.nextRippleIndex];
                        group.userData.nextRippleIndex =
                            (group.userData.nextRippleIndex + 1) % group.userData.ripplePool.length;
                        ripple.life = 0;
                        ripple.mesh.visible = true;
                        changed = true;
                    }
                    const ripplePool = group.userData.ripplePool || [];
                    ripplePool.forEach(ripple => {
                        if (!ripple.mesh.visible) return;
                        ripple.life += deltaTime;
                        const progress = ripple.life / ripple.maxLife;
                        if (progress >= 1) {
                            ripple.mesh.visible = false;
                            return;
                        }
                        const rippleScale = 1 + progress * ripple.maxScale;
                        ripple.mesh.scale.set(rippleScale, rippleScale, 1);
                        ripple.mesh.material.opacity = 0.6 * (1 - progress);
                        changed = true;
                    });
                }
                if (changed && now - this.globalAnimateLastRenderTime >= this.WARNING_ANIMATE_INTERVAL) {
                    this.globalAnimateLastRenderTime = now;
                    // 必须让 MXDraw 自己完成一帧渲染，不能直接复用其内部 renderer。
                    mxObj.updateDisplay(false);
                }
                this.globalAnimateRaf = requestAnimationFrame(loop);
            };
            this.globalAnimateLastTime = 0;
            this.globalAnimateLastRenderTime = 0;
            this.globalAnimateRaf = requestAnimationFrame(loop);
        },
        stopGlobalWarningAnimate() {
            if (this.globalAnimateRaf) {
                cancelAnimationFrame(this.globalAnimateRaf);
                this.globalAnimateRaf = null;
            }
            this.globalAnimateLastTime = 0;
            this.globalAnimateLastRenderTime = 0;
            this.globalAnimateLastVisibilityTime = 0;
            this.globalAnimateCanvasRect = null;
        },
        scheduleMarkerDisplayUpdate() {
            if (this.markerDisplayRaf) return;
            this.markerDisplayRaf = requestAnimationFrame(() => {
                this.markerDisplayRaf = null;
                const mxObj = MxFun.getCurrentDraw();
                if (mxObj) mxObj.updateDisplay(false);
            });
        },
        createBindMarker1(bindItem) {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return null;
            const docX = bindItem.x;
            const docY = bindItem.y;
            const docZ = bindItem.z || 0;
            if (!this.markerRoot) {
                this.markerRoot = new THREE.Group();
                this.markerRoot.userData.isMarkerRoot = true;
                mxObj.addObject(this.markerRoot);
            }
            const group = new THREE.Object3D();
            group.position.set(docX, docY, docZ);
            let imgUrl = this.getImg(bindItem);
            const geometry = this.markerGeometry || (this.markerGeometry = new THREE.PlaneGeometry(1, 1));
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                depthTest: false,
                depthWrite: false,
                side: THREE.DoubleSide,
                map: null,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.set(1, 1, 1);
            group.scale.set(14, 18, 1);
            mesh.renderOrder = 9999;
            group.add(mesh);
            group.userData.isAnnotationPoint = true;
            group.userData.annotationId = bindItem.id;
            group.userData.originScale = group.scale.clone();
            group.userData.mesh = mesh;
            group.userData.material = material;
            group.userData._destroyed = false;
            group.userData.rippleList = [];
            if (bindItem.isWarning) {
                group.userData.phaseOffset = Math.random() * 1200;
                group.userData.ripplePool = [];
                group.userData.nextRippleIndex = 0;
                const rippleGeometry = this.markerRippleGeometry ||
                    (this.markerRippleGeometry = new THREE.RingGeometry(0.4, 0.5, 24));
                for (let i = 0; i < 2; i++) {
                    const matKey = `ripple_0xff3333`;
                    const rippleMaterial = this.rippleMaterialCache.has(matKey)
                        ? this.rippleMaterialCache.get(matKey)
                        : (() => {
                            const mat = new THREE.MeshBasicMaterial({
                                color: 0xff3333,
                                transparent: true,
                                opacity: 0,
                                depthTest: false,
                                depthWrite: false,
                                side: THREE.DoubleSide
                            });
                            this.rippleMaterialCache.set(matKey, mat);
                            return mat;
                        })();
                    const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
                    rippleMesh.renderOrder = 9998;
                    rippleMesh.raycast = () => { };
                    rippleMesh.visible = false;
                    group.add(rippleMesh);
                    group.userData.ripplePool.push({
                        mesh: rippleMesh,
                        life: 0,
                        maxLife: 2200,
                        maxScale: 1.1
                    });
                }
                if (!this.activeWarningGroups) this.activeWarningGroups = new Set();
                if (!this.activeWarningGroups.has(group)) {
                    this.activeWarningGroups.add(group);
                }
            }
            this.markerRoot.add(group);
            this.markerPickables.push(mesh);
            // 纹理缓存优化，避免重复new Image加载相同图片
            if (imgUrl) {
                if (this.markerTextureCache.has(imgUrl)) {
                    const cacheTex = this.markerTextureCache.get(imgUrl);
                    material.map = cacheTex;
                    material.needsUpdate = true;
                } else {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        try {
                            if (!group?.userData?.material || group.userData._destroyed) {
                                return;
                            }
                            const material = group.userData.material;
                            const texture = new THREE.Texture(img);
                            texture.flipY = true;
                            texture.generateMipmaps = false;
                            texture.minFilter = THREE.LinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                            texture.needsUpdate = true;
                            this.markerTextureCache.set(imgUrl, texture);
                            material.map = texture;
                            material.needsUpdate = true;
                            this.scheduleMarkerDisplayUpdate();
                        } catch (e) {
                        }
                    };
                    img.onerror = (e) => {
                    };
                    img.src = imgUrl;
                }
            }
            return group;
        },
        getImg(bindItem) {
            let imgUrl = './image/icon1.png'
            if (bindItem.type === '1') {
                imgUrl = bindItem.isWarning ? './image/icon2.png' : './image/icon1.png';
            } else if (bindItem.type === '2') {
                imgUrl = bindItem.isWarning ? './image/icon4.png' : './image/icon3.png';
            } else if (bindItem.type === '3') {
                imgUrl = bindItem.isWarning ? './image/icon6.png' : './image/icon5.png';
            } else if (bindItem.type === '4') {
                imgUrl = bindItem.isWarning ? './image/icon8.png' : './image/icon7.png';
            }
            return imgUrl;
        },
        // hover做节流，降低mousemove高频调用
        handleAnnotationHover(e) {
            if (this.hoverThrottleTimer) return;
            this.hoverThrottleTimer = setTimeout(() => {
                try {
                    if (this.isAddingAnnotation) return;
                    const canvas = document.getElementById("mxcad");
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const mxObj = MxFun.getCurrentDraw();
                    if (!mxObj) return;
                    const camera = mxObj.getCamera?.();
                    if (!camera) return;
                    const ndcX = (mouseX / rect.width) * 2 - 1;
                    const ndcY = -(mouseY / rect.height) * 2 + 1;
                    this.pointerNdc.set(ndcX, ndcY);
                    this.raycaster.setFromCamera(this.pointerNdc, camera);
                    const intersects = this.raycaster.intersectObjects(this.markerPickables, false);
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
                    const hoverChanged = this.lastHoverGroup !== hoverTargetGroup;
                    if (this.lastHoverGroup && this.lastHoverGroup !== hoverTargetGroup) {
                        if (this.lastHoverGroup.userData.originScale) {
                            this.lastHoverGroup.scale.copy(this.lastHoverGroup.userData.originScale);
                        }
                        const mesh = this.lastHoverGroup.userData.mesh;
                        if (mesh?.material) {
                            mesh.material.opacity = 1;
                        }
                        this.lastHoverGroup = null;
                    }
                    if (hoverTargetGroup && this.lastHoverGroup !== hoverTargetGroup) {
                        if (!hoverTargetGroup.userData.originScale) {
                            hoverTargetGroup.userData.originScale = hoverTargetGroup.scale.clone();
                        }
                        hoverTargetGroup.scale.copy(hoverTargetGroup.userData.originScale).multiplyScalar(1.2);
                        this.lastHoverGroup = hoverTargetGroup;
                        const mesh = hoverTargetGroup.userData.mesh;
                        if (mesh?.material) {
                            mesh.material.opacity = 1;
                        }
                        const hoverItem = this.annotationById.get(hoverTargetGroup.userData.annotationId)
                        this.tooltip.show = hoverItem.GJ_FLG === 'Y' ? true : false;
                        this.markNeedUpdate();
                    } else if (hoverTargetGroup) {
                        const hoverItem = this.annotationById.get(hoverTargetGroup.userData.annotationId)
                        this.tooltip.show = hoverItem.GJ_FLG === 'Y' ? true : false;
                    } else {
                        this.tooltip.show = false;
                    }
                    canvas.style.cursor = hoverTargetGroup ? "pointer" : "";
                    if (hoverChanged) mxObj.updateDisplay(true);
                } catch (err) {
                    console.error("hover异常", err);
                } finally {
                    this.hoverThrottleTimer = null;
                }
            }, 32);
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
                const camera = mxObj.getCamera?.();
                if (!camera) return;
                const ndcX = (clickX / rect.width) * 2 - 1;
                const ndcY = -(clickY / rect.height) * 2 + 1;
                this.pointerNdc.set(ndcX, ndcY);
                this.raycaster.setFromCamera(this.pointerNdc, camera);
                const intersects = this.raycaster.intersectObjects(this.markerPickables, false);
                for (const intersect of intersects) {
                    let curObj = intersect.object;
                    while (curObj) {
                        if (curObj.userData && curObj.userData.isAnnotationPoint) {
                            const id = curObj.userData.annotationId;
                            const bindItem = this.annotationById.get(id);
                            if (bindItem) {
                                e.preventDefault();
                                e.stopPropagation();
                                this.clickCallback(bindItem);
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
            if (this.lastHoverGroup) {
                const worldPos = new THREE.Vector3();
                worldPos.setFromMatrixPosition(this.lastHoverGroup.matrixWorld);
                const res = this.world2Screen(worldPos);
                const hoverItem = this.annotationById.get(this.lastHoverGroup.userData.annotationId)
                if (res) {
                    const rawX = res.x;
                    const rawY = res.y - 54;
                    this.tooltip = {
                        x: rawX,
                        y: rawY,
                        show: hoverItem.GJ_FLG === 'Y' ? true : false,
                        text: hoverItem ? hoverItem.value : ''
                    };
                }
            }
        },
        async renderMarkersDiffV2(newData) {
            newData = newData || []
            const taskId = ++this.renderTaskId;
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj) return;
            const viewBeforeRender = this.getCurrentViewBounds();
            this.lastHoverGroup = null;
            if (!this.activeWarningGroups) this.activeWarningGroups = new Set();
            const oldMap = new Map();
            this.annotationPoints.forEach(item => {
                oldMap.set(item.id, item);
            });
            let hasMeshChange = false;
            const newMap = new Map();
            newData.forEach(item => newMap.set(item.id, item));
            const finalPoints = [];
            // 分片处理 diff，避免大量点位同步阻塞主线程
            const diffItems = [];
            const addList = [];
            for (const [id, newBind] of newMap) {
                const oldItem = oldMap.get(id);
                if (!oldItem) {
                    hasMeshChange = true;
                    addList.push(newBind);
                    continue;
                }
                const isDataChanged = (
                    oldItem.x !== newBind.x ||
                    oldItem.y !== newBind.y ||
                    oldItem.type !== newBind.type ||
                    oldItem.isWarning !== newBind.isWarning
                );
                if (!isDataChanged) {
                    finalPoints.push(oldItem);
                    continue;
                }
                hasMeshChange = true;
                diffItems.push({ oldItem, newBind });
            }
            // 分片处理变更点位的替换
            let diffIdx = 0;
            while (diffIdx < diffItems.length) {
                if (taskId !== this.renderTaskId) return;
                const chunk = diffItems.slice(diffIdx, diffIdx + this.batchChunkSize);
                chunk.forEach(({ oldItem, newBind }) => {
                    const oldGroup = oldItem.mesh;
                    if (oldGroup) {
                        oldGroup.userData._destroyed = true;
                        if (oldGroup.userData.ripplePool) {
                            oldGroup.userData.ripplePool.forEach(ripple => {
                                ripple.mesh.material = null; // don't dispose shared material
                            })
                            oldGroup.userData.ripplePool = [];
                        }
                        this.activeWarningGroups.delete(oldGroup);
                        oldGroup.traverse(child => {
                            if (child.isMesh) {
                                if (child.geometry !== this.markerGeometry &&
                                    child.geometry !== this.markerRippleGeometry) {
                                    child.geometry?.dispose();
                                }
                                if (child.material) {
                                    if (Array.isArray(child.material)) {
                                        child.material.forEach(mat => mat.dispose());
                                    } else {
                                        child.material.dispose();
                                    }
                                }
                            }
                        });
                        if (oldGroup.parent) oldGroup.parent.remove(oldGroup);
                    }
                    const newGroup = this.createBindMarker1(newBind);
                    if (newGroup) finalPoints.push({ ...newBind, mesh: newGroup });
                });
                diffIdx += this.batchChunkSize;
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            // 分片批量新增marker，防止主线程阻塞
            let addIdx = 0;
            while (addIdx < addList.length) {
                if (taskId !== this.renderTaskId) return;
                const chunk = addList.slice(addIdx, addIdx + this.batchChunkSize);
                chunk.forEach(bind => {
                    const newGroup = this.createBindMarker1(bind);
                    if (newGroup) finalPoints.push({ ...bind, mesh: newGroup });
                })
                addIdx += this.batchChunkSize;
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            // 分片处理移除点位的清理
            const removeItems = [];
            for (const [id, oldItem] of oldMap) {
                if (!newMap.has(id)) {
                    hasMeshChange = true;
                    const oldGroup = oldItem.mesh;
                    if (!oldGroup) continue;
                    if (this.lastHoverGroup === oldGroup) {
                        this.lastHoverGroup = null;
                    }
                    removeItems.push(oldItem);
                }
            }
            let removeIdx = 0;
            while (removeIdx < removeItems.length) {
                if (taskId !== this.renderTaskId) return;
                const chunk = removeItems.slice(removeIdx, removeIdx + this.batchChunkSize);
                chunk.forEach(oldItem => {
                    const oldGroup = oldItem.mesh;
                    oldGroup.userData._destroyed = true;
                    if (oldGroup.userData.ripplePool) {
                        oldGroup.userData.ripplePool.forEach(ripple => {
                            ripple.mesh.material = null; // don't dispose shared material
                        })
                        oldGroup.userData.ripplePool = [];
                    }
                    this.activeWarningGroups.delete(oldGroup);
                    oldGroup.traverse(child => {
                        if (child.isMesh) {
                            if (child.geometry !== this.markerGeometry &&
                                child.geometry !== this.markerRippleGeometry) {
                                child.geometry?.dispose();
                            }
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => mat.dispose());
                                } else {
                                    child.material.dispose();
                                }
                            }
                        }
                    });
                    if (oldGroup.parent) oldGroup.parent.remove(oldGroup);
                });
                removeIdx += this.batchChunkSize;
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            this.annotationPoints = finalPoints;
            this.annotationById.clear();
            finalPoints.forEach(item => this.annotationById.set(item.id, item));
            this.markerPickables = this.markerPickables.filter(mesh => mesh.parent);
            if (this.activeWarningGroups.size > 0) {
                this.startGlobalWarningAnimate();
            } else {
                this.stopGlobalWarningAnimate();
            }
            if (hasMeshChange) {
                mxObj.updateDisplay(false);
                this.$nextTick(() => {
                    requestAnimationFrame(() => {
                        if (taskId !== this.renderTaskId) return;
                        this.fitViewToMarkers(this.annotationPoints, viewBeforeRender);
                    });
                });
            }
        },
        /**
         * 根据当前标记点范围自动调整视图，确保所有标记都在可视区域内。
         */
        getCurrentViewBounds() {
            if (!this.mxcad || typeof this.mxcad.getViewCADCoord !== 'function') {
                return null;
            }

            try {
                const view = this.mxcad.getViewCADCoord();
                const viewPoints = [view.pt1, view.pt2, view.pt3, view.pt4]
                    .filter(point => point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)));
                if (viewPoints.length < 2) return null;

                let minX = Infinity;
                let maxX = -Infinity;
                let minY = Infinity;
                let maxY = -Infinity;
                viewPoints.forEach(point => {
                    const x = Number(point.x);
                    const y = Number(point.y);
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                });

                if (maxX <= minX || maxY <= minY) return null;
                return { minX, maxX, minY, maxY };
            } catch (error) {
                console.warn('[getCurrentViewBounds] 获取当前视图范围失败:', error);
                return null;
            }
        },
        fitViewToMarkers(points, viewBeforeRender = null) {
            if (!this.mxcad || typeof this.mxcad.zoomW !== 'function' || !points || points.length === 0) {
                return;
            }

            const validPoints = points
                .map(item => ({
                    x: Number(item.x),
                    y: Number(item.y)
                }))
                .filter(item => Number.isFinite(item.x) && Number.isFinite(item.y));

            if (validPoints.length === 0) return;

            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            validPoints.forEach(item => {
                minX = Math.min(minX, item.x);
                maxX = Math.max(maxX, item.x);
                minY = Math.min(minY, item.y);
                maxY = Math.max(maxY, item.y);
            });

            // 预留标记图标和边缘空间，避免 zoomW 传入零尺寸范围。
            const range = Math.max(maxX - minX, maxY - minY);
            const padding = Math.max(range * 0.15, 20);
            let fitMinX = minX - padding;
            let fitMaxX = maxX + padding;
            let fitMinY = minY - padding;
            let fitMaxY = maxY + padding;

            // 所有点位最多相对打点前视图放大 2 倍，避免自动适配过度放大。
            if (viewBeforeRender) {
                const currentWidth = viewBeforeRender.maxX - viewBeforeRender.minX;
                const currentHeight = viewBeforeRender.maxY - viewBeforeRender.minY;
                const fitWidth = Math.max(fitMaxX - fitMinX, currentWidth / 2);
                const fitHeight = Math.max(fitMaxY - fitMinY, currentHeight / 2);
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                fitMinX = centerX - fitWidth / 2;
                fitMaxX = centerX + fitWidth / 2;
                fitMinY = centerY - fitHeight / 2;
                fitMaxY = centerY + fitHeight / 2;
            }

            try {
                this.mxcad.zoomW(
                    new McGePoint3d(fitMinX, fitMinY, 0),
                    new McGePoint3d(fitMaxX, fitMaxY, 0)
                );
                this.mxcad.updateDisplay && this.mxcad.updateDisplay();
            } catch (error) {
                console.warn('[fitViewToMarkers] 自动适配视图失败:', error);
            }
        },
        getDefaultTz() {
            this.postData('/api/scaqyzt/getDefaultTZPZ').then(data => {
                this.TZPZ_NO = data.data.TZPZ_NO
                if (this.TZPZ_NO) {
                    this.getTzpzInfo()
                }
            })
        },
        getTzpzInfo() {
            this.postData('/api/scaqyzt/getTzpzInfo', {
                "TZPZ_NO": this.TZPZ_NO
            }).then(data => {
                this.fileUrlInput = data.data.resourceUrl || ''
                this.fileName = data.data.TZLX_NAM || ''
                if (!this.mxcad) {
                    this.initViewer()
                    this.$nextTick(() => {
                        this.initCtrlPan();
                    });
                } else {
                    this.mxcad.openWebFile(this.fileUrlInput)
                    this.annotationPoints = []
                    this.clearAllBindMarkers()
                }
                this.getGroupedIotInfo()
            })
        },
        onConfirmTz(data) {
            this.TZPZ_NO = data.TZPZ_NO
            this.orgNo = data.orgNo
            this.panelCollapsed = true
            this.getTzpzInfo()
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
            const maxX = rect.width - popW;
            const maxY = rect.height - popH;
            if (x > maxX) x = maxX;
            if (y > maxY) y = maxY;
            if (x < 0) x = 0;
            if (y < 0) y = 0;
            return { x, y };
        },
        listenCanvasViewChange() {
            const mxObj = MxFun.getCurrentDraw();
            this.viewChangeHandler = () => {
                this.markNeedUpdate();
            };
            mxObj.on("viewchange", this.viewChangeHandler);
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
        destroyAnnotationEvent() {
            const canvas = document.getElementById("mxcad");
            if (canvas) {
                canvas.removeEventListener("mousedown", this.handleAnnotationClick, true);
                canvas.removeEventListener("mousemove", this.handleAnnotationHover);
            }
        },
        clickCallback(item) {
            this.currentData = item
            if (item.type === '1') {
                this.showSafetyCheckModal = true
            } else if (item.type === '2' || item.type === '3') {
                this.showEquipModal = true
            } else if (item.type === '4') {
                this.showPersonModal = true
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
        closeManualPop() {
            this.showManualMatchPop = false;
            this.destroyTempLine();
            this.popData = { realPoint: null, drawPoint: null, matchGap: 0 };
        },
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
            const basePos = start.clone();
            const p1Rel = new THREE.Vector3(0, 0, 0);
            const p2Rel = end.clone().sub(basePos);
            const points = [p1Rel, p2Rel];
            const geoLine = new THREE.BufferGeometry().setFromPoints(points);
            const matLine = new THREE.LineBasicMaterial({
                color: 0xff7700,
                depthTest: false,
                depthWrite: false
            });
            const line = new THREE.Line(geoLine, matLine);
            const arrowSize = 2.2;
            const coneGeo = new THREE.ConeGeometry(arrowSize * 0.4, arrowSize, 4);
            const coneMat = new THREE.MeshBasicMaterial({
                color: 0xff7700,
                depthTest: false,
                depthWrite: false
            });
            const cone = new THREE.Mesh(coneGeo, coneMat);
            const quat = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir
            );
            cone.quaternion.copy(quat);
            cone.position.copy(p2Rel).addScaledVector(dir, -arrowSize / 2);
            this.tempLineGroup = new THREE.Group();
            this.tempLineGroup.position.copy(basePos);
            this.tempLineGroup.add(line);
            this.tempLineGroup.add(cone);
            scene.add(this.tempLineGroup);
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
            if (this.postRenderCb) {
                mxObj.off("postRender", this.postRenderCb);
                this.postRenderCb = null;
            }
            if (this.tempLineGroup && scene) {
                this.tempLineGroup.traverse((obj) => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) obj.material.dispose();
                });
                scene.remove(this.tempLineGroup);
                this.tempLineGroup = null;
            }
            if (renderer) {
                renderer.autoClear = true;
            }
            mxObj?.updateDisplay(true);
        },
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
            return wp ? { x: wp.x, y: wp.y, z: docZ } : { x: docX, y: docY, z: docZ };
        },
        showBindPointInfo(bindItem) {
            this.currentEditPoint = bindItem;
            this.showPointInfoModal = true;
        },
        async postData(url = "", data = {}) {
            data.param_orgNo = this.orgNo
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify(data),
            });
            return response.json();
        },
        getGroupedIotInfo() {
            Promise.all(
                [this.postData('/api/scaqyzt/getGroupedIotInfo', {
                    TZPZ_NO: this.TZPZ_NO
                }), this.postData('/api/scaqyzt/getRydwRealtime', {
                    TZPZ_NO: this.TZPZ_NO
                })]).then(results => {
                    const data1 = results[0].data || {}
                    const data2 = results[1].data || {}
                    this.categories = (Object.keys(data1['安全监测'] || {}) || []).map((key, index) => {
                        return {
                            name: key,
                            "expanded": index === 0 ? true : false,
                            "currentPage": 1,
                            "pageSize": 10,
                            "selectedPoints": [],
                            "points": (data1['安全监测'][key] || []).map(item => {
                                item.id = item.PT_NO;
                                item.x = item.X_VALUE;
                                item.y = item.Y_VALUE;
                                item.isWarning = item.GJ_FLG === 'Y';
                                item.type = '1';
                                this.realData[item.id] = item;
                                return item
                            })
                        }
                    })
                    this.categories1 = [{
                        name: '水文监测',
                        "expanded": true,
                        "currentPage": 1,
                        "pageSize": 10,
                        "selectedPoints": [],
                        "points": (data1['水文监测'] || []).map(item => {
                            item.id = item.PT_NO;
                            item.x = item.X_VALUE;
                            item.y = item.Y_VALUE;
                            item.isWarning = item.GJ_FLG === 'Y';
                            item.value = item.GZBH_DSC;
                            item.type = '2'
                            this.realData[item.id] = item
                            return item
                        })
                    }]
                    this.categories2 = [{
                        name: '瓦斯抽采',
                        "expanded": true,
                        "currentPage": 1,
                        "pageSize": 10,
                        "selectedPoints": [],
                        "points": (data1['瓦斯抽采'] || []).map(item => {
                            item.id = item.PT_NO;
                            item.x = item.X_VALUE;
                            item.y = item.Y_VALUE;
                            item.value = item.GZBH_DSC;
                            item.isWarning = item.GJ_FLG === 'Y';
                            item.type = '3';
                            this.realData[item.id] = item
                            return item
                        })
                    }]
                    this.categories3 = (data1['人员定位站'] || []).map((item, index) => {
                        return {
                            name: item.LOT_NAM,
                            "expanded": index === 0 ? true : false,
                            "currentPage": 1,
                            "pageSize": 10,
                            "selectedPoints": [],
                            "points": (data2[item.LOT_NAM] || []).map(point => {
                                point.id = point.CARD_CODE
                                point.LOT_NAM = point.PL_NAM
                                point.x = point.X_VALUE
                                point.y = point.Y_VALUE
                                point.value = point.ORG_SHOT_NAM
                                point.isWarning = point.GJ_FLG === 'Y'
                                point.type = '4'
                                this.realData[point.id] = point
                                return point
                            })
                        }
                    })
                    this.panelCollapsed = false
                    if (this.timer) {
                        clearInterval(this.timer)
                        this.timer = null
                    }
                    this.timer = setInterval(() => {
                        this.refreshIotInfo()
                    }, 60000)
                })
        },
        refreshIotInfo() {
            Promise.all(
                [this.postData('/api/scaqyzt/getGroupedIotInfo', {
                    TZPZ_NO: this.TZPZ_NO
                }), this.postData('/api/scaqyzt/getRydwRealtime', {
                    TZPZ_NO: this.TZPZ_NO
                })]).then(results => {
                    const data1 = results[0].data || {}
                    const data2 = results[1].data || {}
                    Object.values(data2).forEach(item => {
                        if (item && item.length) {
                            item.forEach(point => {
                                point.id = point.CARD_CODE
                                point.LOT_NAM = point.PL_NAM
                                point.x = point.X_VALUE
                                point.y = point.Y_VALUE
                                point.value = point.ORG_SHOT_NAM
                                point.isWarning = point.GJ_FLG === 'Y'
                                point.type = '4'
                                this.realData[point.id] = point
                            })
                        }
                    })
                    if (data1['瓦斯抽采'] && data1['瓦斯抽采'].length) {
                        data1['瓦斯抽采'].forEach(item => {
                            item.id = item.PT_NO;
                            item.x = item.X_VALUE;
                            item.y = item.Y_VALUE;
                            item.value = item.GZBH_DSC;
                            item.isWarning = item.GJ_FLG === 'Y';
                            item.type = '3'
                            this.realData[item.id] = item
                            return item
                        })
                    }
                    if (data1['水文监测'] && data1['水文监测'].length) {
                        data1['水文监测'].forEach(item => {
                            item.id = item.PT_NO;
                            item.x = item.X_VALUE;
                            item.y = item.Y_VALUE;
                            item.value = item.GZBH_DSC;
                            item.isWarning = item.GJ_FLG === 'Y';
                            item.type = '2'
                            this.realData[item.id] = item
                            return item
                        })
                    }
                    (Object.values(data1['安全监测'] || {}) || []).forEach((key, index) => {
                        if (key && key.length) {
                            key.forEach(item => {
                                item.id = item.PT_NO;
                                item.x = item.X_VALUE;
                                item.y = item.Y_VALUE;
                                item.isWarning = item.GJ_FLG === 'Y';
                                item.type = '1';
                                this.realData[item.id] = item
                            })
                        }
                    })
                    if (this.globalAllSelectedIds && this.globalAllSelectedIds.length) {
                        this.renderMarkersDiffV2(this.globalAllSelectedIds.map(id => this.realData[id]).filter(item => item))
                    }
                })
        },
        onTabClick(item, index) {
            this.tabIndex = index
            // this.panelCollapsed = true
        },
        onPanelSelectChange(payload) {
            const panelRefs = [this.$refs.panel1Ref, this.$refs.panel2Ref, this.$refs.panel3Ref, this.$refs.panel4Ref].filter(Boolean)
            const allSelectedIds = []
            panelRefs.forEach(panel => {
                const ids = panel.getSelectedIds()
                allSelectedIds.push(...ids)
            })
            this.globalAllSelectedIds = [...new Set(allSelectedIds)]
            // 选中项为空时也要执行 diff，才能移除画布上残留的最后一个标记。
            this.renderMarkersDiffV2(
                this.globalAllSelectedIds
                    .map(id => this.realData[id])
                    .filter(item => item)
            )
        },
        clearAllPanelsSelect() {
            const panelRefs = [this.$refs.panel1Ref, this.$refs.panel2Ref, this.$refs.panel3Ref, this.$refs.panel4Ref].filter(Boolean)
            panelRefs.forEach(panel => panel.clearAllSelection())
        },
        rebuildMarkersFromPanels() {
            const allSelected = []
            const panelMap = {
                safety: this.categories,
                hydro: this.categories1,
                gas: this.categories2,
                person: this.categories3
            }
            for (const [key, categories] of Object.entries(panelMap)) {
                const ids = this.panelSelectedIds[key]
                if (!ids || ids.size === 0) continue
                for (const cat of (categories || [])) {
                    ; (cat.selectedPoints || []).forEach(item => {
                        allSelected.push(item)
                    })
                }
            }
            allSelected.forEach(item => {
                item.x = item.X_VALUE || item.x
                item.y = item.Y_VALUE || item.y
                item.z = item.z || 0
            })
            this.renderMarkersDiffV2(allSelected)
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
        },
        onAlarmDispatch() {
            this.$Message.success('派单成功')
        },
        enhanceTextColor() {
            try {
                if (!this.mxcad) {
                    console.warn("[文字增强] mxcad 实例不存在");
                    return;
                }

                console.log("[文字增强] 开始强制文字黑色...");

                const database = this.mxcad.getDatabase();
                const blockTable = database.getBlockTable();
                const blockRecordIds = blockTable.getAllRecordId();

                let textCount = 0;
                let changedCount = 0;

                if (!this.originalTextColors) this.originalTextColors = new Map();

                for (let i = 0; i < blockRecordIds.length; i++) {
                    try {
                        const blkRecId = blockRecordIds[i];
                        const blkRec = blkRecId.getMcDbBlockTableRecord();
                        if (!blkRec) continue;

                        const entityIds = blkRec.getAllEntityId();

                        for (let j = 0; j < entityIds.length; j++) {
                            try {
                                const entId = entityIds[j];

                                const isText = entId.isKindOf("McDbText");
                                const isMText = entId.isKindOf("McDbMText");
                                const isAttribute = entId.isKindOf("McDbAttribute");
                                const isAttributeDef = entId.isKindOf("McDbAttributeDefinition");
                                const isDimension = entId.isKindOf("McDbDimension");

                                const isMainText = isText || isMText || isAttribute || isAttributeDef;

                                if (!isMainText && !isDimension) continue;

                                textCount++;

                                const ent = entId.getMcDbEntity();
                                if (!ent) continue;

                                // 保存原始信息，方便回滚
                                this.originalTextColors.set(entId, {
                                    originalColorIndex: ent.colorIndex,
                                    trueColor: ent.trueColor
                                });

                                // 直接强制黑色
                                ent.trueColor = new McCmColor(0, 0, 0);
                                changedCount++;

                                // 尺寸标注内部文字也强制黑色
                                if (isDimension) {
                                    try {
                                        const subEntIds = ent.getSubEntityIds ? ent.getSubEntityIds() : null;
                                        if (subEntIds && subEntIds.length) {
                                            for (let k = 0; k < subEntIds.length; k++) {
                                                const subId = subEntIds[k];
                                                const isSubText = subId.isKindOf("McDbText") || subId.isKindOf("McDbMText");
                                                if (!isSubText) continue;

                                                const subEnt = subId.getMcDbEntity();
                                                if (!subEnt) continue;

                                                subEnt.trueColor = new McCmColor(0, 0, 0);
                                                changedCount++;
                                            }
                                        }
                                    } catch (e) {
                                        console.warn("[文字增强] Dimension 子文字处理失败", e);
                                    }
                                }
                            } catch (e) {
                                console.warn("[文字增强] 实体处理异常", e);
                            }
                        }
                    } catch (e) {
                        console.warn("[文字增强] 块记录处理异常", e);
                    }
                }

                try {
                    if (this.mxcad.updateDisplay) this.mxcad.updateDisplay();
                } catch (e) {
                    console.warn("[文字增强] updateDisplay 失败", e);
                }

                try {
                    if (typeof this.mxcad.regen === "function") this.mxcad.regen();
                } catch (e) {
                    console.warn("[文字增强] mxcad.regen 失败", e);
                }

                console.log(`[文字增强] 处理完成：共 ${textCount} 个文字，已强制黑色 ${changedCount} 个`);
            } catch (e) {
                console.error("增强文字颜色失败:", e);
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
                this.fileUrl = this.fileUrlInput;
                mxcad.setViewBackgroundColor(255, 255, 255);
                try {
                    mxcad.mxdraw.setMouseMiddlePan(true);
                } catch (e) {
                    console.warn("设置中键平移失败:", e);
                }
                try {
                    mxcad.mxdraw.setZoomSpeed(1.8);
                } catch (e) {
                    console.warn("设置缩放速度失败:", e);
                }
                RegistMxCommands();
                RxInitMxEntity();
                this.loadingStep = "初始化完成";
                this.loadingProgress = 90;
                mxcad.mxdraw.on("openFileComplete", () => {
                    this.onFileLoaded();
                });
                this.viewerReady = true;
                this.loadingProgress = 100;
            } catch (error) {
                console.error("MxCAD 初始化失败:", error);
                this.loading = false;
                this.$Message.error("MxCAD 查看器初始化失败: " + error.message);
            }
            this.initAnnotationClick()
            this.listenCanvasViewChange();
        },
        onFileLoaded() {
            this.loading = false
        },
        zoomToPoint(x, y, id, zoomFactor = 2) {
            const strX = String(x ?? '').trim();
            const strY = String(y ?? '').trim();
            if (strX === '' || strY === '') {
                return;
            }
            const numX = Number(x);
            const numY = Number(y);
            if (isNaN(numX) || isNaN(numY)) {
                return;
            }
            if (!this.mxcad || !this.mxcad.zoomCenter || !this.mxcad.zoomScale) return;
            try {
                // const { minPt, maxPt } = this.mxcad.getDatabase().currentSpace.getBoundingBox();
                // if (numX < minPt.x || numX > maxPt.x || numY < minPt.y || numY > maxPt.y) {
                //     return;
                // }
                // console.log(numX, numY)
                this.mxcad.zoomCenter(numX, numY);
                this.mxcad.zoomScale(zoomFactor);
                // this.clearAnnotationHighlight()
                // if (id) this.toggleAnnotationHighlightById(id)
                this.mxcad.updateDisplay();
            } catch (e) {
                console.error('[zoomToPoint] 失败:', e);
            }
        },
        initCtrlPan() {
            const canvas = document.getElementById("mxcad");
            if (!canvas) {
                console.warn("[Ctrl平移] 未找到 canvas 元素");
                return;
            }
            console.log("[Ctrl平移] 初始化 Ctrl + 左键平移（事件模拟方式）");
            canvas.addEventListener("mousedown", this.handleCtrlPanMouseDown, true);
            canvas.addEventListener("mousemove", this.handleCtrlPanMouseMove, true);
            canvas.addEventListener("mouseup", this.handleCtrlPanMouseUp, true);
            canvas.addEventListener("mouseleave", this.handleCtrlPanMouseUp, true);
        },
        simulateMiddleButtonEvent(e, type) {
            const simulatedEvent = new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                detail: 1,
                screenX: e.screenX,
                screenY: e.screenY,
                clientX: e.clientX,
                clientY: e.clientY,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                button: 1,
                buttons: 4,
                relatedTarget: e.relatedTarget
            });
            const canvas = document.getElementById("mxcad");
            if (canvas) {
                canvas.dispatchEvent(simulatedEvent);
            }
        },
        handleCtrlPanMouseDown(e) {
            if (e.button !== 0) {
                return;
            }
            if (this.currentCommand) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log("[Ctrl平移] 模拟中键按下");
            this.simulateMiddleButtonEvent(e, "mousedown");
            const canvas = document.getElementById("mxcad");
            if (canvas) {
                canvas.style.cursor = "grabbing";
            }
        },
        handleCtrlPanMouseMove(e) {
            if (e.buttons !== 1) {
                return;
            }
            if (this.currentCommand) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.simulateMiddleButtonEvent(e, "mousemove");
        },
        handleCtrlPanMouseUp(e) {
            if (e.button !== 0) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log("[Ctrl平移] 模拟中键释放");
            this.simulateMiddleButtonEvent(e, "mouseup");
            const canvas = document.getElementById("mxcad");
            if (canvas) {
                canvas.style.cursor = "";
            }
        }
    },
}
