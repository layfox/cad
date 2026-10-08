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

      <FormItem v-if="!form.bounds" label="范围坐标" required>
        <div class="coord-row">
          <Input v-model="form.range.x" placeholder="X" />
          <Input v-model="form.range.y" placeholder="Y" />
          <Button type="primary" plain @click="requestPick('range')">选择坐标</Button>
        </div>
      </FormItem>
      <FormItem v-else label="圈选区域">
        <div class="selection-summary">
          已记录 {{ selectionPointCount }} 个多边形顶点
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
    </div>
  </div>
</template>

<script>
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
    }
  },
  data() {
    return {
      form: this.createEmptyForm()
    }
  },
  computed: {
    selectionPointCount() {
      return this.form.polygon.length || (this.form.bounds ? 4 : 0)
    },
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
            range: clonePoint(val.range || emptyPoint()),
            headStart: clonePoint(val.headStart || emptyPoint()),
            headEnd: clonePoint(val.headEnd || emptyPoint()),
            tailStart: clonePoint(val.tailStart || emptyPoint()),
            tailEnd: clonePoint(val.tailEnd || emptyPoint()),
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
        range: emptyPoint(),
        headStart: emptyPoint(),
        headEnd: emptyPoint(),
        tailStart: emptyPoint(),
        tailEnd: emptyPoint(),
        bounds: null,
        polygon: []
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
    validateCoordinates() {
      const pointNames = {
        headStart: '机头开始坐标',
        headEnd: '机头结束坐标',
        tailStart: '机尾开始坐标',
        tailEnd: '机尾结束坐标'
      }
      if (!this.form.bounds) {
        pointNames.range = '范围坐标'
      }
      for (const field of Object.keys(pointNames)) {
        const point = this.form[field]
        if (
          !point ||
          point.x === '' || point.y === '' ||
          point.x === null || point.y === null ||
          point.x === undefined || point.y === undefined ||
          !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))
        ) {
          this.$Message.warning(`请选择完整的${pointNames[field]}`)
          return false
        }
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

      const range = this.form.bounds
        ? {
          x: (Number(this.form.bounds.minX) + Number(this.form.bounds.maxX)) / 2,
          y: (Number(this.form.bounds.minY) + Number(this.form.bounds.maxY)) / 2
        }
        : clonePoint(this.form.range)

      this.$emit('confirm', {
        id: this.form.id || `workface-${Date.now()}`,
        code: this.form.code,
        name: this.form.name,
        range,
        headStart: clonePoint(this.form.headStart),
        headEnd: clonePoint(this.form.headEnd),
        tailStart: clonePoint(this.form.tailStart),
        tailEnd: clonePoint(this.form.tailEnd),
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

.selection-summary {
  height: 32px;
  padding: 0 12px;
  color: #2f73df;
  line-height: 30px;
  background: #eef5ff;
  border: 1px solid #cfe1ff;
  border-radius: 4px;
}

.coord-row .ivu-input-number,
.vector-row .ivu-input-wrapper {
  width: 100%;
}
</style>
