import {
  createMxCad,
  McDb,
  McDbCircle,
  McDbHatch,
  McDbLine,
  McDbPolyline,
  McDbText,
  McCmColor,
  McGePoint3d,
  McGePoint3dArray,
  MxCpp,
  MxCADUiPrPoint,
  MxCADUtility
} from 'mxcad'
import { MxDbSVG, MxDbSVGText, MxFun, MxType } from 'mxdraw'
import { RegistMxCommands, RxInitMxEntity } from '@/test/command'
import * as THREE from 'three'

const WORK_FACE_LAYER = 'MX_WORKFACE'
const SECTION_LAYER = 'MX_SECTION'
const WORK_FACE_COLOR = [13, 92, 224]
const WORK_FACE_FILL_COLOR = [218, 241, 250]
const SECTION_COLOR = [231, 69, 69]
const SECTION_FILL_COLOR = [255, 231, 226]

// 工作面线宽/线色默认值。线色直接由 WORK_FACE_COLOR 推导，避免两处维护同一个色值
const DEFAULT_WORK_FACE_LINE_COLOR = rgbToHex(WORK_FACE_COLOR)

// 工作面的四个端点（机头/机尾各两点），按此顺序推导多边形并绘制端点圆
const WORK_FACE_ENDPOINTS = ['headStart', 'headEnd', 'tailStart', 'tailEnd']

// 端点名称：弹窗选点时和正式绘制时都画在端点圆旁边，标明该点对应机头/机尾的哪一端
const WORK_FACE_ENDPOINT_LABELS = {
  headStart: '机头开始',
  headEnd: '机头结束',
  tailStart: '机尾开始',
  tailEnd: '机尾结束'
}

// —— 固定绘制参数：工作面/断面的线宽与文字大小固定，不随绘制区域大小变化 ——
const FIXED_LINE_WIDTH = 2        // 工作面边界线 / 断面剖切线的线宽
const FIXED_LIGHT_LINE_WIDTH = 1  // 辅助区域（选中框、预警区等）线宽
const FIXED_TEXT_HEIGHT = 12      // 名称文字高度
const FIXED_MARKER_RADIUS = 4     // 端点 / 中心标记圆半径
const ENDPOINT_LABEL_OFFSET = FIXED_MARKER_RADIUS + 6  // 端点名称文字相对圆心的 X/Y 偏移（doc 单位）
const FIXED_ARROW_SIZE = 40       // 方向箭头长度
const FIXED_LABEL_SIZE = 60       // 工作面名称标签（SVG）固定尺寸
const LABEL_HIT_RADIUS = FIXED_LABEL_SIZE * 1.5  // 点击工作面标签/文字时的命中半径（doc 单位，可调）

// —— 模拟每日回采区域（图片）数据与绘制参数（独立功能，可替换为真实接口数据） ——
const MOCK_DAILY_DATES = [
  '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24',
  '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'
]
const DAILY_AREA_FILL_COLORS = [
  [196, 225, 250], [186, 218, 246], [176, 211, 242], [166, 204, 238],
  [156, 197, 234], [146, 190, 230], [136, 183, 226], [126, 176, 222]
]
const DAILY_AREA_BORDER = [43, 95, 170]  // 日期区域边框色
const DAILY_AREA_TEXT = [25, 55, 110]    // 日期文字颜色

function point(x, y) {
  return {
    x: Number(x),
    y: Number(y)
  }
}

function distance(a, b) {
  return Math.sqrt(
    Math.pow(Number(b.x) - Number(a.x), 2) +
    Math.pow(Number(b.y) - Number(a.y), 2)
  )
}

function midpoint(a, b) {
  return point(
    (Number(a.x) + Number(b.x)) / 2,
    (Number(a.y) + Number(b.y)) / 2
  )
}

function interpolate(a, b, t) {
  return point(
    Number(a.x) + (Number(b.x) - Number(a.x)) * t,
    Number(a.y) + (Number(b.y) - Number(a.y)) * t
  )
}

function normalizeVector(from, to) {
  const dx = Number(to.x) - Number(from.x)
  const dy = Number(to.y) - Number(from.y)
  const length = Math.sqrt(dx * dx + dy * dy)
  if (!length) return { x: 0, y: 0, length: 0 }
  return {
    x: dx / length,
    y: dy / length,
    length
  }
}

function projectParameter(target, start, end) {
  const vx = Number(end.x) - Number(start.x)
  const vy = Number(end.y) - Number(start.y)
  const lengthSquared = vx * vx + vy * vy
  if (!lengthSquared) return 0
  const t = (
    (Number(target.x) - Number(start.x)) * vx +
    (Number(target.y) - Number(start.y)) * vy
  ) / lengthSquared
  return Math.max(0, Math.min(1, t))
}

function isPointValid(value) {
  return value &&
    value.x !== '' && value.y !== '' &&
    value.x !== null && value.y !== null &&
    value.x !== undefined && value.y !== undefined &&
    Number.isFinite(Number(value.x)) &&
    Number.isFinite(Number(value.y))
}

function isWorkFaceGeometryValid(face) {
  return face &&
    isPointValid(face.range) &&
    isPointValid(face.headStart) &&
    isPointValid(face.headEnd) &&
    isPointValid(face.tailStart) &&
    isPointValid(face.tailEnd)
}

function isSamePoint(a, b) {
  return isPointValid(a) && isPointValid(b) &&
    Number(a.x) === Number(b.x) && Number(a.y) === Number(b.y)
}

function rgbToHex(rgb) {
  const hex = rgb.map(value => {
    const part = Math.max(0, Math.min(255, Math.round(Number(value) || 0))).toString(16)
    return part.length === 1 ? `0${part}` : part
  }).join('')
  return `#${hex}`.toUpperCase()
}

function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ]
}

// 机头线段与机尾线段是工作面的两条对边，四个端点按「机头起→机头止→机尾止→机尾起」
// 回绕即成闭合四边形：headStart↔tailStart、headEnd↔tailEnd 分别为两条长边
function buildWorkFacePolygon(headStart, headEnd, tailStart, tailEnd) {
  return [
    point(headStart.x, headStart.y),
    point(headEnd.x, headEnd.y),
    point(tailEnd.x, tailEnd.y),
    point(tailStart.x, tailStart.y)
  ]
}

export default {
  data() {
    return {
      panelCollapsed: false,
      fileUrlInput: '',
      fileName: '',
      orgNo: '',
      loading: true,
      viewerReady: false,
      mxcad: null,
      mxDraw: null,
      currentCommand: '',
      isDev: true,

      activeConfigTab: 'workface',
      workFaces: [],
      sections: [],
      configPageSize: 10,
      workFacePage: 1,
      sectionPage: 1,
      workFaceColumns: [
        { title: '序号', key: 'seq', width: 64, align: 'center' },
        { title: '工作面名称', key: 'name', minWidth: 120, tooltip: true },
        { title: '工作面编码', key: 'code', width: 106 },
        {
          title: '操作',
          width: 152,
          align: 'center',
          render: (h, { row }) => this.renderConfigRowActions(h, 'workface', row)
        }
      ],
      sectionColumns: [
        { title: '序号', key: 'seq', width: 64, align: 'center' },
        { title: '断面名称', key: 'name', minWidth: 120, tooltip: true },
        { title: '断面编码', key: 'code', width: 106 },
        {
          title: '操作',
          width: 152,
          align: 'center',
          render: (h, { row }) => this.renderConfigRowActions(h, 'section', row)
        }
      ],
      workFaceDialogVisible: false,
      sectionDialogVisible: false,
      editingWorkFace: null,
      editingSection: null,
      coordinatePickContext: null,
      demoInitialized: false,
      fileLoadedHandled: false,
      isPolygonSelecting: false,
      polygonFinishRequested: false,
      polygonCloseRequested: false,
      polygonSelectionPreviewIds: [],
      workFacePreviewIds: [],
      isCoordinatePicking: false,
      isPanningByCtrl: false,
      pointerGesture: null,
      isReplayingCanvasEvent: false,
      activeVertexDrag: null,
      activeVertexEditId: null,
      activeVertexEditKind: '',
      fileLoadTimer: null
    }
  },
  computed: {
    pagedWorkFaces() {
      return this.paginateConfigs(this.workFaces, this.workFacePage)
    },
    pagedSections() {
      return this.paginateConfigs(this.sections, this.sectionPage)
    },
    nextWorkFaceCode() {
      const codes = this.workFaces
        .map(item => Number(item.code))
        .filter(Number.isFinite)
      const max = codes.length ? Math.max.apply(null, codes) : 12031
      return String(max + 1)
    },
    nextSectionCode() {
      const codes = this.sections
        .map(item => Number(item.code))
        .filter(Number.isFinite)
      const max = codes.length ? Math.max.apply(null, codes) : 12031
      return String(max + 1)
    },
    // 弹窗里打开的这条工作面是否已在列表中：已存在的才给「删除」，也才跳过端点预览
    workFaceExists() {
      const item = this.editingWorkFace
      return !!item && this.workFaces.some(face => face.id === item.id)
    }
  },
  mounted() {
    const params = new URLSearchParams(location.search)
    this.orgNo = params.get('orgNo') || ''
    if (this.isDev) {
      this.fileUrlInput = './models/YTSF-001.mxweb'
    }
    this.initViewer()
    this.$nextTick(() => {
      this.initCtrlPan()
    })
    if (this.isDev) {
        this.workFaces = [
            {"id":"workface-1791450247304","code":"12032","name":"新工作面","range":{"x":23370717.694014765,"y":-30384470.680408843},"headStart":{"x":23370553.31276122,"y":-30385624.65022279},"headEnd":{"x":23370553.31276122,"y":-30385636.51320971},"tailStart":{"x":23370882.07526831,"y":-30385590.37244106},"tailEnd":{"x":23370882.07526831,"y":-30385623.640906647},"bounds":{"minX":23370553.31276122,"maxX":23370882.07526831,"minY":-30385641.68288729,"maxY":-30383299.677930392},"polygon":[{"x":23370553.31276122,"y":-30383299.677930392},{"x":23370882.07526831,"y":-30383299.677930392},{"x":23370882.07526831,"y":-30385641.68288729},{"x":23370553.31276122,"y":-30385641.68288729}],"kind":"workface","entityIds":[]}
        ]
        this.sections = [
            {
    "id": "section-1790667900075",
    "code": "12033",
    "name": "12033断面",
    "range": {
        "x": 23372734.155462973,
        "y": -30388427.809688352
    },
    "workFaceLinks": [
        {
            "workFaceId": "workface-1791450247304",
            "warningDistance": 50
        }
    ],
    "bounds": {
        "minX": 23372644.474770945,
        "maxX": 23372823.836154997,
        "minY": -30388551.35581653,
        "maxY": -30388304.263560176
    },
    "polygon": [
        {
            "x": 23372694.645787463,
            "y": -30388304.263560176
        },
        {
            "x": 23372823.836154997,
            "y": -30388349.417475045
        },
        {
            "x": 23372787.59751724,
            "y": -30388497.421973772
        },
        {
            "x": 23372677.08593168,
            "y": -30388551.35581653
        },
        {
            "x": 23372644.474770945,
            "y": -30388477.353567164
        }
    ]
}
        ]
    }
  },
  beforeDestroy() {
    this.exitVertexEdit()
    this.removePolygonReference()
    this.destroyCtrlPan()
    if (this.fileLoadTimer) {
      clearTimeout(this.fileLoadTimer)
      this.fileLoadTimer = null
    }
  },
  methods: {
    async initViewer() {
      try {
        this.loading = true
        const useST = !('SharedArrayBuffer' in window)
        const wasmPath = useST ? './wasm/2d-st/' : './wasm/2d/'

        const mxcad = await createMxCad({
          canvas: '#mxcad',
          locateFile: fileName => {
            return new URL(
              wasmPath + fileName,
              window.location.origin + window.location.pathname
            ).href
          },
          fileUrl: this.fileUrlInput,
          browse: true,
          multipleSelect: false,
          middlePan: 1,
          authorized_service: 'same_current_page_url',
          onOpenFileComplete: (mxcadInstance) => {
            if (mxcadInstance) this.mxcad = mxcadInstance
            this.onFileLoaded()
          },
          onInit: () => {
            try {
              MxFun.setIniset({ EnableIntelliSelect: false })
              MxCpp.App.addNetworkLoadingFont([
                'txt.shx',
                'simplex.shx',
                'gdt.shx',
                'aaa.shx',
                'ltypeshp.shx',
                'complex.shx',
                'isocp.shx',
                'isoct.shx',
                'romans.shx'
              ])
              MxCpp.App.addNetworkLoadingBigFont([
                'hztxt.shx',
                'gbcbig.shx',
                'tssdchn.shx',
                'gbhzfs.shx'
              ])
            } catch (error) {
              console.warn('字体加载警告:', error)
            }
          }
        })

        this.mxcad = mxcad
        this.mxDraw = mxcad.mxdraw
        mxcad.setViewBackgroundColor(255, 255, 255)
        try {
          mxcad.mxdraw.setMouseMiddlePan(true)
          mxcad.mxdraw.setZoomSpeed(1.8)
        } catch (error) {
          console.warn('查看器参数设置失败:', error)
        }

        RegistMxCommands()
        RxInitMxEntity()
        MxFun.listenForCommandLineInput(msg => {
          if (
            (this.isPolygonSelecting || this.isCoordinatePicking) &&
            msg &&
            msg.msCmdDisplay &&
            msg.msCmdDisplay.length > 0
          ) {
            this.currentCommand = msg.msCmdDisplay
          } else {
            this.currentCommand = ''
          }
        })

        this.viewerReady = true
        this.waitForFileLoaded()
        this.fileName = this.fileUrlInput.split('/').pop() || 'remote'
        if (this.fileName.toLowerCase().endsWith('.mxweb')) {
          this.fileName = this.fileName.slice(0, -6)
        }
      } catch (error) {
        this.loading = false
        this.$Message.error('MxCAD 查看器初始化失败: ' + error.message)
      }
    },

    onFileLoaded() {
      if (this.fileLoadedHandled) return
      this.fileLoadedHandled = true
      if (this.fileLoadTimer) {
        clearTimeout(this.fileLoadTimer)
        this.fileLoadTimer = null
      }
      this.loading = false
      this.$nextTick(() => {
        this.renderAllConfigurations()
      })
    },

    waitForFileLoaded() {
      let attempts = 0
      const check = () => {
        if (this.fileLoadedHandled || !this.mxcad) return
        let documentFileName = ''
        let hasRealView = false
        try {
          if (this.mxcad.GetDocumentFileName) {
            documentFileName = this.mxcad.GetDocumentFileName() || ''
          }
          if (this.mxcad.getViewCADCoord) {
            const view = this.mxcad.getViewCADCoord()
            const viewPoints = view
              ? [view.pt1, view.pt2, view.pt3, view.pt4].filter(isPointValid)
              : []
            if (viewPoints.length >= 2) {
              const xs = viewPoints.map(item => Number(item.x))
              const ys = viewPoints.map(item => Number(item.y))
              const spanX = Math.max.apply(null, xs) - Math.min.apply(null, xs)
              const spanY = Math.max.apply(null, ys) - Math.min.apply(null, ys)
              const centerX = (Math.max.apply(null, xs) + Math.min.apply(null, xs)) / 2
              const centerY = (Math.max.apply(null, ys) + Math.min.apply(null, ys)) / 2
              hasRealView = spanX > 500 || spanY > 500 ||
                Math.abs(centerX) > 1000 || Math.abs(centerY) > 1000
            }
          }
        } catch (error) {
          documentFileName = ''
          hasRealView = false
        }

        attempts += 1
        if ((documentFileName && hasRealView) || attempts >= 60) {
          this.onFileLoaded()
          return
        }
        this.fileLoadTimer = setTimeout(check, 500)
      }
      this.fileLoadTimer = setTimeout(check, 500)
    },

    getWorkFaceLabelDocPoint(face) {
      if (Array.isArray(face.polygon) && face.polygon.length >= 3) {
        const validPoints = face.polygon.filter(isPointValid)
        if (validPoints.length) {
          return point(
            validPoints.reduce((sum, item) => sum + Number(item.x), 0) / validPoints.length,
            validPoints.reduce((sum, item) => sum + Number(item.y), 0) / validPoints.length
          )
        }
      }
      if (isPointValid(face.range)) return point(face.range.x, face.range.y)
      if (face.bounds) {
        return point(
          (Number(face.bounds.minX) + Number(face.bounds.maxX)) / 2,
          (Number(face.bounds.minY) + Number(face.bounds.maxY)) / 2
        )
      }
      return null
    },

    getReferenceFrame() {
      let view = null
      try {
        view = this.mxcad && this.mxcad.getViewCADCoord
          ? this.mxcad.getViewCADCoord()
          : null
      } catch (error) {
        view = null
      }

      const points = view
        ? [view.pt1, view.pt2, view.pt3, view.pt4].filter(isPointValid)
        : []
      if (points.length >= 2) {
        const xs = points.map(item => Number(item.x))
        const ys = points.map(item => Number(item.y))
        const minX = Math.min.apply(null, xs)
        const maxX = Math.max.apply(null, xs)
        const minY = Math.min.apply(null, ys)
        const maxY = Math.max.apply(null, ys)
        return {
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2,
          spanX: Math.max(maxX - minX, 100),
          spanY: Math.max(maxY - minY, 100)
        }
      }

      return {
        centerX: 0,
        centerY: 0,
        spanX: 10000,
        spanY: 10000
      }
    },

    initializeDefaultConfigurations() {
      const frame = this.getReferenceFrame()
      const width = frame.spanX * 0.11
      const height = frame.spanY * 0.16
      const startX = frame.centerX - width * 1.45
      const startY = frame.centerY + height * 1.8

      const names = [
        ['11210工作面', '11210'],
        ['13320工作面', '13320'],
        ['11210工作面', '11210'],
        ['11210工作面', '11210'],
        ['13320工作面', '13320'],
        ['12032工作面', '12032'],
        ['12032工作面', '12032']
      ]

      this.workFaces = names.map(([name, code], index) => {
        const column = index % 3
        const row = Math.floor(index / 3)
        const x = startX + column * width * 1.6
        const y = startY - row * height * 1.7
        const headStart = point(x, y)
        const headEnd = point(x + width, y)
        const tailStart = point(x, y + height)
        const tailEnd = point(x + width, y + height)
        return {
          id: `workface-demo-${index + 1}`,
          code,
          name,
          range: point(x + width / 2, y + height / 2),
          headStart,
          headEnd,
          tailStart,
          tailEnd,
          entityIds: []
        }
      })

      this.sections = this.workFaces.map((face, index) => {
        const t = 0.35 + (index % 3) * 0.15
        return {
          id: `section-demo-${index + 1}`,
          code: face.code,
          name: face.name,
          range: interpolate(face.headStart, face.tailStart, t),
          workFaceLinks: [{ workFaceId: face.id, warningDistance: 50 }],
          entityIds: []
        }
      })

      this.$nextTick(() => {
        this.renderAllConfigurations()
      })
    },

    ensureLayer(layerName) {
      if (!this.mxcad || !this.mxcad.getDatabase) return
      try {
        const database = this.mxcad.getDatabase()
        const layerTable = database && database.getLayerTable
          ? database.getLayerTable()
          : null
        if (layerTable && !layerTable.has(layerName)) {
          this.mxcad.addLayer(layerName)
        }
      } catch (error) {
        console.warn('创建 CAD 图层失败:', layerName, error)
      }
    },

    drawCadEntity(item, entity, layerName, rgb, lineWeight) {
      if (!this.mxcad || !entity) return null
      try {
        this.ensureLayer(layerName)
        entity.layer = layerName
        entity.trueColor = new McCmColor(rgb[0], rgb[1], rgb[2])
        entity.lineweight = lineWeight

        const objectId = this.mxcad.drawEntity(entity)
        if (objectId && objectId.isValid && objectId.isValid()) {
          const object = objectId.getMcDbObject()
          if (object && object.setxDataString) {
            object.setxDataString(
              'MX_CAD10004',
              `${item.kind || 'config'}:${item.id}`
            )
          }
          if (!item.entityIds) {
            this.$set(item, 'entityIds', [])
          }
          item.entityIds.push(objectId)
          return objectId
        }
      } catch (error) {
        console.warn('绘制 CAD 实体失败:', error)
      }
      return null
    },

    eraseConfigurationEntities(item) {
  if (!item) return
  if (!Array.isArray(item.entityIds)) {
    this.$set(item, 'entityIds', [])
  }
  // 清理svg标签实体
  if (item.labelEntityId) {
    try {
      const mxObj = MxFun.getCurrentDraw()
      if (mxObj && mxObj.eraseMxEntity) {
        mxObj.eraseMxEntity(item.labelEntityId)
      }
    } catch (error) {
      console.warn('移除工作面名称标签失败:', error)
    }
    this.$set(item, 'labelEntityId', null)
  }
  // 【新增】清理CAD热区矩形实体
  if (Array.isArray(item.labelEntityIds)) {
    item.labelEntityIds.forEach(objectId => {
      try {
        if (objectId && objectId.isValid && objectId.isValid()) {
          objectId.erase()
        }
      } catch (error) {
        console.warn('移除标签热区实体失败:', error)
      }
    })
  }
  this.$set(item, 'labelEntityIds', [])

  item.entityIds.forEach(objectId => {
    try {
      if (objectId && objectId.isValid && objectId.isValid()) {
        objectId.erase()
      }
    } catch (error) {
      console.warn('删除 CAD 实体失败:', error)
    }
  })
  this.$set(item, 'entityIds', [])
},

    // 仅清理几何实体（填充/边界等），保留 SVG 名称标签与拾取热区。
    // 重绘时用它替代 eraseConfigurationEntities，可避免反复销毁重建 MxDbSVG 实体
    // （重建会让实体内部的 material 模型重新异步加载，导致图标在编辑后消失）。
    eraseGeometryEntities(item) {
      if (!item) return
      if (!Array.isArray(item.entityIds)) {
        this.$set(item, 'entityIds', [])
        return
      }
      item.entityIds.forEach(objectId => {
        try {
          if (objectId && objectId.isValid && objectId.isValid()) {
            objectId.erase()
          }
        } catch (error) {
          console.warn('删除 CAD 实体失败:', error)
        }
      })
      this.$set(item, 'entityIds', [])
    },

    drawTextEntity(item, position, text, height, layerName, rgb) {
      if (!text) return
      const entity = new McDbText()
      entity.textString = text
      entity.height = height
      entity.position = new McGePoint3d(position.x, position.y + height * 0.8, 0)
      entity.alignmentPoint = entity.position
      entity.horizontalMode = McDb.TextHorzMode.kTextMid
      entity.verticalMode = McDb.TextVertMode.kTextVertMid
      return this.drawCadEntity(
        item,
        entity,
        layerName,
        rgb,
        McDb.LineWeight.kLnWt020
      )
    },

    // 端点名称文字：画在端点圆的右上方，不压住圆点本身
    drawEndpointLabel(item, markerPoint, endpointKey, rgb) {
      const label = WORK_FACE_ENDPOINT_LABELS[endpointKey]
      if (!label || !isPointValid(markerPoint)) return null
      return this.drawTextEntity(
        item,
        point(
          Number(markerPoint.x) + ENDPOINT_LABEL_OFFSET,
          Number(markerPoint.y) + ENDPOINT_LABEL_OFFSET
        ),
        label,
        FIXED_TEXT_HEIGHT,
        WORK_FACE_LAYER,
        rgb
      )
    },

    drawDirectionArrow(item, start, direction, size, layerName, rgb) {
      const end = point(
        start.x + direction.x * size,
        start.y + direction.y * size
      )
      const line = new McDbLine(
        new McGePoint3d(start.x, start.y, 0),
        new McGePoint3d(end.x, end.y, 0)
      )
      this.drawCadEntity(
        item,
        line,
        layerName,
        rgb,
        McDb.LineWeight.kLnWt025
      )

      const normal = { x: -direction.y, y: direction.x }
      const arrowLength = size * 0.22
      const arrowWidth = size * 0.1
      const base = point(
        end.x - direction.x * arrowLength,
        end.y - direction.y * arrowLength
      )
      const arrow = new McDbPolyline()
      arrow.isClosed = true
      arrow.addVertexAt(new McGePoint3d(end.x, end.y, 0))
      arrow.addVertexAt(new McGePoint3d(
        base.x + normal.x * arrowWidth,
        base.y + normal.y * arrowWidth,
        0
      ))
      arrow.addVertexAt(new McGePoint3d(
        base.x - normal.x * arrowWidth,
        base.y - normal.y * arrowWidth,
        0
      ))
      this.drawCadEntity(
        item,
        arrow,
        layerName,
        rgb,
        McDb.LineWeight.kLnWt020
      )
    },

    // —— 独立功能：在工作面上按日期绘制区域块（起点为工作面 polygon 前两个点，沿机头→机尾向量每天前进10m） ——
    renderWorkFaceDailyImages(onlyFace = null) {
      if (!this.mxcad) return
      const faces = onlyFace ? [onlyFace] : this.workFaces
      faces.forEach(face => {
        this.eraseDailyImages(face)
        const pts = Array.isArray(face && face.polygon) && face.polygon.length >= 4
          ? face.polygon
          : null
        if (!pts) return
        const dates = MOCK_DAILY_DATES
        if (!dates.length) return
        // 起点：工作面 polygon 前两个点（机头线两端）
        const hs = point(pts[0].x, pts[0].y)
        const he = point(pts[1].x, pts[1].y)
        // 机尾线：polygon 最后两点
        const ts = point(pts[pts.length - 1].x, pts[pts.length - 1].y)
        const te = point(pts[pts.length - 2].x, pts[pts.length - 2].y)
        // 机头 → 机尾推进向量（推进方向），每天前进 step 米
        const advanceDir = normalizeVector(midpoint(hs, he), midpoint(ts, te))
        if (!advanceDir.length) return
        const total = advanceDir.length
        const ids = []
        // 机头、机尾每天各自随机推进 10~20m（两者步长不同）
        const randomStep = () => 10 + Math.floor(Math.random() * 11)
        let hSum = 0
        let tSum = 0
        for (let i = 0; i < dates.length; i++) {
          if (hSum > total && tSum > total) break
          const date = dates[i]
          const hStep = randomStep()
          const tStep = randomStep()
          // 机头端(hs 侧)按机头累计推进、机尾端(he 侧)按机尾累计推进，四点围成一个日期区域
          const a = point(hs.x + advanceDir.x * hSum, hs.y + advanceDir.y * hSum)
          const b = point(he.x + advanceDir.x * tSum, he.y + advanceDir.y * tSum)
          hSum += hStep
          tSum += tStep
          const c = point(he.x + advanceDir.x * tSum, he.y + advanceDir.y * tSum)
          const d = point(hs.x + advanceDir.x * hSum, hs.y + advanceDir.y * hSum)
          const quad = [a, b, c, d].map(p => new McGePoint3d(p.x, p.y, 0))
          const dailyItem = { id: `${face.id}-daily-${Date.now()}`, kind: 'workface-daily' }
          const fillColor = DAILY_AREA_FILL_COLORS[i % DAILY_AREA_FILL_COLORS.length]

          const hatch = new McDbHatch()
          hatch.appendLoop(new McGePoint3dArray(quad))
          hatch.clearPatternDefinition()
          const hatchId = this.drawCadEntity(dailyItem, hatch, WORK_FACE_LAYER, fillColor, McDb.LineWeight.kLnWt000)
          if (hatchId) ids.push(hatchId)

          const boundary = new McDbPolyline()
          boundary.isClosed = true
          boundary.constantWidth = FIXED_LIGHT_LINE_WIDTH
          quad.forEach(p => boundary.addVertexAt(p))
          const bId = this.drawCadEntity(dailyItem, boundary, WORK_FACE_LAYER, DAILY_AREA_BORDER, McDb.LineWeight.kLnWt025)
          if (bId) ids.push(bId)

          const center = point((a.x + b.x + d.x + c.x) / 4, (a.y + b.y + d.y + c.y) / 4)
          const dateTextHeight = FIXED_TEXT_HEIGHT * 0.7
          // drawTextEntity 内部会将 position 上移 height*0.8，此处提前下移以抵消，使日期文字落在区块垂直中间
          const tId = this.drawTextEntity(
            dailyItem,
            point(center.x, center.y - dateTextHeight * 0.8),
            date,
            dateTextHeight,
            WORK_FACE_LAYER,
            DAILY_AREA_TEXT
          )
          if (tId) ids.push(tId)
        }
        this.$set(face, 'dailyEntityIds', ids)
      })
      if (this.mxcad.updateDisplay) this.mxcad.updateDisplay(true)
    },

    eraseDailyImages(face) {
      if (!face) return
      const ids = face.dailyEntityIds || []
      ids.forEach(objectId => {
        try {
          if (objectId && objectId.isValid && objectId.isValid()) {
            objectId.erase()
          }
        } catch (error) {
          console.warn('移除工作面日期区域失败:', error)
        }
      })
      this.$set(face, 'dailyEntityIds', [])
    },

    // 端点圆用「两个端点 + 两段半圆弧」的闭合多段线表示：McDbCircle 没有 constantWidth，
    // 只有多段线才能用和工作面边界完全相同的方式表达线宽
    createVertexMarker(markerPoint, radius, lineWidth) {
      const polyline = new McDbPolyline()
      polyline.isClosed = true
      polyline.constantWidth = lineWidth
      polyline.addVertexAt(new McGePoint3d(markerPoint.x - radius, markerPoint.y, 0))
      polyline.addVertexAt(new McGePoint3d(markerPoint.x + radius, markerPoint.y, 0))
      polyline.setBulgeAt(0, 1)
      polyline.setBulgeAt(1, 1)
      return polyline
    },

    renderWorkFace(face) {
      if (!this.mxcad || !isWorkFaceGeometryValid(face)) return
      // 只清几何，保留 SVG 名称标签实体（重建会导致图标重载消失）
      this.eraseGeometryEntities(face)
      face.kind = 'workface'
      this.createWorkFaceLabelAnchor(face, this.getWorkFaceLabelDocPoint(face))

      const vertices = Array.isArray(face.polygon) && face.polygon.length >= 3
        ? face.polygon.map(item => point(item.x, item.y))
        : face.bounds
        ? [
          point(face.bounds.minX, face.bounds.minY),
          point(face.bounds.maxX, face.bounds.minY),
          point(face.bounds.maxX, face.bounds.maxY),
          point(face.bounds.minX, face.bounds.maxY)
        ]
        : [
          point(face.headStart.x, face.headStart.y),
          point(face.headEnd.x, face.headEnd.y),
          point(face.tailEnd.x, face.tailEnd.y),
          point(face.tailStart.x, face.tailStart.y)
        ]
      const cadVertices = vertices.map(item => new McGePoint3d(item.x, item.y, 0))
      const textHeight = FIXED_TEXT_HEIGHT
      const markerRadius = FIXED_MARKER_RADIUS

      const hatch = new McDbHatch()
      hatch.appendLoop(new McGePoint3dArray(cadVertices))
      hatch.clearPatternDefinition()
      const hatchId = this.drawCadEntity(
        face,
        hatch,
        WORK_FACE_LAYER,
        WORK_FACE_FILL_COLOR,
        McDb.LineWeight.kLnWt000
      )
      // 保存填充实体引用，供顶点编辑态下同步填充轮廓使用
      this.$set(face, 'draftHatchId', hatchId)

      const lineWidth = Number(face.lineWidth) > 0 ? Number(face.lineWidth) : FIXED_LINE_WIDTH
      const lineColor = hexToRgb(face.lineColor) || WORK_FACE_COLOR

      const boundary = new McDbPolyline()
      boundary.isClosed = true
      boundary.constantWidth = lineWidth
      cadVertices.forEach(vertex => boundary.addVertexAt(vertex))
      const boundaryId = this.drawCadEntity(
        face,
        boundary,
        WORK_FACE_LAYER,
        lineColor,
        McDb.LineWeight.kLnWt070
      )
      // 保存边界实体引用，供顶点编辑态下增量更新边界使用
      this.$set(face, 'draftBoundaryId', boundaryId)

      // 机头/机尾四个端点用小圆圈标出，线色与线宽跟随该工作面的配置
      WORK_FACE_ENDPOINTS.forEach(key => {
        this.drawCadEntity(
          face,
          this.createVertexMarker(face[key], FIXED_MARKER_RADIUS, lineWidth),
          WORK_FACE_LAYER,
          lineColor,
          McDb.LineWeight.kLnWt070
        )
        // 端点旁标出「机头开始」这类名称，避免只看到圆点却不知道是哪一个点
        this.drawEndpointLabel(face, face[key], key, lineColor)
      })

    //   const headMidpoint = midpoint(face.headStart, face.headEnd)
    //   const tailMidpoint = midpoint(face.tailStart, face.tailEnd)
    //   const centerLine = new McDbLine(
    //     new McGePoint3d(face.headStart.x, face.headStart.y, 0),
    //     new McGePoint3d(face.tailStart.x, face.tailStart.y, 0)
    //   )
    //   this.drawCadEntity(
    //     face,
    //     centerLine,
    //     WORK_FACE_LAYER,
    //     [89, 166, 231],
    //     McDb.LineWeight.kLnWt018
    //   )

    //   const rangeCircle = new McDbCircle(
    //     face.range.x,
    //     face.range.y,
    //     0,
    //     markerRadius
    //   )
    //   this.drawCadEntity(
    //     face,
    //     rangeCircle,
    //     WORK_FACE_LAYER,
    //     [12, 82, 214],
    //     McDb.LineWeight.kLnWt025
    //   )

    //   const headDirection = normalizeVector(face.headStart, face.tailStart)
    //   if (headDirection.length > 0) {
    //     this.drawDirectionArrow(
    //       face,
    //       point(face.range.x, face.range.y + textHeight * 1.35),
    //       headDirection,
    //       FIXED_ARROW_SIZE,
    //       WORK_FACE_LAYER,
    //       [255, 0, 0]
    //     )
    //   }

    },

    renderWorkFace1(face) {
      if (!this.mxcad || !isWorkFaceGeometryValid(face)) return
      this.eraseConfigurationEntities(face)
      face.kind = 'workface'

      const vertices = Array.isArray(face.polygon) && face.polygon.length >= 3
        ? face.polygon.map(item => point(item.x, item.y))
        : face.bounds
        ? [
          point(face.bounds.minX, face.bounds.minY),
          point(face.bounds.maxX, face.bounds.minY),
          point(face.bounds.maxX, face.bounds.maxY),
          point(face.bounds.minX, face.bounds.maxY)
        ]
        : [
          point(face.headStart.x, face.headStart.y),
          point(face.headEnd.x, face.headEnd.y),
          point(face.tailEnd.x, face.tailEnd.y),
          point(face.tailStart.x, face.tailStart.y)
        ]
      const cadVertices = vertices.map(item => new McGePoint3d(item.x, item.y, 0))
      const textHeight = FIXED_TEXT_HEIGHT
      const markerRadius = FIXED_MARKER_RADIUS

      const hatch = new McDbHatch()
      hatch.appendLoop(new McGePoint3dArray(cadVertices))
      hatch.clearPatternDefinition()
      this.drawCadEntity(
        face,
        hatch,
        WORK_FACE_LAYER,
        WORK_FACE_FILL_COLOR,
        McDb.LineWeight.kLnWt000
      )

      const boundary = new McDbPolyline()
      boundary.isClosed = true
      boundary.constantWidth = FIXED_LINE_WIDTH
      cadVertices.forEach(vertex => boundary.addVertexAt(vertex))
      this.drawCadEntity(
        face,
        boundary,
        WORK_FACE_LAYER,
        WORK_FACE_COLOR,
        McDb.LineWeight.kLnWt070
      )

      const headMidpoint = midpoint(face.headStart, face.headEnd)
      const tailMidpoint = midpoint(face.tailStart, face.tailEnd)
      const centerLine = new McDbLine(
        new McGePoint3d(headMidpoint.x, headMidpoint.y, 0),
        new McGePoint3d(tailMidpoint.x, tailMidpoint.y, 0)
      )
      this.drawCadEntity(
        face,
        centerLine,
        WORK_FACE_LAYER,
        [89, 166, 231],
        McDb.LineWeight.kLnWt018
      )

      const rangeCircle = new McDbCircle(
        face.range.x,
        face.range.y,
        0,
        markerRadius
      )
      this.drawCadEntity(
        face,
        rangeCircle,
        WORK_FACE_LAYER,
        [12, 82, 214],
        McDb.LineWeight.kLnWt025
      )

      const headDirection = normalizeVector(face.headStart, face.headEnd)
      if (headDirection.length > 0) {
        this.drawDirectionArrow(
          face,
          point(face.range.x, face.range.y + textHeight * 1.35),
          headDirection,
          FIXED_ARROW_SIZE,
          WORK_FACE_LAYER,
          [12, 82, 214]
        )
      }

      ;[
        { point: headMidpoint, color: [21, 150, 214] },
        { point: tailMidpoint, color: [230, 126, 34] }
      ].forEach(item => {
        const marker = new McDbCircle(
          item.point.x,
          item.point.y,
          0,
          markerRadius * 0.7
        )
        this.drawCadEntity(
          face,
          marker,
          WORK_FACE_LAYER,
          item.color,
          McDb.LineWeight.kLnWt025
        )
      })

      const center = point(
        (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4,
        (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4
      )
      this.drawTextEntity(
        face,
        point(center.x, center.y + textHeight * 1.1),
        face.name,
        textHeight,
        WORK_FACE_LAYER,
        [20, 80, 190]
      )
    //   this.drawTextEntity(
    //     face,
    //     point(face.range.x, face.range.y - textHeight * 1.3),
    //     face.code,
    //     textHeight * 0.9,
    //     WORK_FACE_LAYER,
    //     [20, 80, 190]
    //   )
    },

    renderDraftWorkFace(face) {
      if (!this.mxcad || !Array.isArray(face.polygon) || face.polygon.length < 3) return
      this.eraseConfigurationEntities(face)
      face.kind = 'workface'
      const draftLabelPoint = this.getWorkFaceLabelDocPoint(face)
      this.createWorkFaceLabelAnchor(face, draftLabelPoint)

      const vertices = face.polygon.map(item => point(item.x, item.y))
      const cadVertices = vertices.map(item => new McGePoint3d(item.x, item.y, 0))
      const markerRadius = FIXED_MARKER_RADIUS

      const hatch = new McDbHatch()
      hatch.appendLoop(new McGePoint3dArray(cadVertices))
      hatch.clearPatternDefinition()
      this.drawCadEntity(
        face,
        hatch,
        WORK_FACE_LAYER,
        WORK_FACE_FILL_COLOR,
        McDb.LineWeight.kLnWt000
      )

      const boundary = new McDbPolyline()
      boundary.isClosed = true
      boundary.constantWidth = FIXED_LINE_WIDTH
      cadVertices.forEach(vertex => boundary.addVertexAt(vertex))
      const boundaryId = this.drawCadEntity(
        face,
        boundary,
        WORK_FACE_LAYER,
        WORK_FACE_COLOR,
        McDb.LineWeight.kLnWt070
      )

      const vertexIds = vertices.map(item => {
        return this.drawCadEntity(
          face,
          new McDbCircle(item.x, item.y, 0, markerRadius),
          WORK_FACE_LAYER,
          [255, 255, 255],
          McDb.LineWeight.kLnWt025
        )
      })
      this.$set(face, 'draftBoundaryId', boundaryId)
      this.$set(face, 'draftVertexIds', vertexIds)
      this.mxcad.updateDisplay(true)
    },

    renderDraftSection(section) {
      if (!this.mxcad || !Array.isArray(section.polygon) || section.polygon.length < 3) return
      this.eraseConfigurationEntities(section)
      section.kind = 'section'
      this.createSectionLabelAnchor(section, this.getSectionLabelDocPoint(section))

      const vertices = section.polygon.map(item => point(item.x, item.y))
      const cadVertices = vertices.map(item => new McGePoint3d(item.x, item.y, 0))
      const markerRadius = FIXED_MARKER_RADIUS

      const hatch = new McDbHatch()
      hatch.appendLoop(new McGePoint3dArray(cadVertices))
      hatch.clearPatternDefinition()
      this.drawCadEntity(
        section,
        hatch,
        SECTION_LAYER,
        SECTION_FILL_COLOR,
        McDb.LineWeight.kLnWt000
      )

      const boundary = new McDbPolyline()
      boundary.isClosed = true
      boundary.constantWidth = FIXED_LINE_WIDTH
      cadVertices.forEach(vertex => boundary.addVertexAt(vertex))
      const boundaryId = this.drawCadEntity(
        section,
        boundary,
        SECTION_LAYER,
        SECTION_COLOR,
        McDb.LineWeight.kLnWt070
      )

      const vertexIds = vertices.map(item => {
        return this.drawCadEntity(
          section,
          new McDbCircle(item.x, item.y, 0, markerRadius),
          SECTION_LAYER,
          [255, 255, 255],
          McDb.LineWeight.kLnWt025
        )
      })
      this.$set(section, 'draftBoundaryId', boundaryId)
      this.$set(section, 'draftVertexIds', vertexIds)
      this.mxcad.updateDisplay(true)
    },

    createWorkFaceLabelAnchor(face, docPoint) {
  if (!face || !isPointValid(docPoint)) return
  const worldPoint = MxFun.docCoord2World(docPoint.x, docPoint.y, 0)
  const mxObj = MxFun.getCurrentDraw()
  if (!worldPoint || !mxObj || !mxObj.addMxEntity) return

  const iconRealSize = MxFun.docCoordLong2World(FIXED_LABEL_SIZE)

  // 已有标签实体则只移动位置 / 刷新文字，不销毁重建：
  // MxDbSVG 内部缓存模型 material，反复 add/erase 会让图标异步重载而消失
  if (face.labelEntityId && mxObj.getMxEntity) {
    const exist = mxObj.getMxEntity(face.labelEntityId)
    if (exist && exist.setSvgPostion) {
      exist.setSvgPostion(worldPoint)
      const text = exist.getText && exist.getText(0)
      if (text) {
        text.txt = face.name || face.code || '工作面'
        text.txtPos = new THREE.Vector3(
          worldPoint.x,
          worldPoint.y + iconRealSize * 0.34,
          worldPoint.z || 0
        )
      }
      this.moveLabelHotRect(face, docPoint)
      return
    }
  }

  // svg显示包围盒（仅视觉渲染，不再作为拾取主体）
  const svg = new MxDbSVG()
  svg.setSvgPath('models/svg/target.svg')
  svg.useSvgColor = true
  svg.setColor(0x164bd8)
  svg.setSvgPostion(worldPoint)
  svg.setSvgSize(new THREE.Vector2(iconRealSize, 0))
  svg.setSvgAlignmentRatio(new THREE.Vector2(0.5, 1))
  svg.setRenderOrder(MxType.MxDefaultRenderOrder.kMxEntityRenderOrder + 2)
  // svg仅用于显示，不再依靠它做拾取，userData可以移除
  const textHeight = iconRealSize * 0.22
  const text = new MxDbSVGText()
  text.txt = face.name || face.code || '工作面'
  text.txtPos = new THREE.Vector3(
    worldPoint.x,
    worldPoint.y + iconRealSize * 0.34,
    worldPoint.z || 0
  )
  text.txtHeight = textHeight
  text.color = 0xffffff
  text.fontStyle = 'bold'
  svg.addText(text)

  const entityId = mxObj.addMxEntity(svg)
  this.$set(face, 'labelEntityId', entityId)

  // =========【方案B核心】生成CAD透明拾取热区矩形（doc世界坐标，跟随缩放平移）=========
  const hotRect = new McDbPolyline()
  hotRect.isClosed = true
  this.labelHotRectCorners(docPoint).forEach(item => hotRect.addVertexAt(item))

  const hotItem = { id: `${face.id}-hot`, kind: 'label-hot', entityIds: [] }
  const hotId = this.drawCadEntity(
    hotItem,
    hotRect,
    WORK_FACE_LAYER,
    [0, 0, 0],
    McDb.LineWeight.kLnWt005
  )
  if (hotId) {
    const obj = hotId.getMcDbObject()
    if (obj && obj.setxDataString) {
      // 存入自定义数据，拾取时解析
      obj.setxDataString('MX_LABEL', `workface:${face.id}`)
    }
  }
  // 保存热区实体id，后续统一擦除
  this.$set(face, 'labelEntityIds', hotItem.entityIds || [])
},

  // 名称标签拾取热区的四个角点（doc 文档坐标），大小适配图标+文字
  labelHotRectCorners(docPoint) {
    const hotW = FIXED_LABEL_SIZE * 2.8
    const hotH = FIXED_LABEL_SIZE * 1.6
    return [
      new McGePoint3d(docPoint.x - hotW / 2, docPoint.y, 0),
      new McGePoint3d(docPoint.x + hotW / 2, docPoint.y, 0),
      new McGePoint3d(docPoint.x + hotW / 2, docPoint.y + hotH, 0),
      new McGePoint3d(docPoint.x - hotW / 2, docPoint.y + hotH, 0)
    ]
  },

  // 跟随名称标签移动拾取热区（复用同一实体，不重建）
  moveLabelHotRect(item, docPoint) {
    if (!item || !isPointValid(docPoint)) return
    const ids = Array.isArray(item.labelEntityIds) ? item.labelEntityIds : []
    if (!ids.length) return
    try {
      const poly = ids[0] && ids[0].getMcDbEntity ? ids[0].getMcDbEntity() : null
      if (poly && poly.setPointAt) {
        this.labelHotRectCorners(docPoint).forEach((corner, index) => {
          poly.setPointAt(index, corner)
        })
      }
    } catch (error) {
      console.warn('更新标签热区失败:', error)
    }
  },


    getSectionLabelDocPoint(section) {
  if (Array.isArray(section.polygon) && section.polygon.length >= 3) {
    const validPoints = section.polygon.filter(isPointValid)
    if (validPoints.length) {
      return point(
        validPoints.reduce((sum, item) => sum + Number(item.x), 0) / validPoints.length,
        validPoints.reduce((sum, item) => sum + Number(item.y), 0) / validPoints.length
      )
    }
  }
  if (isPointValid(section.range)) return point(section.range.x, section.range.y)
  if (section.bounds) {
    return point(
      (Number(section.bounds.minX) + Number(section.bounds.maxX)) / 2,
      (Number(section.bounds.minY) + Number(section.bounds.maxY)) / 2
    )
  }
  return null
},

    createSectionLabelAnchor(section, docPoint) {
  if (!section || !isPointValid(docPoint)) return
  const worldPoint = MxFun.docCoord2World(docPoint.x, docPoint.y, 0)
  const mxObj = MxFun.getCurrentDraw()
  if (!worldPoint || !mxObj || !mxObj.addMxEntity) return

  const iconRealSize = MxFun.docCoordLong2World(FIXED_LABEL_SIZE)

  // 已有标签实体则只移动位置 / 刷新文字，不销毁重建（原因同工作面标签）
  if (section.labelEntityId && mxObj.getMxEntity) {
    const exist = mxObj.getMxEntity(section.labelEntityId)
    if (exist && exist.setSvgPostion) {
      exist.setSvgPostion(worldPoint)
      const text = exist.getText && exist.getText(0)
      if (text) {
        text.txt = section.name || section.code || '断面'
        text.txtPos = new THREE.Vector3(
          worldPoint.x,
          worldPoint.y + iconRealSize * 0.34,
          worldPoint.z || 0
        )
      }
      this.moveLabelHotRect(section, docPoint)
      return
    }
  }

  const svg = new MxDbSVG()
  svg.setSvgPath('models/svg/target.svg')
  svg.useSvgColor = true
  svg.setColor(0xe74545)
  svg.setSvgPostion(worldPoint)
  svg.setSvgSize(new THREE.Vector2(iconRealSize, 0))
  svg.setSvgAlignmentRatio(new THREE.Vector2(0.5, 1))
  svg.setRenderOrder(MxType.MxDefaultRenderOrder.kMxEntityRenderOrder + 2)

  const textHeight = iconRealSize * 0.22
  const text = new MxDbSVGText()
  text.txt = section.name || section.code || '断面'
  text.txtPos = new THREE.Vector3(
    worldPoint.x,
    worldPoint.y + iconRealSize * 0.34,
    worldPoint.z || 0
  )
  text.txtHeight = textHeight
  text.color = 0xffffff
  text.fontStyle = 'bold'
  svg.addText(text)

  const entityId = mxObj.addMxEntity(svg)
  this.$set(section, 'labelEntityId', entityId)

  // CAD透明拾取热区矩形
  const hotRect = new McDbPolyline()
  hotRect.isClosed = true
  this.labelHotRectCorners(docPoint).forEach(item => hotRect.addVertexAt(item))

  const hotItem = { id: `${section.id}-hot`, kind: 'label-hot', entityIds: [] }
  const hotId = this.drawCadEntity(
    hotItem,
    hotRect,
    SECTION_LAYER,
    [0, 0, 0],
    McDb.LineWeight.kLnWt005
  )
  if (hotId) {
    const obj = hotId.getMcDbObject()
    if (obj && obj.setxDataString) {
      obj.setxDataString('MX_LABEL', `section:${section.id}`)
    }
  }
  this.$set(section, 'labelEntityIds', hotItem.entityIds || [])
},


    refreshWorkFaceLabelEntity(face) {
      if (!face) return
      // 只移动/刷新已有标签，不销毁重建
      this.createWorkFaceLabelAnchor(face, this.getWorkFaceLabelDocPoint(face))
    },

    refreshSectionLabelEntity(section) {
      if (!section) return
      this.createSectionLabelAnchor(section, this.getSectionLabelDocPoint(section))
    },

    getSectionLine(section) {
      const firstLink = Array.isArray(section.workFaceLinks) ? section.workFaceLinks[0] : null
      const face = firstLink
        ? this.workFaces.find(item => item.id === firstLink.workFaceId)
        : null
      if (section.bounds) {
        const width = Number(section.bounds.maxX) - Number(section.bounds.minX)
        const height = Number(section.bounds.maxY) - Number(section.bounds.minY)
        const centerX = (Number(section.bounds.minX) + Number(section.bounds.maxX)) / 2
        const centerY = (Number(section.bounds.minY) + Number(section.bounds.maxY)) / 2
        if (width >= height) {
          return {
            start: point(section.bounds.minX, centerY),
            end: point(section.bounds.maxX, centerY),
            face,
            t: 0.5,
            span: Math.max(width, 1)
          }
        }
        return {
          start: point(centerX, section.bounds.minY),
          end: point(centerX, section.bounds.maxY),
          face,
          t: 0.5,
          span: Math.max(height, 1)
        }
      }

      if (isWorkFaceGeometryValid(face)) {
        const t = projectParameter(section.range, face.headStart, face.headEnd)
        const headPoint = interpolate(face.headStart, face.headEnd, t)
        const tailPoint = interpolate(face.tailStart, face.tailEnd, t)
        return {
          start: headPoint,
          end: tailPoint,
          face,
          t,
          span: Math.max(distance(headPoint, tailPoint), 1)
        }
      }

      const span = 500
      return {
        start: point(section.range.x - span, section.range.y - span * 0.35),
        end: point(section.range.x + span, section.range.y + span * 0.35),
        face: null,
        t: 0.5,
        span: span * 2
      }
    },

    renderSection(section) {
      if (!this.mxcad || !isPointValid(section.range)) return
      // 只清几何，保留 SVG 名称标签实体（重建会导致图标重载消失）
      this.eraseGeometryEntities(section)
      section.kind = 'section'
      this.createSectionLabelAnchor(section, this.getSectionLabelDocPoint(section))

      const geometry = this.getSectionLine(section)
      const lineWidth = FIXED_LINE_WIDTH
      const markerRadius = FIXED_MARKER_RADIUS
      const textHeight = FIXED_TEXT_HEIGHT

      if ((Array.isArray(section.polygon) && section.polygon.length >= 3) || section.bounds) {
        const selectionPoints = Array.isArray(section.polygon) && section.polygon.length >= 3
          ? section.polygon
          : [
            point(section.bounds.minX, section.bounds.minY),
            point(section.bounds.maxX, section.bounds.minY),
            point(section.bounds.maxX, section.bounds.maxY),
            point(section.bounds.minX, section.bounds.maxY)
          ]
        const selectionArea = new McDbPolyline()
        selectionArea.isClosed = true
        selectionArea.constantWidth = FIXED_LIGHT_LINE_WIDTH
        selectionPoints.forEach(item => {
          selectionArea.addVertexAt(new McGePoint3d(item.x, item.y, 0))
        })
        const boundaryId = this.drawCadEntity(
          section,
          selectionArea,
          SECTION_LAYER,
          SECTION_COLOR,
          McDb.LineWeight.kLnWt050
        )
        // 保存边界实体引用，供顶点编辑态下增量更新使用
        this.$set(section, 'draftBoundaryId', boundaryId)
      }

    //   const sectionLine = new McDbLine(
    //     new McGePoint3d(geometry.start.x, geometry.start.y, 0),
    //     new McGePoint3d(geometry.end.x, geometry.end.y, 0)
    //   )
    //   sectionLine.constantWidth = lineWidth
    //   this.drawCadEntity(
    //     section,
    //     sectionLine,
    //     SECTION_LAYER,
    //     [231, 69, 69],
    //     McDb.LineWeight.kLnWt050
    //   )

      

      
      
      const markerCenter = interpolate(geometry.start, geometry.end, 0.5)

    },

    renderSection1(section) {
      if (!this.mxcad || !isPointValid(section.range)) return
      this.eraseConfigurationEntities(section)
      section.kind = 'section'
      this.createSectionLabelAnchor(section, section.range)

      const geometry = this.getSectionLine(section)
      const lineWidth = FIXED_LINE_WIDTH
      const markerRadius = FIXED_MARKER_RADIUS
      const textHeight = FIXED_TEXT_HEIGHT

      if ((Array.isArray(section.polygon) && section.polygon.length >= 3) || section.bounds) {
        const selectionPoints = Array.isArray(section.polygon) && section.polygon.length >= 3
          ? section.polygon
          : [
            point(section.bounds.minX, section.bounds.minY),
            point(section.bounds.maxX, section.bounds.minY),
            point(section.bounds.maxX, section.bounds.maxY),
            point(section.bounds.minX, section.bounds.maxY)
          ]
        const selectionArea = new McDbPolyline()
        selectionArea.isClosed = true
        selectionArea.constantWidth = FIXED_LIGHT_LINE_WIDTH
        selectionPoints.forEach(item => {
          selectionArea.addVertexAt(new McGePoint3d(item.x, item.y, 0))
        })
        this.drawCadEntity(
          section,
          selectionArea,
          SECTION_LAYER,
          SECTION_COLOR,
          McDb.LineWeight.kLnWt020
        )
      }

      const sectionLine = new McDbLine(
        new McGePoint3d(geometry.start.x, geometry.start.y, 0),
        new McGePoint3d(geometry.end.x, geometry.end.y, 0)
      )
      sectionLine.constantWidth = lineWidth
      this.drawCadEntity(
        section,
        sectionLine,
        SECTION_LAYER,
        [231, 69, 69],
        McDb.LineWeight.kLnWt080
      )

      ;[geometry.start, geometry.end].forEach((item, index) => {
        const circle = new McDbCircle(
          item.x,
          item.y,
          0,
          markerRadius
        )
        this.drawCadEntity(
          section,
          circle,
          SECTION_LAYER,
          index === 0 ? [233, 80, 73] : [178, 46, 40],
          McDb.LineWeight.kLnWt025
        )
      })

      if (geometry.face) {
        const direction = normalizeVector(
          geometry.face.headStart,
          geometry.face.headEnd
        )
        const firstLink = Array.isArray(section.workFaceLinks) ? section.workFaceLinks[0] : null
        const warningDistance = firstLink ? Number(firstLink.warningDistance) || 0 : 0
        if (warningDistance > 0) {
          const startPlus = point(
            geometry.start.x + direction.x * warningDistance,
            geometry.start.y + direction.y * warningDistance
          )
          const endPlus = point(
            geometry.end.x + direction.x * warningDistance,
            geometry.end.y + direction.y * warningDistance
          )
          const startMinus = point(
            geometry.start.x - direction.x * warningDistance,
            geometry.start.y - direction.y * warningDistance
          )
          const endMinus = point(
            geometry.end.x - direction.x * warningDistance,
            geometry.end.y - direction.y * warningDistance
          )
          const warningArea = new McDbPolyline()
          warningArea.isClosed = true
          warningArea.constantWidth = FIXED_LIGHT_LINE_WIDTH
          ;[startPlus, endPlus, endMinus, startMinus].forEach(item => {
            warningArea.addVertexAt(new McGePoint3d(item.x, item.y, 0))
          })
          this.drawCadEntity(
            section,
            warningArea,
            SECTION_LAYER,
            [248, 190, 120],
            McDb.LineWeight.kLnWt018
          )
        }
      }

      const markerDirection = normalizeVector(
        geometry.start,
        geometry.end
      )
      const markerCenter = interpolate(geometry.start, geometry.end, 0.5)
      if (markerDirection.length > 0) {
        this.drawDirectionArrow(
          section,
          markerCenter,
          {
            x: -markerDirection.y,
            y: markerDirection.x
          },
          FIXED_ARROW_SIZE,
          SECTION_LAYER,
          [222, 63, 64]
        )
      }

    },

    renderAllConfigurations() {
      if (!this.mxcad) return
      this.ensureLayer(WORK_FACE_LAYER)
      this.ensureLayer(SECTION_LAYER)
      this.workFaces.forEach(face => {
        if (face.status === 'draft') {
          this.renderDraftWorkFace(face)
        } else {
          this.renderWorkFace(face)
        }
      })
      this.sections.forEach(section => {
        if (section.status === 'draft') {
          this.renderDraftSection(section)
        } else {
          this.renderSection(section)
        }
      })
      // 独立功能：在工作面上按日期绘制区域块（使用模拟数据）
      this.renderWorkFaceDailyImages()
      try {
        this.mxcad.updateDisplay(true)
      } catch (error) {
        console.warn('刷新 CAD 显示失败:', error)
      }
    },

    openWorkFaceDialog() {
      if (!this.mxcad) {
        this.$Message.warning('图纸尚未加载完成')
        return
      }
      this.activeConfigTab = 'workface'
      // 工作面不再框选：直接开配置弹窗，由机头/机尾四个端点推导闭合多边形
      this.openWorkFaceConfig({
        id: `workface-${Date.now()}`,
        code: this.nextWorkFaceCode,
        name: '',
        headStart: { x: '', y: '' },
        headEnd: { x: '', y: '' },
        tailStart: { x: '', y: '' },
        tailEnd: { x: '', y: '' },
        lineWidth: FIXED_LINE_WIDTH,
        lineColor: DEFAULT_WORK_FACE_LINE_COLOR,
        entityIds: []
      })
      this.$Message.info('请配置机头/机尾坐标，确认后自动绘制工作面')
    },

    openWorkFaceConfig(item) {
      if (!item) return
      // 打开配置弹窗前退出顶点编辑态，避免确认重绘后把手残留 / 边界引用失效
      this.exitVertexEdit()
      this.clearWorkFaceEndpointPreview()
      this.editingWorkFace = item
      this.workFaceDialogVisible = true
    },

    // 新建工作面时，把弹窗里已选定的端点及其名称实时画到图纸上，
    // 否则选完点弹窗重新盖住图纸，用户看不到自己点在了哪里
    renderWorkFaceEndpointPreview(payload) {
      this.clearWorkFaceEndpointPreview()
      if (!this.mxcad || !payload) return
      const lineWidth = Number(payload.lineWidth) > 0 ? Number(payload.lineWidth) : FIXED_LINE_WIDTH
      const lineColor = hexToRgb(payload.lineColor) || WORK_FACE_COLOR
      // 借用一次性的 item 收集 objectId，结束后转存到 workFacePreviewIds 单独管理，
      // 不挂到 editingWorkFace 上，避免预览实体被正式重绘当成工作面几何误删
      const preview = { id: `workface-preview-${Date.now()}`, kind: 'workface-preview' }
      WORK_FACE_ENDPOINTS.forEach(key => {
        if (!isPointValid(payload[key])) return
        this.drawCadEntity(
          preview,
          this.createVertexMarker(payload[key], FIXED_MARKER_RADIUS, lineWidth),
          WORK_FACE_LAYER,
          lineColor,
          McDb.LineWeight.kLnWt070
        )
        this.drawEndpointLabel(preview, payload[key], key, lineColor)
      })
      this.workFacePreviewIds = preview.entityIds ? preview.entityIds.slice() : []
      this.mxcad.updateDisplay(true)
    },

    clearWorkFaceEndpointPreview() {
      this.workFacePreviewIds.forEach(objectId => {
        try {
          if (objectId && objectId.isValid && objectId.isValid()) objectId.erase()
        } catch (error) {
          console.warn('清除端点预览失败:', error)
        }
      })
      this.workFacePreviewIds = []
    },

    async startAreaSelection(kind) {
      if (!this.mxcad) {
        this.$Message.warning('图纸尚未加载完成')
        return
      }

      this.removePolygonReference()
      this.exitVertexEdit()
      const label = kind === 'workface' ? '工作面' : '断面'
      this.currentCommand = 'AREA_SELECT'
      try {
        this.$Message.info(`请依次选择${label}多边形顶点，输入F或者右键完成`)
        this.startPolygonKeyboardCapture()
        const polygon = await this.pickPolygonArea(kind)
        if (!polygon) return
        // 圈选完成后保留多边形连线，作为配置弹窗中坐标点选的参照；点击弹窗“确认”后才移除
        this.polygonSelectionPreviewIds = this.drawPolygonReference(polygon, kind)
        const bounds = this.normalizePolygonBounds(polygon)
        if (kind === 'workface') {
          const draft = {
            id: `workface-${Date.now()}`,
            code: this.nextWorkFaceCode,
            name: '新工作面',
            range: {
              x: (bounds.minX + bounds.maxX) / 2,
              y: (bounds.minY + bounds.maxY) / 2
            },
            headStart: { x: '', y: '' },
            headEnd: { x: '', y: '' },
            tailStart: { x: '', y: '' },
            tailEnd: { x: '', y: '' },
            bounds,
            polygon,
            entityIds: []
          }
          // 圈选完成后直接弹出配置弹窗，确认后再加入列表并正式绘制（不出现临时工作面）
          this.activeConfigTab = 'workface'
          this.openWorkFaceConfig(draft)
          this.$Message.info('请完善工作面配置，确认后自动加入列表')
        } else {
          const draft = {
            id: `section-${Date.now()}`,
            code: this.nextSectionCode,
            name: '新断面',
            range: {
              x: (bounds.minX + bounds.maxX) / 2,
              y: (bounds.minY + bounds.maxY) / 2
            },
            workFaceLinks: [],
            bounds,
            polygon,
            entityIds: []
          }
          // 圈选完成后直接弹出配置弹窗，确认后再加入列表并正式绘制（不出现临时断面）
          this.activeConfigTab = 'section'
          this.openSectionConfig(draft)
          this.$Message.info('请完善断面配置，确认后自动加入列表')
        }
      } catch (error) {
        console.warn('圈选区域失败:', error)
        this.$Message.warning('未获取到有效的圈选范围')
      } finally {
        this.stopPolygonKeyboardCapture()
        this.currentCommand = ''
        if (this.mxcad && this.mxcad.updateDisplay) {
          this.mxcad.updateDisplay(true)
        }
      }
    },

    drawPolygonReference(polygon, kind = 'workface') {
      if (!this.mxcad || !Array.isArray(polygon) || polygon.length < 3) return []
      const isSection = kind === 'section'
      const layerName = isSection ? SECTION_LAYER : WORK_FACE_LAYER
      const color = isSection ? SECTION_COLOR : WORK_FACE_COLOR
      const draftItem = {
        id: `${kind}-draft-${Date.now()}`,
        kind: `${kind}-draft`,
        entityIds: []
      }
      const polyline = new McDbPolyline()
      polyline.isClosed = true
      polyline.constantWidth = Math.max(
        this.getPolygonPreviewWidth(polygon),
        1
      )
      polygon.forEach(item => {
        polyline.addVertexAt(new McGePoint3d(item.x, item.y, 0))
      })
      this.drawCadEntity(
        draftItem,
        polyline,
        layerName,
        color,
        McDb.LineWeight.kLnWt070
      )

      const markerRadius = FIXED_MARKER_RADIUS
      polygon.forEach(item => {
        this.drawCadEntity(
          draftItem,
          new McDbCircle(item.x, item.y, 0, markerRadius),
          layerName,
          color,
          McDb.LineWeight.kLnWt025
        )
      })
      if (this.mxcad.updateDisplay) this.mxcad.updateDisplay(true)
      return draftItem.entityIds
    },

    removePolygonReference() {
      if (!this.polygonSelectionPreviewIds.length) return
      this.polygonSelectionPreviewIds.forEach(objectId => {
        try {
          if (objectId && objectId.isValid && objectId.isValid()) {
            objectId.erase()
          }
        } catch (error) {
          console.warn('移除圈选参照线失败:', error)
        }
      })
      this.polygonSelectionPreviewIds = []
      if (this.mxcad && this.mxcad.updateDisplay) {
        this.mxcad.updateDisplay(true)
      }
    },

    async pickPolygonArea(kind = 'workface') {
      const polygon = []
      const isSection = kind === 'section'
      const color = isSection ? SECTION_COLOR : WORK_FACE_COLOR
      const fillColor = isSection ? 0xfce2de : 0xdaf1fa

      while (true) {
        const getPoint = new MxCADUiPrPoint()
        if (polygon.length === 0) {
          getPoint.setMessage('\n请指定工作面多边形的第一个点:')
        } else {
          const lastPoint = polygon[polygon.length - 1]
          getPoint.setBasePt(new McGePoint3d(lastPoint.x, lastPoint.y, 0))
          getPoint.setUseBasePt(true)
          getPoint.setKeyWords('[完成(F)]')
          getPoint.setMessage('\n指定下一个点，按 F 或鼠标右键完成（多边形默认闭合）:')
          getPoint.setUserDraw((currentPoint, worldDraw) => {
            const previewPoints = polygon.concat([{
              x: Number(currentPoint.x),
              y: Number(currentPoint.y)
            }])
            const preview = new McDbPolyline()
            preview.isClosed = polygon.length >= 2
            preview.trueColor = new McCmColor(
              color[0],
              color[1],
              color[2]
            )
            preview.lineweight = McDb.LineWeight.kLnWt070
            preview.constantWidth = Math.max(
              this.getPolygonPreviewWidth(previewPoints),
              1
            )
            previewPoints.forEach(item => {
              preview.addVertexAt(new McGePoint3d(item.x, item.y, 0))
            })

            if (previewPoints.length >= 3) {
              worldDraw.setColor(fillColor)
              worldDraw.drawSolid(
                previewPoints.map(item => (
                  new McGePoint3d(item.x, item.y, 0).toVector3()
                )),
                0.12
              )
            }
            worldDraw.drawMcDbEntity(preview, false, true)
          })
        }

        const currentPoint = await getPoint.go()
        if (this.polygonFinishRequested) {
          this.polygonFinishRequested = false
          this.polygonCloseRequested = false
          if (polygon.length >= 3) return polygon
          this.$Message.warning('至少选择 3 个点后才能完成')
          continue
        }
        if (getPoint.isKeyWordPicked('F')) {
          if (polygon.length >= 3) return polygon
          this.$Message.warning('至少选择 3 个点后才能完成')
          continue
        }
        if (!currentPoint) return null

        const selectedPoint = point(currentPoint.x, currentPoint.y)
        if (polygon.length >= 3) {
          const firstDistance = distance(selectedPoint, polygon[0])
          let totalLength = 0
          for (let index = 1; index < polygon.length; index++) {
            totalLength += distance(polygon[index - 1], polygon[index])
          }
          const averageLength = totalLength / (polygon.length - 1)
          if (averageLength > 0 && firstDistance <= averageLength * 0.12) {
            return polygon
          }
        }
        polygon.push(selectedPoint)
      }
    },

    getPolygonPreviewWidth() {
      return FIXED_LINE_WIDTH
    },

    startPolygonKeyboardCapture() {
      this.isPolygonSelecting = true
      this.polygonFinishRequested = false
      this.polygonCloseRequested = false
      window.addEventListener('keydown', this.handlePolygonKeyDown, true)
      window.addEventListener('mousedown', this.handlePolygonRightMouseDown, true)
      window.addEventListener('contextmenu', this.handlePolygonContextMenu, true)
    },

    stopPolygonKeyboardCapture() {
      this.isPolygonSelecting = false
      this.polygonFinishRequested = false
      this.polygonCloseRequested = false
      window.removeEventListener('keydown', this.handlePolygonKeyDown, true)
      window.removeEventListener('mousedown', this.handlePolygonRightMouseDown, true)
      window.removeEventListener('contextmenu', this.handlePolygonContextMenu, true)
      this.currentCommand = ''
    },

    handlePolygonKeyDown(event) {
      if (!this.isPolygonSelecting) return
      const key = String(event.key || '').toLowerCase()
      if (key !== 'f' && key !== 'enter') return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      const keyCode = key === 'enter' ? 13 : key.toUpperCase().charCodeAt(0)
      if (key === 'f' || key === 'enter') {
        this.polygonFinishRequested = true
      }
      try {
        const uiData = MxFun.getUIData && MxFun.getUIData()
        if (uiData && uiData.executeOperations) {
          // 结束当前取点命令，由已记录顶点完成多边形。
          uiData.executeOperations(2)
          return
        }
      } catch (error) {
        console.warn('处理多边形快捷键失败:', error)
      }
      MxFun.sendStringToExecute(keyCode === 13 ? 'F' : key.toUpperCase())
    },

    handlePolygonRightMouseDown(event) {
      if (!this.isPolygonSelecting) return
      if (event.button !== 2) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      // 鼠标右键等同于“完成(F)”，多边形默认即为闭合
      this.polygonFinishRequested = true
      try {
        const uiData = MxFun.getUIData && MxFun.getUIData()
        if (uiData && uiData.executeOperations) {
          // 结束当前取点命令，由已记录顶点完成多边形。
          uiData.executeOperations(2)
          return
        }
      } catch (error) {
        console.warn('处理多边形右键完成失败:', error)
      }
      MxFun.sendStringToExecute('F')
    },

    handlePolygonContextMenu(event) {
      if (!this.isPolygonSelecting) return
      // 圈选过程中屏蔽浏览器默认右键菜单，右键仅用于“完成”
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    },

    normalizePolygonBounds(polygon) {
      const points = polygon.filter(isPointValid)
      if (points.length < 3) {
        throw new Error('工作面多边形至少需要 3 个点')
      }
      const xs = points.map(item => Number(item.x))
      const ys = points.map(item => Number(item.y))
      return {
        minX: Math.min.apply(null, xs),
        maxX: Math.max.apply(null, xs),
        minY: Math.min.apply(null, ys),
        maxY: Math.max.apply(null, ys)
      }
    },

    closeWorkFaceDialog() {
      if (!this.isCoordinatePicking) {
        this.removePolygonReference()
        this.clearWorkFaceEndpointPreview()
      }
      this.workFaceDialogVisible = false
      this.editingWorkFace = null
    },

    async openSectionDialog() {
      await this.startAreaSelection('section')
    },

    // 顶部只有一个「新增」，按当前标签页分发到对应的新增流程
    openActiveConfigDialog() {
      if (this.activeConfigTab === 'section') {
        this.openSectionDialog()
      } else {
        this.openWorkFaceDialog()
      }
    },

    openSectionConfig(item) {
      if (!item) return
      // 打开配置弹窗前退出顶点编辑态，避免确认重绘后把手残留 / 边界引用失效
      this.exitVertexEdit()
      this.editingSection = item
      this.sectionDialogVisible = true
    },

    closeSectionDialog() {
      if (!this.isCoordinatePicking) {
        this.removePolygonReference()
      }
      this.sectionDialogVisible = false
      this.editingSection = null
    },

    onSaveWorkFace(value) {
      this.removePolygonReference()
      const index = this.workFaces.findIndex(face => face.id === value.id)
      const previous = index > -1 ? this.workFaces[index] : null
      const item = {
        ...value,
        ...this.resolveWorkFaceGeometry(value, previous),
        kind: 'workface',
        entityIds: []
      }
      if (previous) {
        this.eraseConfigurationEntities(previous)
        this.$set(this.workFaces, index, item)
      } else {
        this.workFaces.push(item)
      }
      this.renderWorkFace(item)
      this.renderWorkFaceDailyImages()
      this.closeWorkFaceDialog()
      this.$Message.success('工作面已绘制')
    },

    // 四个端点有变化（或新建）时按四点重算多边形/包围盒/中心点；端点没动就沿用原多边形——
    // 顶点拖拽能把多边形改成任意边数，不能因为只改了名称或线色就被四点的四边形覆盖掉
    resolveWorkFaceGeometry(value, previous) {
      const moved = !previous ||
        WORK_FACE_ENDPOINTS.some(key => !isSamePoint(previous[key], value[key]))
      if (!moved && Array.isArray(previous.polygon) && previous.polygon.length >= 3) {
        return {
          polygon: previous.polygon,
          bounds: previous.bounds,
          range: previous.range
        }
      }
      const polygon = buildWorkFacePolygon(
        value.headStart,
        value.headEnd,
        value.tailStart,
        value.tailEnd
      )
      const bounds = this.normalizePolygonBounds(polygon)
      return {
        polygon,
        bounds,
        range: {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2
        }
      }
    },

    onSaveSection(value) {
      this.removePolygonReference()
      const item = {
        ...value,
        kind: 'section',
        entityIds: []
      }
      const index = this.sections.findIndex(section => section.id === item.id)
      if (index > -1) {
        this.eraseConfigurationEntities(this.sections[index])
        this.$set(this.sections, index, item)
      } else {
        this.sections.push(item)
      }
      this.renderSection(item)
      this.closeSectionDialog()
      this.$Message.success('断面已绘制')
    },

    async onPickCoordinate(context) {
      if (!this.mxcad) {
        this.$Message.warning('图纸尚未加载完成')
        return
      }

      this.isCoordinatePicking = true
      this.coordinatePickContext = context
      try {
        if (context.dialog === 'workface') {
          this.workFaceDialogVisible = false
        } else {
          this.sectionDialogVisible = false
        }

        await this.$nextTick()
        let selectedPoint = null
        const getPoint = new MxCADUiPrPoint()
        getPoint.setMessage('\n请选择坐标点:')
        selectedPoint = await getPoint.go()
        if (!selectedPoint) {
          this.reopenCoordinateDialog(context)
          return
        }

        this.reopenCoordinateDialog(context)
        await this.$nextTick()
        const dialogRef = context.dialog === 'workface'
          ? this.$refs.workFaceDialog
          : this.$refs.sectionDialog
        if (dialogRef && dialogRef.fillCoordinate) {
          dialogRef.fillCoordinate(
            context.field,
            Number(selectedPoint.x),
            Number(selectedPoint.y)
          )
        }
        // 新建的工作面还没画到图纸上，选完点立刻预览，让用户看到四个点选在了哪里；
        // 编辑已存在的工作面时图纸上本来就有端点和名称，不重复画
        if (context.dialog === 'workface' && !this.workFaceExists &&
          dialogRef && dialogRef.getPreviewPayload) {
          this.renderWorkFaceEndpointPreview(dialogRef.getPreviewPayload())
        }
      } catch (error) {
        console.warn('选择坐标失败:', error)
        this.reopenCoordinateDialog(context)
      } finally {
        this.isCoordinatePicking = false
        this.coordinatePickContext = null
      }
    },

    reopenCoordinateDialog(context) {
      if (context.dialog === 'workface') {
        this.workFaceDialogVisible = true
      } else {
        this.sectionDialogVisible = true
      }
    },

    // —— 配置表格：分页 ——
    // 表格只吃轻量视图对象：iview Table 内部会深拷贝 data，直接传工作面/断面实体
    //（含 CAD ObjectId、标签实体引用）既浪费又会被复制出无意义的副本。
    paginateConfigs(list, page) {
      const start = (page - 1) * this.configPageSize
      return list.slice(start, start + this.configPageSize).map((item, index) => ({
        id: item.id,
        seq: start + index + 1,
        name: item.name || '',
        code: item.code || ''
      }))
    },

    onWorkFacePageChange(page) {
      this.workFacePage = page
    },

    onSectionPageChange(page) {
      this.sectionPage = page
    },

    // 删除后当前页可能已越界，回退到最后一页
    clampConfigPages() {
      const maxWorkFacePage = Math.max(1, Math.ceil(this.workFaces.length / this.configPageSize))
      if (this.workFacePage > maxWorkFacePage) this.workFacePage = maxWorkFacePage
      const maxSectionPage = Math.max(1, Math.ceil(this.sections.length / this.configPageSize))
      if (this.sectionPage > maxSectionPage) this.sectionPage = maxSectionPage
    },

    findWorkFaceById(id) {
      return this.workFaces.find(face => face.id === id) || null
    },

    findSectionById(id) {
      return this.sections.find(section => section.id === id) || null
    },

    // 表格「操作」列：定位 / 编辑顶点 / 编辑 / 删除
    renderConfigRowActions(h, kind, row) {
      const isWorkFace = kind === 'workface'
      const item = isWorkFace ? this.findWorkFaceById(row.id) : this.findSectionById(row.id)
      if (!item) return h('div', { class: 'row-actions' })
      const label = isWorkFace ? '工作面' : '断面'
      const editing = this.activeVertexEditId === item.id
      const iconButton = (icon, title, active, onClick) => h(
        'button',
        {
          class: ['row-action', { active }],
          attrs: { type: 'button', title },
          on: { click: onClick }
        },
        [h('i', { class: `ivu-icon ivu-icon-${icon}` })]
      )
      // 双击行会定位，但双击操作按钮时不该连带触发定位
      return h('div', {
        class: 'row-actions',
        on: { dblclick: event => event.stopPropagation() }
      }, [
        h('button', {
          class: 'row-action-text',
          attrs: { type: 'button' },
          on: { click: () => (isWorkFace ? this.openWorkFaceConfig(item) : this.openSectionConfig(item)) }
        }, '编辑'),
        h('button', {
          class: ['row-action-text', 'danger'],
          attrs: { type: 'button' },
          on: { click: () => (isWorkFace ? this.removeWorkFace(item) : this.removeSection(item)) }
        }, '删除')
      ])
    },

    // 表格行高亮：正在顶点编辑的那一行
    configRowClassName(row) {
      return this.activeVertexEditId && row.id === this.activeVertexEditId
        ? 'config-row-active'
        : ''
    },

    // 双击表格行定位。事件带回的是表格自己的视图对象副本，按 id 回查真实工作面/断面
    onConfigRowDblClick(row) {
      const isWorkFace = this.activeConfigTab === 'workface'
      const item = isWorkFace ? this.findWorkFaceById(row.id) : this.findSectionById(row.id)
      if (!item) return
      this.zoomToConfiguration(item, isWorkFace ? 'workface' : 'section')
    },

    removeWorkFace(item, onRemoved) {
      if (!item) return
      this.$Modal.confirm({
        title: '删除确认',
        content: `确定删除工作面「${item.name}」吗？`,
        onOk: () => {
          const index = this.workFaces.findIndex(face => face.id === item.id)
          if (index < 0) return
          // 若正在编辑该对象，先退出编辑态移除顶点把手，避免把手泄漏
          if (this.activeVertexEditId === item.id) this.exitVertexEdit()
          const target = this.workFaces[index]
          // 日期区块实体单独挂在工作面上，eraseConfigurationEntities 不会清理
          this.eraseDailyImages(target)
          this.eraseConfigurationEntities(target)
          this.workFaces.splice(index, 1)
          this.clampConfigPages()
          if (this.mxcad && this.mxcad.updateDisplay) this.mxcad.updateDisplay(true)
          this.$Message.success('工作面已删除')
          if (onRemoved) onRemoved()
        }
      })
    },

    // 弹窗内「删除」：只能删已存在的面，删除成功后关闭弹窗
    removeEditingWorkFace() {
      const item = this.editingWorkFace
      if (!item || !this.workFaces.some(face => face.id === item.id)) return
      this.removeWorkFace(item, () => this.closeWorkFaceDialog())
    },

    removeSection(item) {
      if (!item) return
      this.$Modal.confirm({
        title: '删除确认',
        content: `确定删除断面「${item.name}」吗？`,
        onOk: () => {
          const index = this.sections.findIndex(section => section.id === item.id)
          if (index < 0) return
          if (this.activeVertexEditId === item.id) this.exitVertexEdit()
          this.eraseConfigurationEntities(this.sections[index])
          this.sections.splice(index, 1)
          this.clampConfigPages()
          if (this.mxcad && this.mxcad.updateDisplay) this.mxcad.updateDisplay(true)
          this.$Message.success('断面已删除')
        }
      })
    },

    getConfigurationBounds(item, kind) {
      const hasWorkFacePolygon = Array.isArray(item.polygon) && item.polygon.length >= 3
      if (kind === 'workface' && (isWorkFaceGeometryValid(item) || hasWorkFacePolygon)) {
        const pointItems = [
          item.headStart,
          item.headEnd,
          item.tailStart,
          item.tailEnd,
          item.range
        ].filter(isPointValid)
        if (item.bounds) {
          pointItems.push(
            point(item.bounds.minX, item.bounds.minY),
            point(item.bounds.maxX, item.bounds.maxY)
          )
        }
        if (Array.isArray(item.polygon)) {
          item.polygon.forEach(polygonPoint => {
            if (isPointValid(polygonPoint)) pointItems.push(polygonPoint)
          })
        }
        const xs = pointItems.map(pointItem => Number(pointItem.x))
        const ys = pointItems.map(pointItem => Number(pointItem.y))
        return {
          minX: Math.min.apply(null, xs),
          maxX: Math.max.apply(null, xs),
          minY: Math.min.apply(null, ys),
          maxY: Math.max.apply(null, ys)
        }
      }

      const line = kind === 'section' ? this.getSectionLine(item) : null
      if (line) {
        return {
          minX: Math.min(line.start.x, line.end.x, item.range.x),
          maxX: Math.max(line.start.x, line.end.x, item.range.x),
          minY: Math.min(line.start.y, line.end.y, item.range.y),
          maxY: Math.max(line.start.y, line.end.y, item.range.y)
        }
      }

      const offset = 500
      return {
        minX: item.range.x - offset,
        maxX: item.range.x + offset,
        minY: item.range.y - offset,
        maxY: item.range.y + offset
      }
    },

    zoomToConfiguration(item, kind) {
      if (!this.mxcad || !this.mxcad.zoomW) return
      const bounds = this.getConfigurationBounds(item, kind)
      const padding = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 20) * 0.25
      this.mxcad.zoomW(
        new McGePoint3d(bounds.minX - padding, bounds.minY - padding, 0),
        new McGePoint3d(bounds.maxX + padding, bounds.maxY + padding, 0)
      )
    },

    getCanvasDocPoint(event) {
      const canvas = document.getElementById('mxcad')
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const viewBounds = this.getViewDocBounds()
      if (viewBounds) {
        const x = viewBounds.minX +
          ((event.clientX - rect.left) / rect.width) *
          (viewBounds.maxX - viewBounds.minX)
        const y = viewBounds.maxY -
          ((event.clientY - rect.top) / rect.height) *
          (viewBounds.maxY - viewBounds.minY)
        return point(x, y)
      }
      const mxObj = MxFun.getCurrentDraw()
      const camera = mxObj && mxObj.getCamera ? mxObj.getCamera() : null
      if (!mxObj || !camera || !mxObj.worldCoord2Doc) return null
      const ndcPoint = new THREE.Vector3(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
        0.5
      )
      camera.updateMatrixWorld && camera.updateMatrixWorld()
      ndcPoint.unproject(camera)
      const docPoint = mxObj.worldCoord2Doc(ndcPoint.x, ndcPoint.y, ndcPoint.z)
      return docPoint ? point(docPoint.x, docPoint.y) : null
    },

    getViewDocBounds() {
      if (!this.mxcad || !this.mxcad.getViewCADCoord) return null
      try {
        const view = this.mxcad.getViewCADCoord()
        const points = view
          ? [view.pt1, view.pt2, view.pt3, view.pt4].filter(isPointValid)
          : []
        if (points.length < 2) return null
        const xs = points.map(item => Number(item.x))
        const ys = points.map(item => Number(item.y))
        const minX = Math.min.apply(null, xs)
        const maxX = Math.max.apply(null, xs)
        const minY = Math.min.apply(null, ys)
        const maxY = Math.max.apply(null, ys)
        if (maxX <= minX || maxY <= minY) return null
        return { minX, maxX, minY, maxY }
      } catch (error) {
        return null
      }
    },

    projectDocPointToCanvas(docPoint) {
      if (!isPointValid(docPoint)) return null
      const canvas = document.getElementById('mxcad')
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const viewBounds = this.getViewDocBounds()
      if (viewBounds) {
        return {
          x: ((Number(docPoint.x) - viewBounds.minX) /
            (viewBounds.maxX - viewBounds.minX)) * rect.width,
          y: ((viewBounds.maxY - Number(docPoint.y)) /
            (viewBounds.maxY - viewBounds.minY)) * rect.height
        }
      }
      const camera = this.mxDraw && this.mxDraw.getCamera
        ? this.mxDraw.getCamera()
        : null
      if (!camera) return null
      try {
        const worldPoint = MxFun.docCoord2World(
          Number(docPoint.x),
          Number(docPoint.y),
          0
        )
        if (!worldPoint) return null
        camera.updateMatrixWorld && camera.updateMatrixWorld()
        const projected = worldPoint.clone().project(camera)
        return {
          x: (projected.x + 1) * rect.width / 2,
          y: (-projected.y + 1) * rect.height / 2
        }
      } catch (error) {
        return null
      }
    },

    findEditableVertex(event) {
      // 仅在顶点编辑态下命中，且只查找当前处于编辑态的工作面/断面
      if (!this.activeVertexEditId) return null
      const kind = this.activeVertexEditKind
      const source = kind === 'section' ? this.sections : this.workFaces
      const item = source.find(entry => entry.id === this.activeVertexEditId)
      if (!item || !Array.isArray(item.polygon)) return null
      const canvas = document.getElementById('mxcad')
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const mousePoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      for (let vertexIndex = 0; vertexIndex < item.polygon.length; vertexIndex++) {
        const screenPoint = this.projectDocPointToCanvas(item.polygon[vertexIndex])
        if (screenPoint &&
          Math.hypot(screenPoint.x - mousePoint.x, screenPoint.y - mousePoint.y) <= 14) {
          return { face: item, vertexIndex, kind }
        }
      }
      return null
    },

    handleEditVertexMouseDown(event) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey) return
      if (this.isPolygonSelecting || this.isCoordinatePicking) return
      if (!this.activeVertexEditId) return
      const hit = this.findEditableVertex(event)
      if (!hit) {
        // 编辑态下点击空白处：退出编辑，并消费该次点击（避免同时触发平移/拾取）
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        this.exitVertexEdit()
        return
      }
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.activeVertexDrag = hit
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = 'move'
    },

    handleEditVertexMouseMove(event) {
      if (!this.activeVertexDrag) return
      const docPoint = this.getCanvasDocPoint(event)
      if (!docPoint) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.updateDraftVertex(
        this.activeVertexDrag.face,
        this.activeVertexDrag.vertexIndex,
        docPoint.x,
        docPoint.y
      )
    },

    handleEditVertexMouseUp(event) {
      if (!this.activeVertexDrag) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      const dragged = this.activeVertexDrag
      this.activeVertexDrag = null
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = ''
      const item = dragged.face
      if (!item) return
      if (dragged.kind === 'section') {
        // 松手后按最新 polygon 整体重绘该断面（兜底修正边界/名称标签）
        if (Array.isArray(item.polygon) && item.polygon.length >= 3) {
          this.renderSection(item)
        }
      } else {
        // 松手后按最新 polygon 整体重绘该工作面：兜底修正填充/边界/名称标签，
        // 并重绘依赖 polygon 的日期区域（仅该面，避免打乱其它面的随机区块）
        if (Array.isArray(item.polygon) && item.polygon.length >= 3) {
          this.renderWorkFace(item)
        }
        this.renderWorkFaceDailyImages(item)
      }
      if (this.mxcad && this.mxcad.updateDisplay) this.mxcad.updateDisplay(true)
    },

    handleVertexEditKeyDown(event) {
      if (!this.activeVertexEditId) return
      if (event.key === 'Escape' || event.keyCode === 27) {
        this.exitVertexEdit()
      }
    },

    handleConfigLabelClick(event) {
      const canvas = document.getElementById('mxcad')
      if (!canvas) return
      if (event.button !== 0 || event.ctrlKey || event.metaKey) return
      if (this.isPolygonSelecting || this.isCoordinatePicking || this.activeVertexDrag || this.activeVertexEditId) return

      try {
        const rect = canvas.getBoundingClientRect()
        const mousePoint = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
        const candidates = []

        this.workFaces.forEach(item => {
          const anchor = this.getWorkFaceLabelDocPoint(item)
          const screenPoint = this.projectDocPointToCanvas(anchor)
          if (screenPoint) {
            candidates.push({
              item,
              kind: 'workface',
              distance: Math.hypot(
                screenPoint.x - mousePoint.x,
                screenPoint.y - mousePoint.y
              )
            })
          }
        })

        this.sections.forEach(item => {
          const anchor = this.getSectionLabelDocPoint(item)
          const screenPoint = this.projectDocPointToCanvas(anchor)
          if (screenPoint) {
            candidates.push({
              item,
              kind: 'section',
              distance: Math.hypot(
                screenPoint.x - mousePoint.x,
                screenPoint.y - mousePoint.y
              )
            })
          }
        })

        const target = candidates
          .filter(candidate => candidate.distance <= 24)
          .sort((a, b) => a.distance - b.distance)[0]
        if (!target) return

        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        if (target.kind === 'workface') {
          this.openWorkFaceConfig(target.item)
        } else {
          this.openSectionConfig(target.item)
        }
      } catch (error) {
        console.warn('标签点击处理异常:', error)
      }
    },




    findNearestLabel(docPoint) {
      let best = null
      let bestDist = Infinity
      this.workFaces.forEach(item => {
        const anchor = this.getWorkFaceLabelDocPoint(item)
        if (!isPointValid(anchor)) return
        const dx = Number(docPoint.x) - Number(anchor.x)
        const dy = Number(docPoint.y) - Number(anchor.y)
        const dist = Math.hypot(dx, dy)
        if (dist <= LABEL_HIT_RADIUS && dist < bestDist) {
          bestDist = dist
          best = { kind: 'workface', item }
        }
      })
      this.sections.forEach(item => {
        const anchor = this.getSectionLabelDocPoint(item)
        if (!isPointValid(anchor)) return
        const dx = Number(docPoint.x) - Number(anchor.x)
        const dy = Number(docPoint.y) - Number(anchor.y)
        const dist = Math.hypot(dx, dy)
        if (dist <= LABEL_HIT_RADIUS && dist < bestDist) {
          bestDist = dist
          best = { kind: 'section', item }
        }
      })
      return best
    },

    updateDraftVertex(face, vertexIndex, x, y) {
      if (!face || !Array.isArray(face.polygon) || !face.polygon[vertexIndex]) return
      face.polygon[vertexIndex] = point(x, y)
      const bounds = this.normalizePolygonBounds(face.polygon)
      this.$set(face, 'bounds', bounds)
      this.$set(face, 'range', {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
      })
      if (this.activeVertexEditKind === 'section' || face.kind === 'section') {
        this.refreshSectionLabelEntity(face)
      } else {
        this.refreshWorkFaceLabelEntity(face)
      }

      try {
        const boundaryEntity = face.draftBoundaryId &&
          face.draftBoundaryId.getMcDbEntity
          ? face.draftBoundaryId.getMcDbEntity()
          : null
        if (boundaryEntity && boundaryEntity.setPointAt) {
          boundaryEntity.setPointAt(
            vertexIndex,
            new McGePoint3d(x, y, 0)
          )
        }

        const vertexEntity = face.draftVertexIds &&
          face.draftVertexIds[vertexIndex] &&
          face.draftVertexIds[vertexIndex].getMcDbEntity
          ? face.draftVertexIds[vertexIndex].getMcDbEntity()
          : null
        if (vertexEntity) {
          vertexEntity.center = new McGePoint3d(x, y, 0)
        }

        // 同步填充（hatch）外轮廓，避免拖拽时只有边界线移动、填充停留在原位
        const hatchEntity = face.draftHatchId &&
          face.draftHatchId.getMcDbEntity
          ? face.draftHatchId.getMcDbEntity()
          : null
        if (hatchEntity && hatchEntity.setLoopAt) {
          const loopPoints = face.polygon
            .filter(isPointValid)
            .map(item => new McGePoint3d(item.x, item.y, 0))
          if (loopPoints.length >= 3) {
            hatchEntity.setLoopAt(
              0,
              new McGePoint3dArray(loopPoints),
              [],
              McDb.HatchLoopType.kPolyline
            )
          }
        }

      } catch (error) {
        console.warn('更新圈选顶点失败:', error)
      }
      if (this.mxcad && this.mxcad.updateDisplay) {
        this.mxcad.updateDisplay(true)
      }
    },

    // —— 顶点编辑态：进入后显示可拖拽的顶点把手，退出后移除把手（工作面/断面通用） ——
    enterVertexEdit(item, kind = 'workface') {
      if (!this.mxcad || !item) return
      const isSection = kind === 'section'
      const label = isSection ? '断面' : '工作面'
      const layerName = isSection ? SECTION_LAYER : WORK_FACE_LAYER
      if (!Array.isArray(item.polygon) || item.polygon.length < 3) {
        this.$Message.warning(`该${label}没有可编辑的多边形区域`)
        return
      }
      this.exitVertexEdit()
      this.activeVertexEditId = item.id
      this.activeVertexEditKind = kind
      try {
        this.ensureLayer(layerName)
        // 注意：不能过滤空值，需与 polygon 下标严格对应（updateDraftVertex 按索引更新把手）
        const vertexIds = item.polygon.map(vertex => {
          if (!isPointValid(vertex)) return null
          const handle = new McDbCircle(
            Number(vertex.x),
            Number(vertex.y),
            0,
            FIXED_MARKER_RADIUS
          )
          handle.layer = layerName
          handle.trueColor = new McCmColor(255, 255, 255)
          handle.lineweight = McDb.LineWeight.kLnWt025
          const objectId = this.mxcad.drawEntity(handle)
          return objectId && objectId.isValid && objectId.isValid() ? objectId : null
        })
        this.$set(item, 'draftVertexIds', vertexIds)
      } catch (error) {
        console.warn('绘制顶点把手失败:', error)
      }
      if (this.mxcad.updateDisplay) this.mxcad.updateDisplay(true)
    },

    exitVertexEdit() {
      if (!this.activeVertexEditId) return
      const item = this.workFaces.find(face => face.id === this.activeVertexEditId) ||
        this.sections.find(section => section.id === this.activeVertexEditId)
      if (item && Array.isArray(item.draftVertexIds)) {
        item.draftVertexIds.forEach(objectId => {
          try {
            if (objectId && objectId.isValid && objectId.isValid()) {
              objectId.erase()
            }
          } catch (error) {
            console.warn('移除顶点把手失败:', error)
          }
        })
        this.$set(item, 'draftVertexIds', [])
      }
      this.activeVertexDrag = null
      this.activeVertexEditId = null
      this.activeVertexEditKind = ''
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = ''
      if (this.mxcad && this.mxcad.updateDisplay) this.mxcad.updateDisplay(true)
    },

    toggleVertexEdit(item, kind = 'workface') {
      if (!item) return
      if (this.activeVertexEditId === item.id) {
        this.exitVertexEdit()
      } else {
        this.enterVertexEdit(item, kind)
      }
    },

    initCtrlPan() {
  const canvas = document.getElementById('mxcad')
  if (!canvas) return
  // 标签点击处理器放在第一位，优先执行
  canvas.addEventListener('mousedown', this.handleConfigLabelClick, true)

  canvas.addEventListener('mousedown', this.handleEditVertexMouseDown, true)
  // mousemove / mouseup 挂在 window 上：拖拽顶点时鼠标移出画布也能继续跟随、正常结束，
  // 否则在画布外松手会导致拖拽状态卡住。处理器内部以 activeVertexDrag 做守卫，非拖拽时直接返回。
  window.addEventListener('mousemove', this.handleEditVertexMouseMove, true)
  window.addEventListener('mouseup', this.handleEditVertexMouseUp, true)

  canvas.addEventListener('mousedown', this.handleCtrlPanMouseDown, true)
  canvas.addEventListener('mousemove', this.handleCtrlPanMouseMove, true)
  canvas.addEventListener('mouseup', this.handleCtrlPanMouseUp, true)
  canvas.addEventListener('mouseleave', this.handleCtrlPanMouseUp, true)

  window.addEventListener('keydown', this.handleVertexEditKeyDown, true)
},

    destroyCtrlPan() {
  const canvas = document.getElementById('mxcad')
  if (!canvas) return
  canvas.removeEventListener('mousedown', this.handleConfigLabelClick, true)

  canvas.removeEventListener('mousedown', this.handleEditVertexMouseDown, true)
  window.removeEventListener('mousemove', this.handleEditVertexMouseMove, true)
  window.removeEventListener('mouseup', this.handleEditVertexMouseUp, true)

  canvas.removeEventListener('mousedown', this.handleCtrlPanMouseDown, true)
  canvas.removeEventListener('mousemove', this.handleCtrlPanMouseMove, true)
  canvas.removeEventListener('mouseup', this.handleCtrlPanMouseUp, true)
  canvas.removeEventListener('mouseleave', this.handleCtrlPanMouseUp, true)

  window.removeEventListener('keydown', this.handleVertexEditKeyDown, true)
},

    simulateMouseButtonEvent(event, type, button = 1) {
      const buttons = type === 'mouseup'
        ? 0
        : (button === 1 ? 4 : 1)
      const simulatedEvent = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 1,
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        button,
        buttons,
        relatedTarget: event.relatedTarget
      })
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.dispatchEvent(simulatedEvent)
    },

    replayLeftClick(event) {
      if (!event) return
      this.isReplayingCanvasEvent = true
      this.simulateMouseButtonEvent(event, 'mousedown', 0)
      this.simulateMouseButtonEvent(event, 'mouseup', 0)
      requestAnimationFrame(() => {
        this.isReplayingCanvasEvent = false
      })
    },

    handleCtrlPanMouseDown(event) {
      if (this.isReplayingCanvasEvent || this.activeVertexDrag) return
      if (event.button !== 0) return
      const isPickingGeometryPoint = this.isPolygonSelecting || this.isCoordinatePicking
      if (isPickingGeometryPoint) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        this.pointerGesture = {
          startX: event.clientX,
          startY: event.clientY,
          event,
          moved: false
        }
        return
      }
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.isPanningByCtrl = true
      this.simulateMouseButtonEvent(event, 'mousedown', 1)
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = 'grabbing'
    },

    handleCtrlPanMouseMove(event) {
      if (this.isReplayingCanvasEvent) return
      if (this.pointerGesture && event.buttons === 1) {
        const dx = event.clientX - this.pointerGesture.startX
        const dy = event.clientY - this.pointerGesture.startY
        if (!this.pointerGesture.moved && Math.hypot(dx, dy) > 4) {
          this.pointerGesture.moved = true
          this.isPanningByCtrl = true
          this.simulateMouseButtonEvent(this.pointerGesture.event, 'mousedown', 1)
          const canvas = document.getElementById('mxcad')
          if (canvas) canvas.style.cursor = 'grabbing'
        }
        if (this.pointerGesture.moved) {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          this.simulateMouseButtonEvent(event, 'mousemove', 1)
        }
        return
      }
      if (!this.isPanningByCtrl || event.buttons !== 1) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.simulateMouseButtonEvent(event, 'mousemove', 1)
    },

    handleCtrlPanMouseUp(event) {
      if (this.isReplayingCanvasEvent || event.button !== 0) return
      if (this.pointerGesture) {
        const gesture = this.pointerGesture
        this.pointerGesture = null
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        if (gesture.moved) {
          this.simulateMouseButtonEvent(event, 'mouseup', 1)
        } else {
          this.replayLeftClick(gesture.event)
        }
        this.isPanningByCtrl = false
        const canvas = document.getElementById('mxcad')
        if (canvas) canvas.style.cursor = ''
        return
      }
      if (!this.isPanningByCtrl) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.isPanningByCtrl = false
      this.simulateMouseButtonEvent(event, 'mouseup', 1)
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = ''
    }
  }
}
