<template>
  <div class="draw-config-dialog work-face-dialog">
    <div class="draw-config-header">
      <span class="draw-config-title">工作面</span>
    </div>

    <Form ref="formRef" class="draw-config-form" :model="form" :label-width="132">
      <FormItem label="编码" required>
        <Input v-model.trim="form.code" :maxlength="30" placeholder="请输入工作面编码" />
      </FormItem>
      <FormItem label="名称" required>
        <Input v-model.trim="form.name" :maxlength="50" placeholder="请输入工作面名称" />
      </FormItem>

      <FormItem label="工作面线段" required>
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

      <FormItem label="机头开始坐标" required>
        <div class="coord-row">
          <Input v-model="form.headStart.x" placeholder="X" />
          <Input v-model="form.headStart.y" placeholder="Y" />
          <Button type="primary" plain @click="requestPick('headStart')">选择坐标</Button>
        </div>
      </FormItem>
      <FormItem label="机头结束坐标" required>
        <div class="coord-row">
          <Input v-model="form.headEnd.x" placeholder="X" />
          <Input v-model="form.headEnd.y" placeholder="Y" />
          <Button type="primary" plain @click="requestPick('headEnd')">选择坐标</Button>
        </div>
      </FormItem>
      <FormItem label="机头单位方向向量">
        <div class="vector-row">
          <Input :value="headVector.x" disabled />
          <Input :value="headVector.y" disabled />
        </div>
      </FormItem>

      <FormItem label="机尾开始坐标" required>
        <div class="coord-row">
          <Input v-model="form.tailStart.x" placeholder="X" />
          <Input v-model="form.tailStart.y" placeholder="Y" />
          <Button type="primary" plain @click="requestPick('tailStart')">选择坐标</Button>
        </div>
      </FormItem>
      <FormItem label="机尾结束坐标" required>
        <div class="coord-row">
          <Input v-model="form.tailEnd.x" placeholder="X" />
          <Input v-model="form.tailEnd.y" placeholder="Y" />
          <Button type="primary" plain @click="requestPick('tailEnd')">选择坐标</Button>
        </div>
      </FormItem>
      <FormItem label="机尾单位方向向量">
        <div class="vector-row">
          <Input :value="tailVector.x" disabled />
          <Input :value="tailVector.y" disabled />
        </div>
      </FormItem>
    </Form>

    <div class="draw-config-footer">
      <Button type="primary" @click="onConfirm">确定</Button>
      <Button @click="onCancel">取消</Button>
      <Button v-if="canDelete" type="error" ghost @click="onDelete">删除</Button>
    </div>
  </div>
</template>

<script>
// 线宽/线色默认值与 js/CAD10004R.js 的 FIXED_LINE_WIDTH / DEFAULT_WORK_FACE_LINE_COLOR 保持一致
const DEFAULT_LINE_WIDTH = 2
const DEFAULT_LINE_COLOR = '#0D5CE0'
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

function isPointValid(value) {
  return value &&
    value.x !== '' && value.y !== '' &&
    value.x !== null && value.y !== null &&
    value.x !== undefined && value.y !== undefined &&
    Number.isFinite(Number(value.x)) &&
    Number.isFinite(Number(value.y))
}

function isSamePoint(a, b) {
  return isPointValid(a) && isPointValid(b) &&
    Number(a.x) === Number(b.x) && Number(a.y) === Number(b.y)
}

function normalizeLineWidth(value) {
  const width = Math.round(Number(value))
  return Number.isFinite(width) && width >= 1 ? width : DEFAULT_LINE_WIDTH
}

function normalizeLineColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : DEFAULT_LINE_COLOR
}

function directionVector(start, end) {
  const dx = Number(end.x) - Number(start.x)
  const dy = Number(end.y) - Number(start.y)
  const length = Math.sqrt(dx * dx + dy * dy)
  if (!Number.isFinite(length) || length === 0) return { x: '0.0000', y: '0.0000' }
  return {
    x: (dx / length).toFixed(4),
    y: (dy / length).toFixed(4)
  }
}

export default {
  name: 'WorkFaceDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    value: {
      type: Object,
      default: null
    },
    nextCode: {
      type: String,
      default: ''
    },
    canDelete: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: this.createEmptyForm(),
      lineWidthOptions: LINE_WIDTH_OPTIONS
    }
  },
  computed: {
    headVector() {
      return directionVector(this.form.headStart, this.form.headEnd)
    },
    tailVector() {
      return directionVector(this.form.tailStart, this.form.tailEnd)
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
            headStart: clonePoint(val.headStart || emptyPoint()),
            headEnd: clonePoint(val.headEnd || emptyPoint()),
            tailStart: clonePoint(val.tailStart || emptyPoint()),
            tailEnd: clonePoint(val.tailEnd || emptyPoint())
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
        headStart: emptyPoint(),
        headEnd: emptyPoint(),
        tailStart: emptyPoint(),
        tailEnd: emptyPoint()
      }
    },
    requestPick(field) {
      this.$emit('pick-coordinate', {
        dialog: 'workface',
        field
      })
    },
    fillCoordinate(field, x, y) {
      if (!this.form[field]) return
      this.form[field].x = Number(x)
      this.form[field].y = Number(y)
    },
    // 供父组件在选点后取当前状态，用于在图纸上实时预览端点位置与名称
    getPreviewPayload() {
      return {
        lineWidth: normalizeLineWidth(this.form.lineWidth),
        lineColor: normalizeLineColor(this.form.lineColor),
        headStart: clonePoint(this.form.headStart),
        headEnd: clonePoint(this.form.headEnd),
        tailStart: clonePoint(this.form.tailStart),
        tailEnd: clonePoint(this.form.tailEnd)
      }
    },
    validateCoordinates() {
      const pointNames = {
        headStart: '机头开始坐标',
        headEnd: '机头结束坐标',
        tailStart: '机尾开始坐标',
        tailEnd: '机尾结束坐标'
      }
      for (const field of Object.keys(pointNames)) {
        if (!isPointValid(this.form[field])) {
          this.$Message.warning(`请选择完整的${pointNames[field]}`)
          return false
        }
      }
      if (isSamePoint(this.form.headStart, this.form.headEnd)) {
        this.$Message.warning('机头的开始坐标与结束坐标不能重合')
        return false
      }
      if (isSamePoint(this.form.tailStart, this.form.tailEnd)) {
        this.$Message.warning('机尾的开始坐标与结束坐标不能重合')
        return false
      }
      return true
    },
    onConfirm() {
      if (!this.form.code) {
        this.$Message.warning('请输入工作面编码')
        return
      }
      if (!this.form.name) {
        this.$Message.warning('请输入工作面名称')
        return
      }
      if (!this.validateCoordinates()) return

      // 多边形/包围盒/中心点由四个端点推导，交给 CAD10004R.js 统一计算
      this.$emit('confirm', {
        id: this.form.id || `workface-${Date.now()}`,
        code: this.form.code,
        name: this.form.name,
        lineWidth: normalizeLineWidth(this.form.lineWidth),
        lineColor: normalizeLineColor(this.form.lineColor),
        headStart: clonePoint(this.form.headStart),
        headEnd: clonePoint(this.form.headEnd),
        tailStart: clonePoint(this.form.tailStart),
        tailEnd: clonePoint(this.form.tailEnd)
      })
    },
    onCancel() {
      this.$emit('cancel')
    },
    onDelete() {
      this.$emit('delete')
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
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #edf0f5;
}

.draw-config-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.draw-config-form {
  max-height: 650px;
  padding: 22px 30px 8px;
  overflow-y: auto;
}

.draw-config-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 16px;
  border-top: 1px solid #edf0f5;
}

.draw-config-footer .ivu-btn {
  min-width: 86px;
}

.coord-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) 92px;
  gap: 8px;
}

.vector-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
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

.coord-row .ivu-input-number,
.vector-row .ivu-input-wrapper {
  width: 100%;
}
</style>
