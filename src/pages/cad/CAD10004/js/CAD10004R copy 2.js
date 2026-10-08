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
import { MxFun } from 'mxdraw'
import { RegistMxCommands, RxInitMxEntity } from '@/test/command'

const WORK_FACE_LAYER = 'MX_WORKFACE'
const SECTION_LAYER = 'MX_SECTION'
const WORK_FACE_COLOR = [13, 92, 224]
const WORK_FACE_FILL_COLOR = [218, 241, 250]
const WORK_FACE_LINE_RATIO = 0.008
const SECTION_COLOR = [231, 69, 69]
const SECTION_FILL_COLOR = [255, 231, 226]

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
      isDev: true
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
            {
    "id": "workface-1790666321742",
    "code": "12032",
    "name": "12032工作面",
    "range": {
        "x": 23373310.120284803,
        "y": -30388649.618931714
    },
    "headStart": {
        "x": 23373257.737748835,
        "y": -30388569.47066143
    },
    "headEnd": {
        "x": 23373392.933098655,
        "y": -30388564.32036239
    },
    "tailStart": {
        "x": 23373227.30747095,
        "y": -30388733.176554717
    },
    "tailEnd": {
        "x": 23373392.933098655,
        "y": -30388734.91750104
    },
    "bounds": {
        "minX": 23373227.30747095,
        "maxX": 23373392.933098655,
        "minY": -30388734.91750104,
        "maxY": -30388564.32036239
    },
    "polygon": [
        {
            "x": 23373257.737748835,
            "y": -30388569.47066143
        },
        {
            "x": 23373392.933098655,
            "y": -30388564.32036239
        },
        {
            "x": 23373392.933098655,
            "y": -30388734.91750104
        },
        {
            "x": 23373227.30747095,
            "y": -30388733.176554717
        }
    ]
}
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
          if (msg && msg.msCmdDisplay && msg.msCmdDisplay.length > 0) {
            this.currentCommand = msg.msCmdDisplay
          }
        })

        this.viewerReady = true
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
      this.loading = false
      this.$nextTick(() => {
        this.renderAllConfigurations()
      })
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
      if (!item || !Array.isArray(item.entityIds)) return
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
      this.drawCadEntity(
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
      const width = Math.max(distance(vertices[0], vertices[1]), 1)
      const height = Math.max(distance(vertices[0], vertices[3]), 1)
      const span = Math.max(width, height)
      const textHeight = Math.max(span * 0.055, 8)
      const markerRadius = Math.max(span * 0.018, 2)

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
      boundary.constantWidth = Math.max(span * WORK_FACE_LINE_RATIO, 1)
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
        new McGePoint3d(face.headStart.x, face.headStart.y, 0),
        new McGePoint3d(face.tailStart.x, face.tailStart.y, 0)
      )
      this.drawCadEntity(
        face,
        centerLine,
        WORK_FACE_LAYER,
        [89, 166, 231],
        McDb.LineWeight.kLnWt018
      )

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

      const headDirection = normalizeVector(face.headStart, face.tailStart)
      if (headDirection.length > 0) {
        this.drawDirectionArrow(
          face,
          point(face.range.x, face.range.y + textHeight * 1.35),
          headDirection,
          Math.max(span * 0.18, textHeight * 2),
          WORK_FACE_LAYER,
          [255, 0, 0]
        )
      }

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
      const width = Math.max(distance(vertices[0], vertices[1]), 1)
      const height = Math.max(distance(vertices[0], vertices[3]), 1)
      const span = Math.max(width, height)
      const textHeight = Math.max(span * 0.055, 8)
      const markerRadius = Math.max(span * 0.018, 2)

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
      boundary.constantWidth = Math.max(span * WORK_FACE_LINE_RATIO, 1)
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
          Math.max(span * 0.18, textHeight * 2),
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
      const span = geometry.span
      const lineWidth = Math.max(span * 0.01, 2)
      const markerRadius = Math.max(span * 0.025, 3)
      const textHeight = Math.max(span * 0.055, 8)

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
        selectionArea.constantWidth = Math.max(span * 0.006, 1)
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
      const span = geometry.span
      const lineWidth = Math.max(span * 0.006, 1)
      const markerRadius = Math.max(span * 0.025, 3)
      const textHeight = Math.max(span * 0.055, 8)

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
        selectionArea.constantWidth = Math.max(span * 0.002, 0.5)
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
          warningArea.constantWidth = Math.max(span * 0.0018, 0.5)
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
          Math.max(span * 0.12, textHeight * 2),
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
      console.log(this.workFaces, 1111)
      this.workFaces.forEach(face => this.renderWorkFace(face))
      this.sections.forEach(section => this.renderSection(section))
      try {
        this.mxcad.updateDisplay(true)
      } catch (error) {
        console.warn('刷新 CAD 显示失败:', error)
      }
    },

    async openWorkFaceDialog() {
      await this.startAreaSelection('workface')
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
        this.$Message.info(`请依次选择${label}多边形顶点，输入 C 闭合或 F 完成`)
        this.startPolygonKeyboardCapture()
        const polygon = await this.pickPolygonArea(kind)
        if (!polygon) return
        const bounds = this.normalizePolygonBounds(polygon)
        this.polygonSelectionPreviewIds = this.drawPolygonReference(polygon, kind)
        if (kind === 'workface') {
          this.editingWorkFace = {
            id: '',
            code: this.nextWorkFaceCode,
            name: '',
            range: { x: '', y: '' },
            headStart: { x: '', y: '' },
            headEnd: { x: '', y: '' },
            tailStart: { x: '', y: '' },
            tailEnd: { x: '', y: '' },
            bounds,
            polygon
          }
          this.workFaceDialogVisible = true
        } else {
          this.editingSection = {
            id: '',
            code: this.nextSectionCode,
            name: '',
            range: { x: '', y: '' },
            workFaceId: '',
            warningDistance: 50,
            bounds,
            polygon
          }
          this.sectionDialogVisible = true
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

      const bounds = this.normalizePolygonBounds(polygon)
      const markerRadius = Math.max(
        Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.012,
        2
      )
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
          getPoint.setKeyWords('[闭合(C)/完成(F)]')
          getPoint.setMessage('\n指定下一个点或输入[闭合(C)/完成(F)]:')
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
        if (this.polygonCloseRequested) {
          this.polygonFinishRequested = false
          this.polygonCloseRequested = false
          if (polygon.length >= 3) return polygon
          this.$Message.warning('至少选择 3 个点后才能闭合')
          continue
        }
        if (getPoint.isKeyWordPicked('C')) {
          if (polygon.length >= 3) return polygon
          this.$Message.warning('至少选择 3 个点后才能闭合')
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

    getPolygonPreviewWidth(polygon) {
      if (!polygon.length) return 0
      const xs = polygon.map(item => Number(item.x))
      const ys = polygon.map(item => Number(item.y))
      const span = Math.max(
        Math.max.apply(null, xs) - Math.min.apply(null, xs),
        Math.max.apply(null, ys) - Math.min.apply(null, ys)
      )
      return span * WORK_FACE_LINE_RATIO
    },

    startPolygonKeyboardCapture() {
      this.isPolygonSelecting = true
      this.polygonFinishRequested = false
      this.polygonCloseRequested = false
      window.addEventListener('keydown', this.handlePolygonKeyDown, true)
    },

    stopPolygonKeyboardCapture() {
      this.isPolygonSelecting = false
      this.polygonFinishRequested = false
      this.polygonCloseRequested = false
      window.removeEventListener('keydown', this.handlePolygonKeyDown, true)
    },

    handlePolygonKeyDown(event) {
      if (!this.isPolygonSelecting) return
      const key = String(event.key || '').toLowerCase()
      if (key !== 'f' && key !== 'c' && key !== 'enter') return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      const keyCode = key === 'enter' ? 13 : key.toUpperCase().charCodeAt(0)
      if (key === 'f' || key === 'enter') {
        this.polygonFinishRequested = true
      } else if (key === 'c') {
        this.polygonCloseRequested = true
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

    closeSectionDialog() {
      if (!this.isCoordinatePicking) {
        this.removePolygonReference()
      }
      this.sectionDialogVisible = false
      this.editingSection = null
    },

    onSaveWorkFace(value) {
        console.log(value, 2222)
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
      this.renderWorkFace(item)
      this.closeWorkFaceDialog()
      this.$Message.success('工作面已绘制')
    },

    onSaveSection(value) {
    console.log(value, 2222 )
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
      if (kind === 'workface' && isWorkFaceGeometryValid(item)) {
        const pointItems = [
          item.headStart,
          item.headEnd,
          item.tailStart,
          item.tailEnd,
          item.range
        ]
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

    initCtrlPan() {
      const canvas = document.getElementById('mxcad')
      if (!canvas) return
      canvas.addEventListener('mousedown', this.handleCtrlPanMouseDown, true)
      canvas.addEventListener('mousemove', this.handleCtrlPanMouseMove, true)
      canvas.addEventListener('mouseup', this.handleCtrlPanMouseUp, true)
      canvas.addEventListener('mouseleave', this.handleCtrlPanMouseUp, true)
    },

    destroyCtrlPan() {
      const canvas = document.getElementById('mxcad')
      if (!canvas) return
      canvas.removeEventListener('mousedown', this.handleCtrlPanMouseDown, true)
      canvas.removeEventListener('mousemove', this.handleCtrlPanMouseMove, true)
      canvas.removeEventListener('mouseup', this.handleCtrlPanMouseUp, true)
      canvas.removeEventListener('mouseleave', this.handleCtrlPanMouseUp, true)
    },

    simulateMiddleButtonEvent(event, type) {
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
        button: 1,
        buttons: 4,
        relatedTarget: event.relatedTarget
      })
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.dispatchEvent(simulatedEvent)
    },

    handleCtrlPanMouseDown(event) {
      if (event.button !== 0 || this.currentCommand) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.simulateMiddleButtonEvent(event, 'mousedown')
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = 'grabbing'
    },

    handleCtrlPanMouseMove(event) {
      if (event.buttons !== 1 || this.currentCommand) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.simulateMiddleButtonEvent(event, 'mousemove')
    },

    handleCtrlPanMouseUp(event) {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      this.simulateMiddleButtonEvent(event, 'mouseup')
      const canvas = document.getElementById('mxcad')
      if (canvas) canvas.style.cursor = ''
    }
  }
}
