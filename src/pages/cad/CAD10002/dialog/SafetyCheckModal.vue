<template>
  <div class="safety-check-modal">
    <!-- 头部 -->
    <div class="scm-header">
      <div class="scm-title">
        <span class="scm-title-name">{{ sensor.name }}</span>
      </div>
    </div>

    <!-- 当前值 -->
    <div class="scm-current-section">
      <div class="scm-current-grid">
        <div class="scm-current-item">
          <div class="scm-current-value" :style="{ color: sensor.currentColor }">
            {{ sensor.currentValue }}<span class="scm-current-unit">%</span>
          </div>
          <div class="scm-current-label">当前值</div>
        </div>
        <div class="scm-current-item">
          <div class="scm-current-value scm-high">{{ sensor.highAlarm }}<span class="scm-current-unit">%</span></div>
          <div class="scm-current-label">高报</div>
        </div>
        <div class="scm-current-item">
          <div class="scm-current-value scm-low">{{ sensor.lowAlarm }}<span class="scm-current-unit">%</span></div>
          <div class="scm-current-label">低报</div>
        </div>
      </div>
    </div>

    <!-- 传感器信息 -->
    <div class="scm-info-section">
      <div class="scm-info-row">
        <div class="scm-info-card">
          <div class="scm-info-value">{{ sensorInfo.sensorNo }}</div>
          <div class="scm-info-label">传感器编号</div>
        </div>
        <div class="scm-info-card">
          <div class="scm-info-value scm-time">{{ sensorInfo.dataTime }}</div>
          <div class="scm-info-label">数据时间</div>
        </div>
      </div>
      <div class="scm-info-row">
        <div class="scm-info-card">
          <div class="scm-info-value">{{ sensorInfo.areaGroup }}</div>
          <div class="scm-info-label">区域组</div>
        </div>
        <div class="scm-info-card">
          <div class="scm-info-value">{{ sensorInfo.type }}</div>
          <div class="scm-info-label">类型</div>
        </div>
      </div>
    </div>

    <!-- 历史趋势 -->
    <div class="scm-trend-section">
      <div class="scm-trend-header">
        <span class="scm-trend-title">历史趋势</span>
        <div class="scm-trend-tabs">
          <span
            v-for="(tab, idx) in timeTabs"
            :key="tab"
            class="scm-trend-tab"
            :class="{ active: activeTimeTab === idx }"
            @click="onTimeTabClick(idx)"
          >{{ tab }}</span>
        </div>
      </div>
      <div class="scm-chart-container">
        <div ref="chartRef" class="scm-chart"></div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <!-- <div class="scm-footer">
      <Button size="default" @click="onClose">关闭</Button>
      <Button type="primary" size="default" @click="onAlarmHandle">告警处理</Button>
    </div> -->
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'SafetyCheckModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    sensorId: {
      type: String,
      default: ''
    },
    alarm: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      activeTimeTab: 0,
      timeTabs: ['近24小时', '近7天'],
      chartInstance: null
    }
  },
  computed: {
    sensor() {
      return {
        name: '13203胶运4100米移变硐室激光甲烷2-T6',
        currentValue: '1.26',
        currentColor: '#F53F3F',
        highAlarm: '1',
        lowAlarm: '0'
      }
    },
    sensorInfo() {
      return {
        sensorNo: '14042300201MN001',
        dataTime: '2026-08-23 16:23:19',
        areaGroup: '13203工作面',
        type: '甲烷'
      }
    },
    chartData() {
      const hours = this.activeTimeTab === 0
        ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
        : ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      const lowData = this.activeTimeTab === 0
        ? [0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02]
        : [0.01, 0.02, 0.01, 0.03, 0.02, 0.01, 0.02]
      const highData = this.activeTimeTab === 0
        ? [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        : [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
      const currentData = this.activeTimeTab === 0
        ? [0.6, 0.62, 0.65, 0.68, 0.72, 0.78, 0.88]
        : [0.7, 0.75, 0.68, 0.82, 0.79, 0.85, 0.9]
      return { hours, lowData, highData, currentData }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.$nextTick(() => {
          this.initChart()
        })
      }
    }
  },
  mounted() {
    if (this.visible) {
      this.$nextTick(() => {
        this.initChart()
      })
    }
  },
  beforeDestroy() {
    this.destroyChart()
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    onAlarmHandle() {
      this.$emit('alarm-handle', this.alarm)
    },
    onTimeTabClick(idx) {
      this.activeTimeTab = idx
      this.destroyChart()
      this.$nextTick(() => {
        this.initChart()
      })
    },
    initChart() {
      if (!this.$refs.chartRef) return
      this.chartInstance = echarts.init(this.$refs.chartRef)
      const { hours, lowData, highData, currentData } = this.chartData
      this.chartInstance.setOption({
        grid: {
          top: 36,
          left: 48,
          right: 16,
          bottom: 32
        },
        xAxis: {
          type: 'category',
          data: hours,
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          axisLabel: { color: '#888', fontSize: 11 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 1.2,
          splitLine: { lineStyle: { color: '#f0f0f0' } },
          axisLabel: { color: '#888', fontSize: 11, formatter: '{value}%' }
        },
        legend: {
          data: ['低报', '高报'],
          top: 4,
          right: 0,
          itemWidth: 16,
          itemHeight: 3,
          textStyle: { color: '#666', fontSize: 12 }
        },
        series: [
          {
            name: '低报',
            type: 'line',
            data: lowData,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#1764e8', width: 2 },
            areaStyle: { color: 'rgba(23,100,232,0.06)' }
          },
          {
            name: '高报',
            type: 'line',
            data: highData,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#F53F3F', width: 2 }
          },
          {
            name: '当前值',
            type: 'line',
            data: currentData,
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: { color: '#52c41a', width: 2 },
            areaStyle: { color: 'rgba(82,196,26,0.06)' }
          }
        ]
      })
    },
    destroyChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose()
        this.chartInstance = null
      }
    }
  }
}
</script>

<style scoped>
.safety-check-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 14px;
}

/* ===== 头部 ===== */
.scm-header {
  height: 40px;
  padding-left: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: url('../css/images//modal-header.png') no-repeat;
  background-size: 100% 100%;
}

.scm-title {
  display: flex;
  align-items: center;
  font-weight: bold;
font-size: 16px;
color: #333333;
}

.scm-title-arrow {
  color: #1764e8;
  margin-right: 6px;
  font-size: 12px;
  flex-shrink: 0;
}

.scm-title-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scm-close {
  font-size: 22px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  flex-shrink: 0;
}

.scm-close:hover {
  color: #333;
}

/* ===== 当前值 ===== */
.scm-current-section {
  padding: 20px 16px 0;
  flex-shrink: 0;
}

.scm-current-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: #F3F7F9;
  padding: 16px;
}

.scm-current-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scm-current-value {
  font-size: 28px;
  font-weight: 700;
  color: #1764e8;
  line-height: 1;
}

.scm-current-value.scm-high {
  color: #F53F3F;
}

.scm-current-value.scm-low {
  color: #1764e8;
}

.scm-current-unit {
  font-size: 14px;
  font-weight: 400;
  margin-left: 2px;
}

.scm-current-label {
  margin-top: 6px;
  font-size: 14px;
  color: #888;
}

/* ===== 传感器信息 ===== */
.scm-info-section {
  padding: 16px;
  flex-shrink: 0;
}

.scm-info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.scm-info-row:last-child {
  margin-bottom: 0;
}

.scm-info-card {
  height: 82px;
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: url('../css/images/sc-info-bg.png') no-repeat;
  background-size: 100% 100%;
}

.scm-info-value {
  font-family: D-DIN;
  font-weight: bold;
font-size: 20px;
color: #4A8DFF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scm-info-value.scm-time {
  color: #1764e8;
  font-weight: 500;
}

.scm-info-label {
  font-size: 12px;
  color: #888;
}

/* ===== 历史趋势 ===== */
.scm-trend-section {
  flex: 1;
  padding: 0 20px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.scm-trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.scm-trend-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  position: relative;
  padding-left: 10px;
}

.scm-trend-tabs {
  display: flex;
  gap: 6px;
}

.scm-trend-tab {
  height: 24px;
  line-height: 24px;
  font-size: 12px;
  padding: 0 10px;
  color: #666;
  background: #f0f2f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.scm-trend-tab:hover {
  color: #1764e8;
  background: #e6f0ff;
}

.scm-trend-tab.active {
  color: #fff;
  background: #1764e8;
}

.scm-chart-container {
  flex: 1;
  min-height: 0;
}

.scm-chart {
  width: 100%;
  height: 240px;
}

/* ===== 底部按钮 ===== */
.scm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}
</style>
