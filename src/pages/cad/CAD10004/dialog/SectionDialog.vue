<template>
  <div class="draw-config-dialog section-dialog">
    <div class="draw-config-header">
      <img src="../css/images/modal-icon.png" alt="">
      <span class="draw-config-title">断层</span>
    </div>

    <Form ref="formRef" class="draw-config-form" :model="form" :label-width="112">
      <FormItem label="编码" required>
        <Input v-model.trim="form.code" :maxlength="30" placeholder="请输入断层编码" />
      </FormItem>
      <FormItem label="名称" required>
        <Input v-model.trim="form.name" :maxlength="50" placeholder="请输入断层名称" />
      </FormItem>

      <FormItem label="断层线段" required>
        <div class="line-style-row">
          <Select v-model="form.lineWidth" class="line-width-select">
            <Option
              v-for="width in lineWidthOptions"
              :key="width"
              :value="width"
              :label="String(width)"
            />
          </Select>
          <ColorPicker v-model="form.lineColor" class="line-color-picker" />
        </div>
      </FormItem>

      <FormItem label="断层范围" required>
        <div class="section-range-row">
          <span class="selection-summary">已记录 {{ selectionPointCount }} 个顶点</span>
          <Button type="primary" plain @click="$emit('draw-polygon')">绘制断层</Button>
        </div>
      </FormItem>

      <FormItem label="影响工作面" required>
        <div
          v-for="(link, index) in form.workFaceLinks"
          :key="link._key"
          class="work-face-row"
        >
          <Select
            v-model="link.workFaceId"
            class="work-face-select"
            placeholder="请选择"
            :disabled="!workFaces.length"
          >
            <Option
              v-for="face in workFaces"
              :key="face.id"
              :value="face.id"
              :label="face.name"
              :disabled="isWorkFaceTaken(face.id, index)"
            />
          </Select>
          <InputNumber
            v-model="link.warningDistance"
            class="work-face-distance"
            :min="1"
            :precision="0"
            :step="1"
          />
          <span class="unit-text">米</span>
          <Button
            class="work-face-row-btn"
            @click="addWorkFaceLink"
          >
            添加行
          </Button>
          <Button
            v-if="form.workFaceLinks.length > 1"
            class="work-face-row-btn"
            @click="removeWorkFaceLink(index)"
          >
            删除
          </Button>
        </div>
        <div v-if="!workFaces.length" class="work-face-empty">暂无工作面，请先添加工作面</div>
      </FormItem>
    </Form>
    <div class="draw-config-footer">
      <Button @click="onCancel">取消</Button>
      <Button type="primary" @click="onConfirm">确定</Button>
    </div>
  </div>
</template>

<script>
// 线宽/线色默认值与 js/CAD10004R.js 的 FIXED_LINE_WIDTH / DEFAULT_SECTION_LINE_COLOR 保持一致
const DEFAULT_LINE_WIDTH = 2
const DEFAULT_LINE_COLOR = '#E74545'
const LINE_WIDTH_OPTIONS = [1, 2, 3, 4, 5]

function emptyPoint() {
  return { x: '', y: '' }
}

function clonePoint(point) {
  const rawX = point ? point.x : ''
  const rawY = point ? point.y : ''
  return {
    x: rawX !== '' && rawX !== null && rawX !== undefined && Number.isFinite(Number(rawX))
      ? Number(rawX)
      : '',
    y: rawY !== '' && rawY !== null && rawY !== undefined && Number.isFinite(Number(rawY))
      ? Number(rawY)
      : ''
  }
}

function cloneBounds(bounds) {
  if (!bounds) return null
  return {
    minX: Number(bounds.minX),
    maxX: Number(bounds.maxX),
    minY: Number(bounds.minY),
    maxY: Number(bounds.maxY)
  }
}

function clonePolygon(polygon) {
  if (!Array.isArray(polygon)) return []
  return polygon.map(item => clonePoint(item))
}

function normalizeWarningDistance(value) {
  const distance = Math.round(Number(value))
  return Number.isFinite(distance) && distance >= 1 ? distance : 50
}

function normalizeLineWidth(value) {
  const width = Math.round(Number(value))
  return Number.isFinite(width) && width >= 1 ? width : DEFAULT_LINE_WIDTH
}

function normalizeLineColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : DEFAULT_LINE_COLOR
}

// 行 key 只需在组件内唯一，用模块级自增值即可，避免与表单数据混在一起
let linkKeySeed = 0

export default {
  name: 'SectionDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    value: {
      type: Object,
      default: null
    },
    workFaces: {
      type: Array,
      default: () => []
    },
    nextCode: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      form: this.createEmptyForm(),
      lineWidthOptions: LINE_WIDTH_OPTIONS
    }
  },
  computed: {
    selectionPointCount() {
      return this.form.polygon.length || (this.form.bounds ? 4 : 0)
    }
  },
  watch: {
    visible(val) {
      if (val && !this.value) {
        this.form = this.createEmptyForm()
      }
    },
    value: {
      immediate: true,
      handler(val) {
        if (val) {
          this.form = {
            id: val.id,
            code: val.code || '',
            name: val.name || '',
            lineWidth: normalizeLineWidth(val.lineWidth),
            lineColor: normalizeLineColor(val.lineColor),
            range: clonePoint(val.range || emptyPoint()),
            workFaceLinks: this.createWorkFaceLinks(val),
            bounds: cloneBounds(val.bounds),
            polygon: clonePolygon(val.polygon)
          }
        } else if (this.visible) {
          this.form = this.createEmptyForm()
        }
      }
    }
  },
  methods: {
    createEmptyForm() {
      return {
        id: '',
        code: this.nextCode || '',
        name: '',
        lineWidth: DEFAULT_LINE_WIDTH,
        lineColor: DEFAULT_LINE_COLOR,
        range: emptyPoint(),
        workFaceLinks: [
          this.createWorkFaceLink(this.workFaces.length ? this.workFaces[0].id : '')
        ],
        bounds: null,
        polygon: []
      }
    },
    createWorkFaceLink(workFaceId = '', warningDistance = 50) {
      linkKeySeed += 1
      return {
        _key: linkKeySeed,
        workFaceId: workFaceId || '',
        warningDistance: normalizeWarningDistance(warningDistance)
      }
    },
    createWorkFaceLinks(value) {
      const source = Array.isArray(value.workFaceLinks) ? value.workFaceLinks : []
      const links = source
        .filter(item => item && item.workFaceId)
        .map(item => this.createWorkFaceLink(item.workFaceId, item.warningDistance))
      return links.length ? links : [this.createWorkFaceLink()]
    },
    addWorkFaceLink() {
      this.form.workFaceLinks.push(this.createWorkFaceLink())
    },
    removeWorkFaceLink(index) {
      // 首行常驻不可删除，保证至少保留一项
      if (index <= 0) return
      this.form.workFaceLinks.splice(index, 1)
    },
    isWorkFaceTaken(workFaceId, currentIndex) {
      return this.form.workFaceLinks.some(
        (link, index) => index !== currentIndex && link.workFaceId === workFaceId
      )
    },
    validateWorkFaceLinks() {
      const links = this.form.workFaceLinks
      if (!links.length) {
        this.$Message.warning('请至少配置一项影响工作面')
        return false
      }
      const used = new Set()
      for (const link of links) {
        if (!link.workFaceId) {
          this.$Message.warning('请选择完整的影响工作面')
          return false
        }
        if (used.has(link.workFaceId)) {
          this.$Message.warning('影响工作面不可重复选择')
          return false
        }
        used.add(link.workFaceId)
        const distance = Number(link.warningDistance)
        if (!Number.isInteger(distance) || distance < 1) {
          this.$Message.warning('提醒距离请输入正整数')
          return false
        }
      }
      return true
    },
    // 绘制会话结束后唯一的回填通路：value prop 引用没变，watcher 不会触发，
    // 只能由父组件命令式调用。只覆盖绘制结果，不动用户已填的编码/名称/线段/影响工作面
    applyPolygon(payload) {
      if (!payload) return
      this.form.polygon = clonePolygon(payload.polygon)
      this.form.bounds = cloneBounds(payload.bounds)
      this.form.range = clonePoint(payload.range || emptyPoint())
    },
    // 绘制会话期间父组件取当前填写的编码/名称：草稿对象的名称标签直接用它们，
    // 否则草稿 name 是空串、标签文字按 code 回退，绘制过程中看到的是编码
    getIdentity() {
      return { code: this.form.code, name: this.form.name }
    },
    onConfirm() {
      if (!this.form.code) {
        this.$Message.warning('请输入断层编码')
        return
      }
      if (!this.form.name) {
        this.$Message.warning('请输入断层名称')
        return
      }
      if (!Array.isArray(this.form.polygon) || this.form.polygon.length < 3) {
        this.$Message.warning('请先点击「绘制断层」绘制多边形')
        return
      }
      if (!this.validateWorkFaceLinks()) return

      this.$emit('confirm', {
        id: this.form.id || `section-${Date.now()}`,
        code: this.form.code,
        name: this.form.name,
        lineWidth: normalizeLineWidth(this.form.lineWidth),
        lineColor: normalizeLineColor(this.form.lineColor),
        range: this.form.bounds
          ? {
            x: (Number(this.form.bounds.minX) + Number(this.form.bounds.maxX)) / 2,
            y: (Number(this.form.bounds.minY) + Number(this.form.bounds.maxY)) / 2
          }
          : clonePoint(this.form.range),
        workFaceLinks: this.form.workFaceLinks.map(link => ({
          workFaceId: link.workFaceId,
          warningDistance: Number(link.warningDistance)
        })),
        bounds: cloneBounds(this.form.bounds),
        polygon: clonePolygon(this.form.polygon)
      })
    },
    onCancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.draw-config-dialog {
  width: 100%;
  color: #333;
}

.draw-config-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #edf0f5;
}

.draw-config-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.draw-config-form {
  padding: 16px;
}

.draw-config-tip {
  margin: 0 30px 16px 112px;
  padding: 10px 12px;
  color: #8d6a22;
  font-size: 13px;
  line-height: 20px;
  background: #fff8df;
  border: 1px solid #f4dfa2;
}

.draw-config-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #edf0f5;
}

.draw-config-footer .ivu-btn {
  /* min-width: 86px; */
}

.coord-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) 92px;
  gap: 8px;
}

.coord-row .ivu-input-number {
  width: 100%;
}

.line-style-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.line-width-select {
  width: 140px;
  flex: none;
}

.section-range-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-range-row .selection-summary {
  min-width: 0;
  flex: 1;
}

.selection-summary {
  height: 32px;
  padding: 0 12px;
  overflow: hidden;
  color: #d64b4b;
  line-height: 30px;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #fff2f0;
  border: 1px solid #ffd3cf;
  border-radius: 4px;
}

.unit-text {
  margin-left: 8px;
  color: #666;
}

.work-face-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.work-face-row:last-child {
  margin-bottom: 0;
}

.work-face-row .unit-text {
  margin-left: 0;
}

.work-face-select {
  min-width: 0;
  flex: 1;
}

.work-face-distance {
  width: 110px;
  flex: none;
}

.work-face-row-btn {
  width: 76px;
  padding: 0;
  flex: none;
}

.work-face-empty {
  margin-top: 6px;
  color: #d64b4b;
  font-size: 12px;
}
</style>
