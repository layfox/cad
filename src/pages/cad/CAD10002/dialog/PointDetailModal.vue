<template>
  <div class="point-detail-modal">
    <!-- 头部 -->
    <div class="pdm-header">
      <div class="pdm-title">
        <span class="pdm-title-arrow">▶</span>
        <span class="pdm-title-name">{{ point.title }}</span>
      </div>
      <span class="pdm-close" @click="onClose">×</span>
    </div>

    <!-- 测点信息 -->
    <div class="pdm-info-section">
      <div class="pdm-info-row">
        <div class="pdm-info-item">
          <span class="pdm-info-label">数据类型</span>
          <span class="pdm-info-value">{{ point.dataType }}</span>
        </div>
        <div class="pdm-info-item">
          <span class="pdm-info-label">单位</span>
          <span class="pdm-info-value">{{ point.unit }}</span>
        </div>
      </div>
      <div class="pdm-info-row">
        <div class="pdm-info-item">
          <span class="pdm-info-label">测点编码</span>
          <span class="pdm-info-value">{{ point.code }}</span>
        </div>
        <div class="pdm-info-item">
          <span class="pdm-info-label">量程</span>
          <span class="pdm-info-value">{{ point.range }}</span>
        </div>
      </div>
      <div class="pdm-info-row">
        <div class="pdm-info-item">
          <span class="pdm-info-label">是否启用</span>
          <span class="pdm-info-value">{{ point.enabled }}</span>
        </div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div class="pdm-chart-section">
      <div class="pdm-chart-header">
        <span class="pdm-chart-unit">{{ point.unit }}</span>
        <div class="pdm-chart-tabs">
          <span
            v-for="(tab, idx) in timeTabs"
            :key="tab"
            class="pdm-chart-tab"
            :class="{ active: activeTab === idx }"
            @click="onTimeTabClick(idx)"
          >{{ tab }}</span>
        </div>
      </div>
      <div class="pdm-chart-container">
        <div ref="chartRef" class="pdm-chart"></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'PointDetailModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    point: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      activeTab: 1,
      timeTabs: ['分钟', '小时', '前一天', '后一天', '本周', '上周', '下周', '本月', '上月', '下月'],
      chartInstance: null
    }
  },
  computed: {
    chartXData() {
      return ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    chartYData() {
      return [60, 62, 70, 78, 82, 86, 88]
    },
    yAxisMax() {
      return Math.ceil(Math.max(...this.chartYData) / 30) * 30 + 30
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
    onTimeTabClick(idx) {
      this.activeTab = idx
      this.destroyChart()
      this.$nextTick(() => {
        this.initChart()
      })
    },
    initChart() {
      if (!this.$refs.chartRef) return
      this.chartInstance = echarts.init(this.$refs.chartRef)
      const xData = this.chartXData
      const yData = this.chartYData
      const maxVal = this.yAxisMax
      this.chartInstance.setOption({
        grid: {
          top: 36,
          left: 48,
          right: 16,
          bottom: 32
        },
        xAxis: {
          type: 'category',
          data: xData,
          axisLine: { lineStyle: { color: '#e0e0e0' } },
          axisLabel: { color: '#888', fontSize: 11 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: maxVal,
          splitNumber: 4,
          splitLine: { lineStyle: { color: '#f0f0f0' } },
          axisLabel: { color: '#888', fontSize: 11 }
        },
        series: [{
          type: 'line',
          data: yData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#52c41a', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82,196,26,0.15)' },
                { offset: 1, color: 'rgba(82,196,26,0.01)' }
              ]
            }
          }
        }]
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
.point-detail-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 14px;
}

/* ===== 头部 ===== */
.pdm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.pdm-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  max-width: 80%;
  overflow: hidden;
}

.pdm-title-arrow {
  color: #1764e8;
  margin-right: 6px;
  font-size: 12px;
  flex-shrink: 0;
}

.pdm-title-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pdm-close {
  font-size: 22px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  flex-shrink: 0;
}

.pdm-close:hover {
  color: #333;
}

/* ===== 测点信息 ===== */
.pdm-info-section {
  padding: 16px 20px 0;
  flex-shrink: 0;
}

.pdm-info-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 40px;
  margin-bottom: 8px;
}

.pdm-info-row:last-child {
  margin-bottom: 0;
}

.pdm-info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.pdm-info-label {
  color: #888;
  margin-right: 6px;
  flex-shrink: 0;
}

.pdm-info-value {
  color: #1a1a1a;
}

/* ===== 趋势图表 ===== */
.pdm-chart-section {
  flex: 1;
  padding: 16px 20px 12px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.pdm-chart-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.pdm-chart-unit {
  font-size: 14px;
  color: #888;
  flex-shrink: 0;
}

.pdm-chart-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pdm-chart-tab {
  padding: 4px 12px;
  font-size: 12px;
  color: #666;
  background: #f0f2f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.pdm-chart-tab:hover {
  color: #1764e8;
  background: #e6f0ff;
}

.pdm-chart-tab.active {
  color: #fff;
  background: #1764e8;
}

.pdm-chart-container {
  flex: 1;
  min-height: 0;
}

.pdm-chart {
  width: 100%;
  height: 100%;
}
</style>

<style>
.point-detail-modal-wrapper .ivu-modal-body {
  padding: 0;
}
</style>
