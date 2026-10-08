<template>
  <div class="draw-config-dialog section-dialog">
    <div class="draw-config-header">
      <span class="draw-config-title">断面</span>
    </div>

    <Form ref="formRef" class="draw-config-form" :model="form" :label-width="112">
      <FormItem label="编码" required>
        <Input v-model.trim="form.code" :maxlength="30" placeholder="请输入断面编码" />
      </FormItem>
      <FormItem label="名称" required>
        <Input v-model.trim="form.name" :maxlength="50" placeholder="请输入断面名称" />
      </FormItem>
      <FormItem v-if="!form.bounds" label="范围坐标" required>
        <div class="coord-row">
          <Input v-model="form.range.x" placeholder="X" />
          <Input v-model="form.range.y" placeholder="Y" />
          <Button type="primary" plain @click="$emit('pick-coordinate', { dialog: 'section', field: 'range' })">选择坐标</Button>
        </div>
      </FormItem>
      <FormItem v-else label="圈选区域">
        <div class="selection-summary">
          已记录 {{ selectionPointCount }} 个多边形顶点
        </div>
      </FormItem>
      <FormItem label="影响工作面" required>
        <Select v-model="form.workFaceId" clearable placeholder="请选择">
          <Option v-for="face in workFaces" :key="face.id" :value="face.id" :label="face.name" />
        </Select>
      </FormItem>
      <FormItem label="提醒距离" required>
        <InputNumber
          v-model="form.warningDistance"
          :min="0"
          :precision="2"
          :step="1"
          style="width: 180px"
        />
        <span class="unit-text">米</span>
      </FormItem>
    </Form>

    <div class="draw-config-tip">
      根据提醒距离、设计范围和断面坐标，提前计算影响范围。
    </div>

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
      form: this.createEmptyForm()
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
            range: clonePoint(val.range || emptyPoint()),
            workFaceId: val.workFaceId || '',
            warningDistance: Number(val.warningDistance) || 0,
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
        workFaceId: this.workFaces.length ? this.workFaces[0].id : '',
        warningDistance: 50,
        bounds: null,
        polygon: []
      }
    },
    fillCoordinate(field, x, y) {
      if (!this.form[field]) return
      this.form[field].x = Number(x)
      this.form[field].y = Number(y)
    },
    onConfirm() {
      if (!this.form.code) {
        this.$Message.warning('请输入断面编码')
        return
      }
      if (!this.form.name) {
        this.$Message.warning('请输入断面名称')
        return
      }
      if (!this.form.bounds) {
        if (
          this.form.range.x === '' || this.form.range.y === '' ||
          this.form.range.x === null || this.form.range.y === null ||
          this.form.range.x === undefined || this.form.range.y === undefined ||
          !Number.isFinite(Number(this.form.range.x)) ||
          !Number.isFinite(Number(this.form.range.y))
        ) {
          this.$Message.warning('请选择完整的范围坐标')
          return
        }
      }
      if (!this.form.workFaceId) {
        this.$Message.warning('请选择影响工作面')
        return
      }

      this.$emit('confirm', {
        id: this.form.id || `section-${Date.now()}`,
        code: this.form.code,
        name: this.form.name,
        range: this.form.bounds
          ? {
            x: (Number(this.form.bounds.minX) + Number(this.form.bounds.maxX)) / 2,
            y: (Number(this.form.bounds.minY) + Number(this.form.bounds.maxY)) / 2
          }
          : clonePoint(this.form.range),
        workFaceId: this.form.workFaceId,
        warningDistance: Number(this.form.warningDistance) || 0,
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
  padding: 22px 30px 8px;
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

.coord-row .ivu-input-number {
  width: 100%;
}

.selection-summary {
  height: 32px;
  padding: 0 12px;
  color: #d64b4b;
  line-height: 30px;
  background: #fff2f0;
  border: 1px solid #ffd3cf;
  border-radius: 4px;
}

.unit-text {
  margin-left: 8px;
  color: #666;
}
</style>
