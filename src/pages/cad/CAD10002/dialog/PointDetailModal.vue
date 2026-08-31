<template>
  <div class="point-detail-modal">
    <!-- 头部 -->
    <div class="pdm-header">
      <div class="pdm-title">
        <span class="pdm-title-name">{{ point.name }}</span>
      </div>
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
          <span class="pdm-info-value">{{ point.CD_UNIT }}</span>
        </div>
      </div>
      <div class="pdm-info-row">
        <div class="pdm-info-item">
          <span class="pdm-info-label">测点编码</span>
          <span class="pdm-info-value">{{ point.CD_ID }}</span>
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
        <span class="pdm-chart-unit">{{ point.CD_UNIT }}</span>
        <div class="pdm-chart-tabs">
          <span v-for="(tab, idx) in timeTabs" :key="tab" class="pdm-chart-tab" :class="{ active: activeTab === idx }"
            @click="onTimeTabClick(idx)">{{ tab }}</span>
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
    },
    orgNo: {
      type: String,
      default: ''
    }
  },
  watch: {
    visible(val) {
      if (val) {
        if (this.point) {
          this.getData()
        }
      }
    }
  },
  data() {
    return {
      activeTab: 0,
      timeTabs: ['近一天', '近一周', '近一月', '近半年', '近一年'],
      chartInstance: null,
      orgNo: '',
      chartXData: [],
      chartYData: []
    }
  },
  mounted() {
  },
  beforeDestroy() {
    this.destroyChart()
  },
  methods: {
    getDateYmd(date = new Date()) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hours = d.getHours();
      const m = month < 10 ? '0' + month : month;
      const dd = day < 10 ? '0' + day : day;
      const hh = hours < 10 ? '0' + hours : hours;
      return `${year}${m}${dd}${hh}`;
    },
    async postData(url = "", data = {}) {
      data.param_orgNo = this.orgNo
      const response = await fetch(url, {
        method: "POST",

        body: JSON.stringify(data),
      });
      return response.json();
    },
    getData() {
      const end = this.getDateYmd()
      let start = ''
      if (this.activeTab === 0) {
        start = this.getDateYmd(new Date(new Date().getTime() - 24 * 60 * 60 * 1000))
      } else if (this.activeTab === 1) {
        start = this.getDateYmd(new Date(new Date().getTime() - 24 * 7 * 60 * 60 * 1000))
      } else if (this.activeTab === 2) {
        start = this.getDateYmd(new Date(new Date().getTime() - 24 * 30 * 60 * 60 * 1000))
      } else if (this.activeTab === 3) {
        start = this.getDateYmd(new Date(new Date().getTime() - 24 * 180 * 60 * 60 * 1000))
      } else if (this.activeTab === 4) {
        start = this.getDateYmd(new Date(new Date().getTime() - 24 * 365 * 60 * 60 * 1000))
      }
      this.postData('/api/scaqyzt/getHydrologyCh4History', {
        TZPZ_NO: this.point.TZPZ_NO,
        start,
        end,
        CD_ID: this.point.CD_ID,
        GZBH_DSC: this.point.GZBH_DSC
      }).then(res => {
        const data = res.data;
        this.chartXData = Object.keys(res.data)
        this.chartYData = Object.values(res.data)
        this.initChart()
      })
    },
    onClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    onTimeTabClick(idx) {
      this.activeTab = idx
      this.getData()
    },
    initChart() {
      if (!this.$refs.chartRef) return
      if (!this.chartInstance) {
        this.chartInstance = echarts.init(this.$refs.chartRef)
      }

      const xData = this.chartXData
      const yData = this.chartYData
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
          axisLine: { lineStyle: { color: '#DDDDDD' } },
          axisLabel: { color: '#666', fontSize: 14 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          splitNumber: 4,
          splitLine: { lineStyle: { color: '#DDDDDD' } },
          axisLabel: { color: '#666', fontSize: 14 }
        },
        series: [{
          type: 'line',
          data: yData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#26A94E', width: 2 },
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
  height: 40px;
  padding-left: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: url('../css/images/header1.png') no-repeat;
  background-size: 100% 100%;
}

.pdm-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #333333;
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
  padding: 16px;
  flex-shrink: 0;
  background: #F3F7F9;
  margin: 20px 16px;
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
  flex: 1;
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
  padding: 0 16px 16px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.pdm-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  height: 360px;
}
</style>

<style>
.point-detail-modal-wrapper .ivu-modal-body {
  padding: 0;
}
</style>
