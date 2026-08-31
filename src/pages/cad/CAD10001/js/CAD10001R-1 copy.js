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
                TZPZ_USR_NAM: ''
            },
            viewChangeHandler: null,
            winResizeHandler: null,
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
            bloomPass: null,
            bloomRenderCb: null,
            bloomResizeCb: null,
            bloomStrength: 0.6,
            bloomRadius: 0.5,
            bloomThreshold: 0.2,
            popoverTargetObj: null,
            detailTargetObj: null,
            rafId: null,
            hoverTick: null,
            needUpdatePop: false,
            highlightTargetId: null,
            highlightMatchId: null,
            highlightLineGroup: null,
            highlightMeshList: [],
            highlightUseTempLine: false,
            isDev: true,
            pointParsed: false,
            annotationMeshMap: new Map(),
            // 增加快速存在集合，提升大量点位查询性能
            annotationIdSet: new Set(),
            selectedAnnotationSet: new Set(),
            isPopOverBottom: false,
            isAddingAnnotation: false,
            instCircleMesh: null,
            instCircleMesh: null,    // type1圆形实例网格
            instSquareMesh: null,    // type2方形实例网格
            instMaxCount: 3000,      // 预留最大点位数量，大于2000
            instCircleIndex: 0,
            instSquareIndex: 0,
            // 当前临时高亮对象（最多同时1‑2个）
            tempHighlightGroup: null,
            tempHighlightId: null,
            businessHighlightGroup: null,
    businessHighlightIdSet: new Set(), // 保存业务需要高亮的1~2个点位id
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
        }
        this.currentStep = 0
    },
    computed: {
        ...mapState(['userInfo'])
    },
    watch: {
        '$store.state.userInfo': {
            handler(val) {
                if (!val) return;
                this.$set(this.entity, 'TZPZ_USR', val.no)
                this.$set(this.entity, 'TZPZ_USR_NAM', val.desc)
            },
            immediate: true
        },
    },
    beforeDestroy() {
        clearTimeout(this.pointInfoTimer);
        this.pointInfoTimer = null;
        // 清理raf
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.hoverTick) {
            cancelAnimationFrame(this.hoverTick);
            this.hoverTick = null;
        }
        this.destroyAnnotationEvent();
        this.unlistenViewChange()
        this.clearAllBindMarkers()
        this.destroyTempLine();
        this.matchMode = null;
        this.selectedSurveyPoint = null;
        this.manualPlaceVisible = false;
        this.manualPlaceHasCoordFill = false;
        if (this.instCircleMesh) {
            this.instCircleMesh.geometry.dispose();
            this.instCircleMesh.material.dispose();
        }
        if (this.instSquareMesh) {
            this.instSquareMesh.geometry.dispose();
            this.instSquareMesh.material.dispose();
        }
    },
    methods: {
        onCopy() {
            this.postData('/api/scaqyzt/copyTzpp', {
                TZPZ_NO: this.entity.TZPZ_NO,
                TZXX_NO: this.entity.TZXX_NO
            }).then(data => {
                if (data.data.flg) {
                    this.$Message.success('复制配置成功')
                    this.getPoint()
                    this.refreshViewer1Data()
                } else {
                    this.$Message.error('复制配置失败')
                }
            })
        },
        /**
 * 在onFileLoaded图纸加载完成回调内调用
 */
initInstancedMarker() {
  const mxObj = MxFun.getCurrentDraw();
  if (!mxObj) {
    console.error("mxdraw实例获取失败，无法创建InstancedMesh");
    return;
  }
  const instMaxCount = 3000;
  this.instMaxCount = instMaxCount;

  // ========== 圆形点位：几何体内置半径6，分段128，保证放大无棱角 ==========
  const circleGeo = new THREE.CircleGeometry(6, 128);
  const circleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3333,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  this.instCircleMesh = new THREE.InstancedMesh(circleGeo, circleMaterial, instMaxCount);
  this.instCircleMesh.renderOrder = 9999;
  this.instCircleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.instCircleMesh.frustumCulled = false;
  this.instCircleMesh.visible = true;
  this.instCircleMesh.count = 0;

  // ========== 方形点位 ==========
  const squareGeo = new THREE.PlaneGeometry(6, 6);
  const squareMaterial = new THREE.MeshBasicMaterial({
    color: 0x3366ff,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  this.instSquareMesh = new THREE.InstancedMesh(squareGeo, squareMaterial, instMaxCount);
  this.instSquareMesh.renderOrder = 9999;
  this.instSquareMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.instSquareMesh.frustumCulled = false;
  this.instSquareMesh.visible = true;
  this.instSquareMesh.count = 0;

  // mxdraw托管对象
  mxObj.addObject(this.instCircleMesh, false);
  mxObj.addObject(this.instSquareMesh, false);

  // 重置索引与映射表
  this.instCircleIndex = 0;
  this.instSquareIndex = 0;
  this.annotationMeshMap = new Map();
}



,
        selectUser() {
            if (parent && parent.selectUser) {
                parent.selectUser()
            }
        },
        getGroupBaseScale(group) {
            if (!group?.userData?.originScale) return new THREE.Vector3(10, 10, 1);
            const base = group.userData.originScale;
            if (this.selectedAnnotationSet.has(group.userData.annotationId)) {
                return base.clone().multiplyScalar(1.2);
            }
            return base.clone();
        },
        /**
 * @param {string|null} id 点位id
 * @param {boolean} highlight 是否高亮
 */
setGroupHighlight(id, highlight) {
  const mxObj = MxFun.getCurrentDraw();
  // 清空高亮
  if (!id || !highlight) {
    this.destroyTempHighlight();
    this.tempHighlightId = null;
    mxObj?.updateDisplay(true);
    return;
  }

  const itemInfo = this.annotationMeshMap.get(id);
  if (!itemInfo) return;
  const bindItem = itemInfo.bindItem;

  // 已有同一个id高亮，直接返回
  if(this.tempHighlightId === id) return;

  // 销毁旧外圈，创建新的高亮外圈Group，只是叠加在上面
  this.destroyTempHighlight();
  this.tempHighlightGroup = this.createTempHighlightGroup(bindItem);
  this.tempHighlightId = id;
  mxObj?.updateDisplay(true);
  setTimeout(()=>{
    this.instCircleMesh.instanceMatrix.needsUpdate = true;
    this.instSquareMesh.instanceMatrix.needsUpdate = true;
    mxObj.updateDisplay(true);
  },120);
}
,
        toggleAnnotationHighlightById(id) {
            if (this.selectedAnnotationSet.has(id)) {
                this.selectedAnnotationSet.delete(id);
                this.setGroupHighlight(id, false);
            } else {
                this.selectedAnnotationSet.add(id);
                this.setGroupHighlight(id, true);
            }
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay(true);
        },
        clearAnnotationHighlight() {
            this.selectedAnnotationSet.clear();
            this.destroyTempHighlight();
            this.lastHoverGroup = null;
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay(true);
        },
        rayPickAnnotation(raycaster) {
            const mxObj = MxFun.getCurrentDraw();
            const scene = mxObj.getScene();
            // 只检测两个InstancedMesh，不再遍历全部物体
            const intersects = [];
            if (this.instCircleMesh) {
                const res = raycaster.intersectObject(this.instCircleMesh);
                intersects.push(...res);
            }
            if (this.instSquareMesh) {
                const res = raycaster.intersectObject(this.instSquareMesh);
                intersects.push(...res);
            }
            for (const inter of intersects) {
                const instanceIndex = inter.instanceId;
                if (instanceIndex === undefined) continue;
                let bindInfo = null;
                if (inter.object === this.instCircleMesh) {
                    // 遍历map找对应index（可以额外建立索引数组加速，2000也够用）
                    for (const [pid, info] of this.annotationMeshMap) {
                        if (info.type === "1" && info.instanceIndex === instanceIndex) {
                            bindInfo = { id: pid, bindItem: info.bindItem };
                            break;
                        }
                    }
                } else if (inter.object === this.instSquareMesh) {
                    for (const [pid, info] of this.annotationMeshMap) {
                        if (info.type === "2" && info.instanceIndex === instanceIndex) {
                            bindInfo = { id: pid, bindItem: info.bindItem };
                            break;
                        }
                    }
                }
                if (bindInfo) return bindInfo;
            }
            // 同时检测临时高亮group（临时独立对象）
            if (this.tempHighlightGroup) {
                const tempInter = raycaster.intersectObject(this.tempHighlightGroup, true);
                if (tempInter.length > 0) {
                    return {
                        id: this.tempHighlightGroup.userData.annotationId,
                        bindItem: this.annotationMeshMap.get(this.tempHighlightGroup.userData.annotationId).bindItem
                    }
                }
            }
            return null;
        },
        removeBindMarkerById(id) {
            if (!this.annotationMeshMap.has(id)) return;
            const info = this.annotationMeshMap.get(id);
            const dummy = new THREE.Object3D();
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            if (info.type === "1") {
                this.instCircleMesh.setMatrixAt(info.instanceIndex, dummy.matrix);
                this.instCircleMesh.instanceMatrix.needsUpdate = true;
            } else {
                this.instSquareMesh.setMatrixAt(info.instanceIndex, dummy.matrix);
                this.instSquareMesh.instanceMatrix.needsUpdate = true;
            }
            // 如果当前删除的正好是正在高亮的id，销毁临时对象
            if (this.tempHighlightId === id) {
                this.destroyTempHighlight();
            }
            this.annotationMeshMap.delete(id);
            this.annotationIdSet.delete(id);
            this.annotationPoints = this.annotationPoints.filter((p) => p.id !== id);
            this.selectedAnnotationSet.delete(id);
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay(true);
        },
        /**
         * 分片批量渲染marker，防止大量点位阻塞主线程
         */
        /**
 * 批量渲染点位，初始全部展示，循环结束统一更新GPU
 * @param {Array} data 点位数组
 * @param {number} batchSize 分片让出主线程，不阻塞UI
 */
/**
 * @param {Array} data 点位数组
 * @param {Number} batchSize 分批处理大小
 */
async renderMarkersByList(data, batchSize = 80) {
  if (!this.instCircleMesh || !this.instSquareMesh) {
    console.warn("InstancedMesh尚未初始化，等待图纸加载完成");
    return;
  }
  if (!data || data.length === 0) {
    console.warn("点位数据为空");
    this.instCircleMesh.count = 0;
    this.instSquareMesh.count = 0;
    const mxObj = MxFun.getCurrentDraw();
    mxObj.updateDisplay(true);
    return;
  }

  const mxObj = MxFun.getCurrentDraw();
  this.instCircleIndex = 0;
  this.instSquareIndex = 0;
  this.annotationMeshMap.clear();

  const total = data.length;
  const dummy = new THREE.Object3D();

  for (let i = 0; i < total; i += batchSize) {
    const slice = data.slice(i, i + batchSize);
    for (const bindItem of slice) {
      dummy.position.set(bindItem.x, bindItem.y, bindItem.z || 0);
      // 实例缩放固定为1，尺寸全部由几何体本身控制，杜绝拉伸棱角
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      if (bindItem.type === "1") {
        if (this.instCircleIndex >= this.instMaxCount) {
          console.warn("圆形实例数量超限", bindItem.id);
          continue;
        }
        this.instCircleMesh.setMatrixAt(this.instCircleIndex, dummy.matrix);
        this.annotationMeshMap.set(bindItem.id, {
          type: "1",
          instanceIndex: this.instCircleIndex,
          bindItem: bindItem
        });
        this.instCircleIndex++;
      } else {
        if (this.instSquareIndex >= this.instMaxCount) {
          console.warn("方形实例数量超限", bindItem.id);
          continue;
        }
        this.instSquareMesh.setMatrixAt(this.instSquareIndex, dummy.matrix);
        this.annotationMeshMap.set(bindItem.id, {
          type: "2",
          instanceIndex: this.instSquareIndex,
          bindItem: bindItem
        });
        this.instSquareIndex++;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  this.instCircleMesh.count = this.instCircleIndex;
  this.instSquareMesh.count = this.instSquareIndex;

  this.instCircleMesh.instanceMatrix.needsUpdate = true;
  this.instSquareMesh.instanceMatrix.needsUpdate = true;

  mxObj.updateDisplay(true);
  console.log("✅批量写入完成，圆形数量=", this.instCircleIndex, "方形数量=", this.instSquareIndex);
}

,
        setAnnotationHighlightById(targetId, bindMatchId) {
            this.clearAnnotationHighlight();
            this.destroyTempLine();
            if (!targetId) return;
            this.selectedAnnotationSet.add(targetId)
            this.setGroupHighlight(targetId, true);

            let targetPoint = this.annotationPoints.find(item => item.id === targetId);
            if (bindMatchId) {
                this.selectedAnnotationSet.add(bindMatchId)
                this.setGroupHighlight(bindMatchId, true);
                const bindPoint = this.annotationPoints.find(item => item.id === bindMatchId);
                if (targetPoint && bindPoint) {
                    const startWorld = { x: targetPoint.x, y: targetPoint.y, z: targetPoint.z || 0 };
                    const endWorld = { x: bindPoint.x, y: bindPoint.y, z: bindPoint.z || 0 };
                    this.createTempLine(startWorld, endWorld);
                    this.highlightUseTempLine = true;
                }
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
  const mxObj = MxFun.getCurrentDraw();
  if (!mxObj) return;

  if (this.showManualMatchPop && this.popoverTargetObj) {
    const aid = this.popoverTargetObj.userData?.annotationId;
    const info = this.annotationMeshMap.get(aid);
    if (info) {
      const worldPos = {
        x: info.bindItem.x,
        y: info.bindItem.y,
        z: info.bindItem.z || 0
      };
      const res = this.world2Screen(worldPos);
      if (res) {
        const rawX = res.x;
        const rawY = res.y + 24;
        this.popoverPos = { x: rawX, y: rawY }
        const popHeight = 165;
        const popBottom = rawY + popHeight;
        const screenHeight = res.rect.height;
        this.isPopOverBottom = popBottom > screenHeight;
      }
    }
  }

  if (this.showPointInfoModal && this.detailTargetObj) {
    const aid = this.detailTargetObj.userData?.annotationId;
    const info = this.annotationMeshMap.get(aid);
    if (info) {
      const worldPos = {
        x: info.bindItem.x,
        y: info.bindItem.y,
        z: info.bindItem.z || 0
      };
      const res = this.world2Screen(worldPos);
      if (res) {
        const rawX = res.x + 24;
        const rawY = res.y - 15;
        this.detailPos = { x: rawX, y: rawY }
      }
    }
  }
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
            this.viewChangeHandler = null;
            if (this.winResizeHandler) {
                window.removeEventListener("resize", this.winResizeHandler);
            }
            this.winResizeHandler = null;
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

      // ========= 使用封装拾取函数 =========
      const pickResult = this.rayPickAnnotation(raycaster);
      let hoverTargetId = pickResult?.id || null;

      // hover逻辑：有id则高亮，无id取消高亮
      if (hoverTargetId) {
        this.setGroupHighlight(hoverTargetId, true);
        canvas.style.cursor = "pointer";
      } else {
        // 鼠标离开，销毁临时高亮
        this.setGroupHighlight(null, false);
        canvas.style.cursor = "";
      }

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

    // ========= 使用封装拾取函数 =========
    const pickResult = this.rayPickAnnotation(raycaster);

    // 手动匹配模式
    if (this.matchMode === 'manual-match') {
      if (!this.selectedSurveyPoint) return;
      if (!pickResult) return;
      const targetDrawPoint = pickResult.bindItem;
      if (!targetDrawPoint) return;
      // 过滤条件：不能是type=2，不能已经匹配
      if (!targetDrawPoint.id || targetDrawPoint.type === '2' || targetDrawPoint.MATCH_STA === '02') {
        return;
      }

      this.selectedAnnotationSet.add(pickResult.id);
      this.setGroupHighlight(pickResult.id, true);

      const startVec = { x: this.selectedSurveyPoint.PT_X_VALUE, y: this.selectedSurveyPoint.PT_Y_VALUE };
      const endVec = { x: targetDrawPoint.x, y: targetDrawPoint.y };
      this.createTempLine(startVec, endVec);

      const emitData = {
        realPoint: this.selectedSurveyPoint,
        drawPoint: targetDrawPoint,
      };
      // popoverTargetObj 现在没有three对象，改用保存id，刷新弹窗位置逻辑做兼容
      this.popoverTargetObj = { userData: { annotationId: pickResult.id } };
      this.markNeedUpdate();
      this.popData = {
        realPoint: this.selectedSurveyPoint,
        drawPoint: targetDrawPoint,
      };
      this.showManualMatchPop = true;
      return;
    }

    // 普通点击点位
    if (pickResult) {
      e.preventDefault();
      e.stopPropagation();
      const hitAnnotationId = pickResult.id;
      const bindItem = pickResult.bindItem;

      this.detailTargetObj = { userData: { annotationId: hitAnnotationId } };
      this.markNeedUpdate();

      this.pointInfo = bindItem.type === "1" ? `图纸点位：${bindItem.name}` : `实时测点：${bindItem.name}`;
      this.showPointInfoModal = true;
      clearTimeout(this.pointInfoTimer);
      this.pointInfoTimer = setTimeout(() => {
        this.showPointInfoModal = false;
      }, 3000);

      this.clearAnnotationHighlight();
      this.toggleAnnotationHighlightById(hitAnnotationId);
    } else {
      // 点击空白
      this.clearAnnotationHighlight();
      this.destroyTempLine();
    }
  } catch (err) {
    console.error("点击marker异常", err);
  }
},
        closeManualPop() {
            this.showManualMatchPop = false;
            this.destroyTempLine();
            this.popData = { realPoint: null, drawPoint: null, matchGap: 0 };
            this.popoverTargetObj = null;
        },
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
            const points = [new THREE.Vector3(0, 0, 0), p2Rel];
            const geoLine = new THREE.BufferGeometry().setFromPoints(points);
            const matLine = new THREE.LineBasicMaterial({
                color: 0xff0000,
                depthTest: false,
                depthWrite: false
            });
            const line = new THREE.Line(geoLine, matLine);
            line.renderOrder = 9997;
            const arrowSize = 6;
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
            mxObj.addObject(this.tempLineGroup);
            this.viewChangeCb = () => {
                mxObj.updateDisplay(true);
            };
            mxObj.on("viewchange", this.viewChangeCb);
            mxObj.updateDisplay(true);
        },
        destroyTempLine() {
            const mxObj = MxFun.getCurrentDraw();
            if (!mxObj || !this.tempLineGroup) {
                return;
            }
            if (this.viewChangeCb) {
                mxObj.off("viewchange", this.viewChangeCb);
                this.viewChangeCb = null;
            }
            this.tempLineGroup.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            });
            try {
                mxObj.removeObject(this.tempLineGroup);
                if (this.tempLineGroup.parent) {
                    this.tempLineGroup.parent.remove(this.tempLineGroup);
                }
            } catch (e) {
                console.warn('remove tempLine error', e);
            }
            this.tempLineGroup = null;
            this.highlightUseTempLine = false;
            mxObj.updateDisplay(true);
        },
        showBindPointInfo(bindItem) {
            this.currentEditPoint = bindItem;
            this.showPointInfoModal = true;
        },
        clearAllBindMarkers() {
            this.destroyTempHighlight();
            this.annotationMeshMap.clear();
            this.annotationIdSet.clear();
            this.annotationPoints = []
            this.selectedAnnotationSet.clear();
            this.lastHoverGroup = null;
            this.instCircleIndex = 0;
            this.instSquareIndex = 0;
            // 重置全部实例为隐藏
            const dummy = new THREE.Object3D();
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            for (let i = 0; i < this.instMaxCount; i++) {
                this.instCircleMesh.setMatrixAt(i, dummy.matrix);
                this.instSquareMesh.setMatrixAt(i, dummy.matrix);
            }
            this.instCircleMesh.instanceMatrix.needsUpdate = true;
            this.instSquareMesh.instanceMatrix.needsUpdate = true;
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay(true);
        },
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
                const aid = group.userData.annotationId;
                const idx = this.annotationPoints.findIndex(item => item.id === aid);
                if (idx !== -1) {
                    this.annotationPoints.splice(idx, 1);
                }
                this.annotationMeshMap.delete(aid);
                this.annotationIdSet.delete(aid);
            });
            this.lastHoverGroup = null;
            mxObj.updateDisplay(true);
        },
        hasMarkerById(id) {
            return this.annotationIdSet.has(id);
        },
        createBindMarker(bindItem) {
  if (!this.instCircleMesh || !this.instSquareMesh) {
    console.warn("mesh空，跳过", bindItem.id);
    return null;
  }
  console.log("创建点位", bindItem.id, bindItem.type, bindItem.x, bindItem.y);
  if (this.hasMarkerById(bindItem.id)) {
    console.log(`点位${bindItem.id}已存在，跳过创建`);
    return null;
  }
  this.annotationPoints.push(bindItem);
  this.annotationIdSet.add(bindItem.id);
  const mxObj = MxFun.getCurrentDraw();
  if (!mxObj) return null;

  const docX = bindItem.x;
  const docY = bindItem.y;
  const docZ = bindItem.z || 0;

  const dummy = new THREE.Object3D();
  dummy.position.set(docX, docY, docZ);
  // 和批量渲染renderMarkersByList保持统一，不再使用实例缩放，尺寸交给几何体
  dummy.scale.set(1, 1, 1);
  dummy.updateMatrix();

  if (bindItem.type === "1") {
    if (this.instCircleIndex >= this.instMaxCount) {
      console.warn("圆形实例数量超限");
      return;
    }
    this.instCircleMesh.setMatrixAt(this.instCircleIndex, dummy.matrix);
    this.instCircleMesh.instanceMatrix.needsUpdate = true;
    // ✅关键：更新count，让Three渲染新增实例
    this.instCircleMesh.count = this.instCircleIndex + 1;

    this.annotationMeshMap.set(bindItem.id, {
      type: "1",
      instanceIndex: this.instCircleIndex,
      bindItem: bindItem
    });
    this.instCircleIndex++;
  } else {
    if (this.instSquareIndex >= this.instMaxCount) {
      console.warn("方形实例数量超限");
      return;
    }
    this.instSquareMesh.setMatrixAt(this.instSquareIndex, dummy.matrix);
    this.instSquareMesh.instanceMatrix.needsUpdate = true;
    // ✅关键：更新count，让Three渲染新增实例
    this.instSquareMesh.count = this.instSquareIndex + 1;

    this.annotationMeshMap.set(bindItem.id, {
      type: "2",
      instanceIndex: this.instSquareIndex,
      bindItem: bindItem
    });
    this.instSquareIndex++;
  }

  mxObj.updateDisplay(true);
}
,

        // 创建临时高亮点位（中心图形 + 对应形状高亮外框）
        createTempHighlightGroup(bindItem) {
            const group = new THREE.Object3D();
            const docX = bindItem.x;
            const docY = bindItem.y;
            const docZ = bindItem.z || 0;
            const baseSize = 10;
            group.position.set(docX, docY, docZ);

            let centerMesh;
            let borderColor = bindItem.type === "2" ? 0x26c557 : 0xec3000;
            if (bindItem.type === "2") {
                const geo = new THREE.PlaneGeometry(1, 1);
                const mat = new THREE.MeshStandardMaterial({
                    color: borderColor, emissive: borderColor, emissiveIntensity: 0.8,
                    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide
                })
                centerMesh = new THREE.Mesh(geo, mat);
                centerMesh.renderOrder = 9999;
                group.add(centerMesh);
            } else {
                const geo = new THREE.CircleGeometry(0.5, 32);
                const mat = new THREE.MeshStandardMaterial({
                    color: borderColor, emissive: borderColor, emissiveIntensity: 0.8,
                    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide
                })
                centerMesh = new THREE.Mesh(geo, mat);
                centerMesh.renderOrder = 9999;
                group.add(centerMesh);
            }
            // 高亮外框
            const borderMesh = this.createHighlightBorder(bindItem.type, borderColor);
            borderMesh.visible = true;
            group.add(borderMesh);
            group.scale.set(baseSize, baseSize, 1);
            group.userData = { isAnnotationPoint: true, annotationId: bindItem.id };
            const mxObj = MxFun.getCurrentDraw();
            mxObj.addObject(group);
            return group;
        },

        // 销毁临时高亮
        destroyTempHighlight() {
            if (!this.tempHighlightGroup) return;
            const mxObj = MxFun.getCurrentDraw();
            this.tempHighlightGroup.traverse(child => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (child.material) {
                        Array.isArray(child.material) ? child.material.forEach(m => m.dispose()) : child.material.dispose();
                    }
                }
            })
            mxObj.removeObject(this.tempHighlightGroup);
            this.tempHighlightGroup = null;
            this.tempHighlightId = null;
        },
        destroyTempHighlight() {
            if (!this.tempHighlightGroup) return;
            const mxObj = MxFun.getCurrentDraw();
            this.tempHighlightGroup.traverse(child => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (child.material) {
                        Array.isArray(child.material) ? child.material.forEach(m => m.dispose()) : child.material.dispose();
                    }
                }
            })
            mxObj.removeObject(this.tempHighlightGroup);
            this.tempHighlightGroup = null;
            this.tempHighlightId = null;
        },
        createHighlightBorder(type, color) {
            let geometry;

            if (type === "2") {
                // type=2：方形外框
                geometry = new THREE.PlaneGeometry(1.5, 1.5);
            } else {
                // type=1：圆形外框
                geometry = new THREE.RingGeometry(0.55, 0.8, 32);
            }

            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.5, // 透明度低一点
                depthTest: false,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 9996;
            mesh.visible = false; // 默认隐藏

            return mesh;
        },
        addBindMarker(data) {
            this.createBindMarker(data)
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
                if (!data.data) {
                    return
                }
                for (let key in data.data) {
                    this.entity[key] = data.data[key]
                }
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
        getDateYmd(date = new Date()) {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const m = month < 10 ? '0' + month : month;
            const dd = day < 10 ? '0' + day : day;
            return `${year}${m}${dd}`;
        },
        save() {
            if (this.entity.TZPZ_STA === '01') {
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
                            "TZPZ_DAT": this.getDateYmd(this.entity.TZPZ_DAT),
                            "TZPZ_STA": this.entity.TZPZ_STA,
                            "TZPZ_NO": this.entity.TZPZ_NO,
                            "TZPZ_USR_NAM": this.entity.TZPZ_USR_NAM
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
                MxFun.listenForCommandLineInput((msg) => {
                    if (msg.msCmdDisplay && msg.msCmdDisplay.length > 0) {
                        this.measureResult = msg.msCmdDisplay;
                    }
                });
                this.viewerReady = true;
                this.loadingProgress = 100;
                this.fileName = this.fileUrlInput.split("/").pop() || "remote";
            } catch (error) {
                this.loading = false;
                this.$Message.error("MxCAD 查看器初始化失败: " + error.message);
            }
            this.initAnnotationClick()
            this.listenCanvasViewChange();
        },
        async onFileLoaded() {
            try {
                if (this.mxcad && this.mxcad.getDatabase) {
                    const layerTable = this.mxcad.getDatabase().getLayerTable();
                    const aryId = layerTable.getAllRecordId();
                    if (aryId.length > 0) {
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
                                    id: id,
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
                            this.upsertLayer({
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
            } catch (e) {
                console.warn("主动获取图层数据失败:", e);
            }
            if (!this.instCircleMesh || !this.instSquareMesh) {
                this.initInstancedMarker();
            }
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
            this.loading = false
            if (this.isDev) {
                const pointList = await this.getAllMcDbPoint();
                console.log(pointList, 1111)
                this.renderMarkersByList(this.pointList.map(item => {
                    item.id = item.POINT_NO || item.pointNo,
                        item.name = item.pointName,
                        item.type = '1'
                    return item
                }));
                this.pointParsed = true
            }
        },
        onToggleLayer(seq, visible) {
            try {
                const index = seq - 1;
                let layer = this.layers[index];
                if (!layer?.id) return;
                const record = layer.id.getMcDbLayerTableRecord();
                if (record) {
                    record.isOff = !visible;
                    layer.off = !visible;
                    if (this.mxcad.updateLayerDisplayStatus) {
                        this.mxcad.updateLayerDisplayStatus();
                    }
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
                return;
            }
            const numX = Number(x);
            const numY = Number(y);
            if (isNaN(numX) || isNaN(numY)) {
                return;
            }
            if (!this.mxcad || !this.mxcad.zoomCenter || !this.mxcad.zoomScale) return;
            try {
                const { minPt, maxPt } = this.mxcad.getDatabase().currentSpace.getBoundingBox();
                if (numX < minPt.x || numX > maxPt.x || numY < minPt.y || numY > maxPt.y) {
                    return;
                }
                this.mxcad.zoomCenter(numX, numY);
                this.mxcad.zoomScale(zoomFactor);
                this.clearAnnotationHighlight()
                if (id) this.toggleAnnotationHighlightById(id)
                this.mxcad.updateDisplay();
            } catch (e) {
                console.error('[zoomToPoint] 失败:', e);
            }
        },
        async zoomToPoint1(row, zoomFactor = 3) {
            try {
                if (row.MATCH_STA == '02' && !this.hasMarkerById(row.PT_NO)) {
                    this.addBindMarker({
                        id: row.PT_NO,
                        name: row.PT_NAM,
                        x: row.PT_X_VALUE || row.POINT_X_VALUE,
                        y: row.PT_Y_VALUE || row.POINT_Y_VALUE,
                        z: 0,
                        type: '2',
                        ...row
                    })
                }
                this.zoomToPoint(row.PT_X_VALUE || row.POINT_X_VALUE, row.PT_Y_VALUE || row.POINT_Y_VALUE);
                this.panelCollapsed1 = true
                this.$nextTick(() => {
                    this.setAnnotationHighlightById(row.PT_NO, row.POINT_NO)
                })
            } catch (e) {
                console.error('[zoomToPoint] 失败:', e);
            }
        },
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
        _parseSurveyCoord(survey) {
            if (survey.PT_X_VALUE && survey.PT_Y_VALUE) return [parseFloat(survey.PT_X_VALUE), parseFloat(survey.PT_Y_VALUE)];
            return null;
        },
        _hidePanel1() {
            this.panelCollapsed1 = true;
        },
        onAutoMatch(points, threshold) {
            this.autoMatch({
                TZPZ_NO: this.entity.TZPZ_NO,
                threshold
            })
        },
        onManualMatch(points) {
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
                const g = this.annotationMeshMap.get(this.selectedSurveyPoint.PT_NO);
                g && this.setGroupHighlight(g, true)
            })
            this._hidePanel1();
            this.$Message.info('请在图纸上点击一个未匹配的图纸点位完成匹配');
        },
        hideMatchPoint() {
            this.pointList.forEach(item => {
                if (item.MATCH_STA === '02') {
                    const group = this.annotationMeshMap.get(item.POINT_NO || item.POINT_ID)
                    if (group) {
                        group.visible = false
                    }
                }
            })
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay(true);
        },
        showAllPoint() {
            this.pointList.forEach(item => {
                const group = this.annotationMeshMap.get(item.POINT_NO || item.POINT_ID)
                if (group) {
                    group.visible = true
                }
            })
            const mxObj = MxFun.getCurrentDraw();
            mxObj && mxObj.updateDisplay(true);
        },
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
            valid.forEach(survey => {
                const coord = this._parseSurveyCoord(survey);
                if (!coord) return;
                const [x, y] = coord;
                this.addBindMarker({
                    id: survey.PT_NO,
                    name: survey.PT_NAM,
                    x: x,
                    y: y,
                    z: 0,
                    type: '2',
                    ...survey
                })
            });
            this.autoAddAndMatch({
                "TZPZ_NO": this.entity.TZPZ_NO,
                I2P_NO: valid[0].I2P_NO
            })
            this.$Message.success('布点成功')
        },
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
            this._hidePanel1();
            this.$refs.manualPlaceForm.resetPos()
            this.manualPlaceVisible = true;
        },
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
        onFillCoordToForm() {
            this.manualPlaceHasCoordFill = true;
        },
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
            this.manualAddAndMatch({
                "TZPZ_NO": this.entity.TZPZ_NO,
                I2P_NO: survey.I2P_NO,
                "X_VALUE": x,
                "Y_VALUE": y
            })
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
        _clearHighlights() {
            this.clearAnnotationHighlight();
            this.destroyTempLine();
        },
        //         getAllMcDbPoint() {
        //             try {
        //                 if (this.mxcad && this.mxcad.getDatabase) {
        //                     const blockTable = this.mxcad.getDatabase().getBlockTable();
        //                     const blockRecordIds = blockTable.getAllRecordId();
        //                     console.log("块表记录数量:", blockRecordIds.length);

        //                     let modelSpace = null;

        //                     // 查找模型空间
        //                     for (let i = 0; i < blockRecordIds.length; i++) {
        //                         const blkRecId = blockRecordIds[i];
        //                         try {
        //                             const blkRec = blkRecId.getMcDbBlockTableRecord();
        //                             if (blkRec) {
        //                                 const name = blkRec.name || blkRec.getName?.() || "";
        //                                 if (name === "*Model_Space" || name === "Model_Space" || name.includes("Model")) {
        //                                     modelSpace = blkRec;
        //                                     console.log("找到模型空间:", name);
        //                                     break;
        //                                 }
        //                             }
        //                         } catch (e) { }
        //                     }

        //                     if (modelSpace) {
        //                         const entityIds = modelSpace.getAllEntityId();
        //                         console.log("模型空间实体数量:", entityIds.length);

        //                         const pointList = [];
        //                         let pointIndex = 0;
        //                         let blockIndex = 0;

        //                         for (let i = 0; i < entityIds.length; i++) {
        //                             const entId = entityIds[i];
        //                             try {
        //                                 // 1. 处理点实体（McDbPoint）
        //                                 if (entId.isKindOf("McDbPoint")) {
        //                                     const pointEnt = entId.getMcDbEntity();
        //                                     if (pointEnt && pointEnt.position) {
        //                                         const pos = pointEnt.position;
        //                                         // 获取图层名称
        //                                         let layerName = "未知图层";
        //                                         let layerId = ''
        //                                         try {
        //                                             const layerId = pointEnt.layerId;
        //                                             if (layerId) {
        //                                                 const layerRec = layerId.getMcDbLayerTableRecord();
        //                                                 if (layerRec) {
        //                                                     layerName = layerRec.name;
        //                                                     layerId = layerRec.getHandle() || ''
        //                                                 }
        //                                             }
        //                                         } catch (e) { }

        //                                         pointIndex++;
        //                                         pointList.push({
        //                                             id: entId,
        //                                             type: "point",
        //                                             name: `点${pointIndex}`,
        //                                             x: pos.x,
        //                                             y: pos.y,
        //                                             z: pos.z,
        //                                             LAYER_NAM: layerName,
        //                                             LAYER_ID: layerId,
        //                                             description: `图层: ${layerName}`,
        //                                             visible: true,
        //                                             index: pointList.length + 1,
        //                                             no: entId.getMcDbEntity().getHandle()
        //                                         });
        //                                     }
        //                                 }

        //                                 // 2. 处理块引用（McDbBlockReference）- 从属性中获取名称和描述
        //                                 if (entId.isKindOf("McDbBlockReference")) {
        //                                     const blkRef = entId.getMcDbEntity();
        //                                     if (blkRef && blkRef.position) {
        //                                         const pos = blkRef.position;
        //                                         const blockName = blkRef.blockName || "未知块";

        //                                         // 获取图层名称
        //                                         let layerName = "未知图层";
        //                                         let layerId = ''
        //                                         try {
        //                                             const layerId = blkRef.layerId;
        //                                             if (layerId) {
        //                                                 const layerRec = layerId.getMcDbLayerTableRecord();
        //                                                 if (layerRec) {
        //                                                     layerName = layerRec.name;
        //                                                     layerId = layerRec.getHandle() || ''
        //                                                 }
        //                                             }
        //                                         } catch (e) { }

        //                                         // 获取块引用的所有属性
        //                                         let attributes = [];
        //                                         let pointName = "";
        //                                         let pointDesc = "";

        //                                         try {
        //                                             if (blkRef.getAllAttribute) {
        //                                                 const attrIds = blkRef.getAllAttribute();
        //                                                 if (attrIds && attrIds.length > 0) {
        //                                                     for (let j = 0; j < attrIds.length; j++) {
        //                                                         try {
        //                                                             const attr = attrIds[j].getMcDbEntity();
        //                                                             if (attr) {
        //                                                                 const tag = attr.tag || "";
        //                                                                 const value = attr.textString || "";
        //                                                                 attributes.push({ tag, value });

        //                                                                 // 尝试找名称属性
        //                                                                 if (!pointName && (tag.includes("名称") || tag.includes("编号") ||
        //                                                                     tag.toLowerCase().includes("name") || tag.toLowerCase().includes("code") ||
        //                                                                     tag.toLowerCase().includes("id") || tag.includes("号"))) {
        //                                                                     pointName = value;
        //                                                                 }
        //                                                             }
        //                                                         } catch (e) { }
        //                                                     }
        //                                                 }
        //                                             }
        //                                         } catch (e) { }

        //                                         // 构建描述信息
        //                                         if (attributes.length > 0) {
        //                                             pointDesc = attributes.map((a) => `${a.tag}: ${a.value}`).join(", ");
        //                                         } else {
        //                                             pointDesc = `块: ${blockName}, 图层: ${layerName}`;
        //                                         }

        //                                         // 如果没有找到名称属性，用块名称
        //                                         if (!pointName) {
        //                                             blockIndex++;
        //                                             pointName = `${blockName}${blockIndex}`;
        //                                         }
        // console.log(blockName, pointName, 1111)
        //                                         pointList.push({
        //                                             id: entId,
        //                                             type: "block",
        //                                             blockName: blockName,
        //                                             name: pointName,
        //                                             x: pos.x,
        //                                             y: pos.y,
        //                                             z: pos.z,
        //                                             LAYER_NAM: layerName,
        //                                             LAYER_ID: layerId,
        //                                             description: pointDesc,
        //                                             attributes: attributes,
        //                                             visible: true,
        //                                             no: entId.getMcDbEntity().getHandle(),
        //                                             index: pointList.length + 1
        //                                         });
        //                                     }
        //                                 }
        //                             } catch (e) { }
        //                         }

        //                         return pointList
        //                         console.log("获取点位数据成功，点位总数:", this.pointCount);
        //                         console.log("其中点实体:", pointIndex, "个，块引用:", blockIndex, "个");
        //                     } else {
        //                         console.warn("未找到模型空间");
        //                     }
        //                 }
        //             } catch (e) {
        //                 console.warn("获取点位数据失败:", e);
        //             }
        //         },
        async getAllMcDbPoint() {
            try {
                if (!this.mxcad || !this.mxcad.getDatabase) {
                    console.warn("mxcad未初始化");
                    return [];
                }
                const db = this.mxcad.getDatabase();
                const blockTable = db.getBlockTable();
                const blockRecordIds = blockTable.getAllRecordId();
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
                                    no: entId.getMcDbEntity().getHandle(),
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
