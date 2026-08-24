<template>
  <div class="alarm-handle-modal">
    <!-- 头部 -->
    <div class="ahm-header">
      <div class="ahm-title">
        <img src="../css/images/modal-icon.png" alt="">
        <span class="ahm-title-text">告警闭环处理</span>
      </div>
    </div>

    <!-- 告警概览 -->
    <div class="ahm-alert-banner">
      <div class="ahm-alert-level">{{ alarm.level }}</div>
      <div class="ahm-alert-desc">
        <div class="ahm-alert-title">{{ alarm.title }}</div>
        <div class="ahm-alert-subtitle">{{ alarm.subtitle }}</div>
      </div>
    </div>

    <!-- 处理流程步骤 -->
    <div class="ahm-steps">
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="ahm-step"
        :class="{ active: currentStep >= idx, completed: currentStep > idx, current: currentStep === idx }"
        @click="onStepClick(idx)"
      >
        <div class="ahm-step-dot">
          <span class="ahm-step-num">{{ idx + 1 }}</span>
          <svg v-if="currentStep > idx" viewBox="0 0 16 16" class="ahm-check-icon">
            <path d="M3 8l4 4 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="ahm-step-label">{{ step }}</div>
      </div>
    </div>

    <!-- 告警详情 -->
    <div class="ahm-info-grid">
      <div class="ahm-info-card">
        <div class="ahm-info-value">{{ alarm.alarmNo }}</div>
        <div class="ahm-info-label">告警编号</div>
      </div>
      <div class="ahm-info-card">
        <div class="ahm-info-value">{{ alarm.status }}</div>
        <div class="ahm-info-label">当前状态</div>
      </div>
      <div class="ahm-info-card">
        <div class="ahm-info-value ahm-info-time">{{ alarm.time }}</div>
        <div class="ahm-info-label">发生时间</div>
      </div>
      <div class="ahm-info-card">
        <div class="ahm-info-value">{{ alarm.responsibleUnit }}</div>
        <div class="ahm-info-label">责任单位</div>
      </div>
      <div class="ahm-info-card">
        <div class="ahm-info-value">{{ alarm.deadline }}</div>
        <div class="ahm-info-label">处置时限</div>
      </div>
      <div class="ahm-info-card">
        <div class="ahm-info-value">{{ alarm.responseLevel }}</div>
        <div class="ahm-info-label">响应等级</div>
      </div>
    </div>

    <!-- 处置说明 -->
    <div class="ahm-note-section">
      <div class="ahm-note-label">处置说明</div>
      <Input
        v-model="handleNote"
        type="textarea"
        :rows="3"
        placeholder="请输入处置说明"
        class="ahm-note-input"
      />
    </div>

    <!-- 底部按钮 -->
    <div class="ahm-footer">
      <Button size="default" @click="onClose">关闭</Button>
      <Button type="primary" class="ahm-btn-primary" @click="onAlarmHandle">
        {{ primaryBtnText }}
      </Button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AlarmHandleModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    alarm: {
      type: Object,
      default: () => ({
        level: '一级告警',
        title: '瓦斯浓度超限',
        subtitle: '回风巷瓦斯监测点，当前 1.26%，阈值 1%',
        alarmNo: 'ALM-001',
        status: '告警发生',
        time: '2026-07-29 10:18',
        responsibleUnit: '通风队',
        deadline: '30 分钟',
        responseLevel: '一级告警'
      })
    }
  },
  data() {
    return {
      steps: ['告警发生', '接警派单', '现场处置', '复核关闭'],
      currentStep: 0,
      handleNote: ''
    }
  },
  computed: {
    primaryBtnText() {
      const map = ['接警并派单', '现场处置', '复核关闭', '已完成']
      return map[this.currentStep] || '关闭'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.currentStep = 0
        this.handleNote = ''
      }
    }
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    onAlarmHandle() {
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++
        this.$emit('step-change', this.currentStep)
        if (this.currentStep === 1) {
          this.$emit('dispatch')
        }
      }
    },
    onStepClick(idx) {
      // 只允许点击当前步骤及之前的步骤
      if (idx <= this.currentStep) {
        this.$emit('step-change', idx)
      }
    }
  }
}
</script>

<style scoped>
.alarm-handle-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 14px;
  background: #fff;
}

/* ===== 头部 ===== */
.ahm-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.ahm-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #333333;
  gap: 6px;
}

/* ===== 告警横幅 ===== */
.ahm-alert-banner {
  margin: 16px;
  padding: 14px 16px;
  background: #FFF1F0;
  border: 1px solid #FFCCC7;
  border-left: 4px solid #F53F3F;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
}

.ahm-alert-level {
  flex-shrink: 0;
  padding: 2px 10px;
  background: #F53F3F;
  color: #fff;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
}

.ahm-alert-desc {
  flex: 1;
  min-width: 0;
}

.ahm-alert-title {
  font-size: 15px;
  font-weight: 600;
  color: #F53F3F;
  margin-bottom: 4px;
}

.ahm-alert-subtitle {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

/* ===== 流程步骤 ===== */
.ahm-steps {
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 0;
  flex-shrink: 0;
}

.ahm-step {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  position: relative;
}

.ahm-step:not(:last-child)::after {
  content: '';
  position: absolute;
  right: calc(50% - 8px);
  top: 50%;
  transform: translateY(-50%);
  width: calc(100% - 16px);
  height: 2px;
  background: #E0E0E0;
  z-index: 0;
}

.ahm-step.completed:not(:last-child)::after {
  background: #1764E8;
}

.ahm-step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  transition: all 0.25s;
}

.ahm-step-num {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

.ahm-check-icon {
  width: 14px;
  height: 14px;
  color: #fff;
}

.ahm-step.current .ahm-step-dot,
.ahm-step.active .ahm-step-dot {
  background: #1764E8;
}

.ahm-step-label {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  transition: color 0.25s;
  position: relative;
  z-index: 1;
}

.ahm-step.current .ahm-step-label,
.ahm-step.active .ahm-step-label {
  color: #1764E8;
  font-weight: 500;
}

.ahm-step.completed .ahm-step-label {
  color: #333;
}

/* ===== 详情网格 ===== */
.ahm-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  flex-shrink: 0;
}

.ahm-info-card {
  height: 72px;
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  background: url('../css/images/sc-info-bg.png') no-repeat;
  background-size: 100% 100%;
}

.ahm-info-value {
  font-weight: 600;
  font-size: 16px;
  color: #1764E8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ahm-info-value.ahm-info-time {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.ahm-info-label {
  font-size: 12px;
  color: #888;
}

/* ===== 处置说明 ===== */
.ahm-note-section {
  padding: 0 16px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ahm-note-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex-shrink: 0;
}

.ahm-note-input {
  flex: 1;
}

.ahm-note-input >>> .ivu-textarea-inner {
  font-size: 14px;
  color: #333;
}

/* ===== 底部按钮 ===== */
.ahm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.ahm-btn-primary {
  background: #1764E8;
  border-color: #1764E8;
}

.ahm-btn-primary:hover {
  background: #4080f0;
  border-color: #4080f0;
}
</style>

<style>
.alarm-handle-modal-wrapper .ivu-modal-body {
  padding: 0;
}
</style>
