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
      <!-- <FormItem v-if="!form.bounds" label="范围坐标" required>
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
      </FormItem> -->
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

function normalizeWarningDistance(value) {
  const distance = Math.round(Number(value))
  return Number.isFinite(distance) && distance >= 1 ? distance : 50
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
      if (!this.validateWorkFaceLinks()) return

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
