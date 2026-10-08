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
  MxCADUiPrPoint
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

// —— 固定绘制参数：工作面/断面的线宽与文字大小固定，不随绘制区域大小变化 ——
const FIXED_LINE_WIDTH = 2        // 工作面边界线 / 断面剖切线的线宽
const FIXED_LIGHT_LINE_WIDTH = 1  // 辅助区域（选中框、预警区等）线宽
const FIXED_TEXT_HEIGHT = 12      // 名称文字高度
const FIXED_MARKER_RADIUS = 4     // 端点 / 中心标记圆半径
const FIXED_ARROW_SIZE = 40       // 方向箭头长度
const FIXED_LABEL_SIZE = 60       // 工作面名称标签（SVG）固定尺寸
const LABEL_HIT_RADIUS = FIXED_LABEL_SIZE * 1.5  // 点击工作面标签/文字时的命中半径（doc 单位，可调）

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
      selectedWorkFaceIds: [],
      selectedSectionIds: [],
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
      isCoordinatePicking: false,
      isPanningByCtrl: false,
      pointerGesture: null,
      isReplayingCanvasEvent: false,
      activeVertexDrag: null,
      fileLoadTimer: null
    }
  },
  computed: {
    workFaceAllSelected() {
      return this.workFaces.length > 0 &&
        this.selectedWorkFaceIds.length === this.workFaces.length
    },
    workFaceIndeterminate() {
      return this.selectedWorkFaceIds.length > 0 &&
        this.selectedWorkFaceIds.length < this.workFaces.length
    },
    sectionAllSelected() {
      return this.sections.length > 0 &&
        this.selectedSectionIds.length === this.sections.length
    },
    sectionIndeterminate() {
      return this.selectedSectionIds.length > 0 &&
        this.selectedSectionIds.length < this.sections.length
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
    "workFaceId": "workface-1790666321742",
    "warningDistance": 50,
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
          workFaceId: face.id,
          warningDistance: 50,
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

    renderWorkFace(face) {
      if (!this.mxcad || !isWorkFaceGeometryValid(face)) return
      this.eraseConfigurationEntities(face)
      face.kind = 'workface'
      this.createWorkFaceLabelAnchor(face, face.range)

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

      const labelSize = MxFun.docCoordLong2World(FIXED_LABEL_SIZE)
      const textHeight = labelSize * 0.22

      const svg = new MxDbSVG()
      svg.setSvgPath('models/svg/target.svg')
      svg.useSvgColor = true
      svg.setColor(0x164bd8)
      svg.setSvgPostion(worldPoint)
      svg.setSvgSize(new THREE.Vector2(labelSize, 0))
      svg.setSvgAlignmentRatio(new THREE.Vector2(0.5, 1))
      svg.setRenderOrder(MxType.MxDefaultRenderOrder.kMxEntityRenderOrder + 2)
      svg.userData = { workfaceId: face.id, workfaceLabel: true }

      const text = new MxDbSVGText()
      text.txt = face.name || face.code || '工作面'
      text.txtPos = new THREE.Vector3(
        worldPoint.x,
        worldPoint.y + labelSize * 0.34,
        worldPoint.z || 0
      )
      text.txtHeight = textHeight
      text.color = 0xffffff
      text.fontStyle = 'bold'
      svg.addText(text)

      const entityId = mxObj.addMxEntity(svg)
      this.$set(face, 'labelEntityId', entityId)
      this.$set(face, 'labelEntity', svg)
    },

    refreshWorkFaceLabelEntity(face) {
      if (!face) return
      const docPoint = this.getWorkFaceLabelDocPoint(face)
      if (face.labelEntityId) {
        const mxObj = MxFun.getCurrentDraw()
        if (mxObj && mxObj.eraseMxEntity) {
          mxObj.eraseMxEntity(face.labelEntityId)
        }
        this.$set(face, 'labelEntityId', null)
      }
      this.createWorkFaceLabelAnchor(face, docPoint)
    },

    getSectionLine(section) {
      const face = this.workFaces.find(item => item.id === section.workFaceId)
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
      this.eraseConfigurationEntities(section)
      section.kind = 'section'

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
          McDb.LineWeight.kLnWt050
        )
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

      this.drawTextEntity(
        section,
        point(markerCenter.x, markerCenter.y + textHeight * 1.3),
        section.name,
        textHeight,
        SECTION_LAYER,
        [213, 55, 55]
      )
    },

    renderSection1(section) {
      if (!this.mxcad || !isPointValid(section.range)) return
      this.eraseConfigurationEntities(section)
      section.kind = 'section'

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
        const warningDistance = Number(section.warningDistance) || 0
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

      this.drawTextEntity(
        section,
        point(markerCenter.x, markerCenter.y + textHeight * 1.3),
        section.name,
        textHeight,
        SECTION_LAYER,
        [213, 55, 55]
      )
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
      try {
        this.mxcad.updateDisplay(true)
      } catch (error) {
        console.warn('刷新 CAD 显示失败:', error)
      }
    },

    async openWorkFaceDialog() {
      await this.startAreaSelection('workface')
    },

    openWorkFaceConfig(item) {
      if (!item) return
      this.editingWorkFace = item
      this.workFaceDialogVisible = true
    },

    async startAreaSelection(kind) {
      if (!this.mxcad) {
        this.$Message.warning('图纸尚未加载完成')
        return
      }

      this.removePolygonReference()
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
            workFaceId: '',
            warningDistance: 50,
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
      }
      this.workFaceDialogVisible = false
      this.editingWorkFace = null
    },

    async openSectionDialog() {
      await this.startAreaSelection('section')
    },

    openSectionConfig(item) {
      if (!item) return
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
      const item = {
        ...value,
        kind: 'workface',
        entityIds: []
      }
      const index = this.workFaces.findIndex(face => face.id === item.id)
      if (index > -1) {
        this.eraseConfigurationEntities(this.workFaces[index])
        this.$set(this.workFaces, index, item)
      } else {
        this.workFaces.push(item)
      }
      console.log(JSON.stringify(item), 11111)
      this.renderWorkFace(item)
      this.closeWorkFaceDialog()
      this.$Message.success('工作面已绘制')
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

    toggleWorkFace(id) {
      const index = this.selectedWorkFaceIds.indexOf(id)
      if (index > -1) {
        this.selectedWorkFaceIds.splice(index, 1)
      } else {
        this.selectedWorkFaceIds.push(id)
      }
    },

    isWorkFaceSelected(id) {
      return this.selectedWorkFaceIds.indexOf(id) > -1
    },

    toggleAllWorkFaces(checked) {
      this.selectedWorkFaceIds = checked
        ? this.workFaces.map(item => item.id)
        : []
    },

    toggleSection(id) {
      const index = this.selectedSectionIds.indexOf(id)
      if (index > -1) {
        this.selectedSectionIds.splice(index, 1)
      } else {
        this.selectedSectionIds.push(id)
      }
    },

    isSectionSelected(id) {
      return this.selectedSectionIds.indexOf(id) > -1
    },

    toggleAllSections(checked) {
      this.selectedSectionIds = checked
        ? this.sections.map(item => item.id)
        : []
    },

    deleteSelectedConfigurations() {
      const isWorkFace = this.activeConfigTab === 'workface'
      const selectedIds = isWorkFace
        ? this.selectedWorkFaceIds.slice()
        : this.selectedSectionIds.slice()
      if (!selectedIds.length) {
        this.$Message.warning(isWorkFace ? '请先选择工作面' : '请先选择断面')
        return
      }

      const label = isWorkFace ? '工作面' : '断面'
      this.$Modal.confirm({
        title: '删除确认',
        content: `确定删除选中的 ${selectedIds.length} 个${label}图层吗？`,
        onOk: () => {
          const source = isWorkFace ? this.workFaces : this.sections
          for (let index = source.length - 1; index >= 0; index--) {
            if (selectedIds.indexOf(source[index].id) > -1) {
              this.eraseConfigurationEntities(source[index])
              source.splice(index, 1)
            }
          }
          if (isWorkFace) {
            this.selectedWorkFaceIds = []
          } else {
            this.selectedSectionIds = []
          }
          if (this.mxcad) this.mxcad.updateDisplay(true)
          this.$Message.success(`${label}图层已删除`)
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

    projectDocPointToCanvas(docPoint) {
      if (!isPointValid(docPoint)) return null
      const canvas = document.getElementById('mxcad')
      const camera = this.mxDraw && this.mxDraw.getCamera
        ? this.mxDraw.getCamera()
        : null
      if (!canvas || !camera) return null
      try {
        const rect = canvas.getBoundingClientRect()
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

    findDraftVertex(event) {
      const canvas = document.getElementById('mxcad')
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const mousePoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      for (let faceIndex = this.workFaces.length - 1; faceIndex >= 0; faceIndex--) {
        const face = this.workFaces[faceIndex]
        if (face.status !== 'draft' || !Array.isArray(face.polygon)) continue
        for (let vertexIndex = 0; vertexIndex < face.polygon.length; vertexIndex++) {
          const screenPoint = this.projectDocPointToCanvas(face.polygon[vertexIndex])
          if (screenPoint &&
            Math.hypot(screenPoint.x - mousePoint.x, screenPoint.y - mousePoint.y) <= 14) {
            return { face, vertexIndex }
          }
        }
      }
      for (let sectionIndex = this.sections.length - 1; sectionIndex >= 0; sectionIndex--) {
        const section = this.sections[sectionIndex]
        if (section.status !== 'draft' || !Array.isArray(section.polygon)) continue
        for (let vertexIndex = 0; vertexIndex < section.polygon.length; vertexIndex++) {
          const screenPoint = this.projectDocPointToCanvas(section.polygon[vertexIndex])
          if (screenPoint &&
            Math.hypot(screenPoint.x - mousePoint.x, screenPoint.y - mousePoint.y) <= 14) {
            return { face: section, vertexIndex, kind: 'section' }
          }
        }
      }
      return null
    },

    handleWorkFaceVertexMouseDown(event) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey) return
      if (this.isPolygonSelecting || this.isCoordinatePicking) return
      const hit = this.findDraftVertex(event)
      if (!hit) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.activeVertexDrag = hit
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = 'move'
    },

    handleWorkFaceVertexMouseMove(event) {
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

    handleWorkFaceVertexMouseUp(event) {
      if (!this.activeVertexDrag) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.activeVertexDrag = null
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = ''
    },

    handleWorkFaceLabelClick(event) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey) return
      if (this.isPolygonSelecting || this.isCoordinatePicking || this.activeVertexDrag) return
      try {
        const mxObj = MxFun.getCurrentDraw()
        if (!mxObj || !mxObj.findMxEntityAtPoint) return
        const docPoint = mxObj.screenCoord2Doc(event.offsetX, event.offsetY, 0)
        if (!docPoint) return

        // 1) 命中原生 SVG 标签实体（target 图标 + 名称文字所在实体）
        const entities = mxObj.findMxEntityAtPoint(docPoint) || []
        const labelEntity = entities.find(entity => {
          return entity &&
            entity.userData &&
            entity.userData.workfaceLabel &&
            entity.userData.workfaceId
        })
        let face = labelEntity
          ? this.workFaces.find(item => item.id === labelEntity.userData.workfaceId)
          : null

        // 2) 兜底：SVG 未命中时，按「点击点与工作面标签锚点的距离」命中文字/标签区域
        if (!face) {
          let nearest = null
          let nearestDist = Infinity
          for (const item of this.workFaces) {
            const anchor = this.getWorkFaceLabelDocPoint(item)
            if (!isPointValid(anchor)) continue
            const dx = Number(docPoint.x) - Number(anchor.x)
            const dy = Number(docPoint.y) - Number(anchor.y)
            const dist = Math.hypot(dx, dy)
            if (dist <= LABEL_HIT_RADIUS && dist < nearestDist) {
              nearestDist = dist
              nearest = item
            }
          }
          face = nearest
        }

        if (!face) return
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        this.openWorkFaceConfig(face)
      } catch (error) {
        console.warn('打开工作面配置失败:', error)
      }
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
      if (face.kind !== 'section') {
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

      } catch (error) {
        console.warn('更新圈选顶点失败:', error)
      }
      if (this.mxcad && this.mxcad.updateDisplay) {
        this.mxcad.updateDisplay(true)
      }
    },

    initCtrlPan() {
      const canvas = document.getElementById('mxcad')
      if (!canvas) return
      canvas.addEventListener('mousedown', this.handleWorkFaceVertexMouseDown, true)
      canvas.addEventListener('mousemove', this.handleWorkFaceVertexMouseMove, true)
      canvas.addEventListener('mouseup', this.handleWorkFaceVertexMouseUp, true)
      canvas.addEventListener('mousedown', this.handleWorkFaceLabelClick, true)
      canvas.addEventListener('mousedown', this.handleCtrlPanMouseDown, true)
      canvas.addEventListener('mousemove', this.handleCtrlPanMouseMove, true)
      canvas.addEventListener('mouseup', this.handleCtrlPanMouseUp, true)
      canvas.addEventListener('mouseleave', this.handleCtrlPanMouseUp, true)
    },

    destroyCtrlPan() {
      const canvas = document.getElementById('mxcad')
      if (!canvas) return
      canvas.removeEventListener('mousedown', this.handleWorkFaceVertexMouseDown, true)
      canvas.removeEventListener('mousemove', this.handleWorkFaceVertexMouseMove, true)
      canvas.removeEventListener('mouseup', this.handleWorkFaceVertexMouseUp, true)
      canvas.removeEventListener('mousedown', this.handleWorkFaceLabelClick, true)
      canvas.removeEventListener('mousedown', this.handleCtrlPanMouseDown, true)
      canvas.removeEventListener('mousemove', this.handleCtrlPanMouseMove, true)
      canvas.removeEventListener('mouseup', this.handleCtrlPanMouseUp, true)
      canvas.removeEventListener('mouseleave', this.handleCtrlPanMouseUp, true)
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
