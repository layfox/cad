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
            {{ sensor.currentValue }}<span class="scm-current-unit"></span>
          </div>
          <div class="scm-current-label">当前值</div>
        </div>
        <div class="scm-current-item">
          <div class="scm-current-value scm-high">{{ sensor.highAlarm }}<span class="scm-current-unit"></span></div>
          <div class="scm-current-label">高报</div>
        </div>
        <div class="scm-current-item">
          <div class="scm-current-value scm-low">{{ sensor.lowAlarm }}<span class="scm-current-unit"></span></div>
          <div class="scm-current-label">低报</div>
        </div>
      </div>
    </div>

    <!-- 传感器信息 -->
    <div class="scm-info-section">
      <div class="scm-info-row">
        <div class="scm-info-card">
          <div class="scm-info-value" :title="sensorInfo.sensorNo">{{ sensorInfo.sensorNo }}</div>
          <div class="scm-info-label">传感器编号</div>
        </div>
        <div class="scm-info-card">
          <div class="scm-info-value scm-time">{{ sensorInfo.dataTime }}</div>
          <div class="scm-info-label">数据时间</div>
        </div>
      </div>
      <div class="scm-info-row">
        <div class="scm-info-card">
          <div class="scm-info-value" :title="sensorInfo.areaGroup">{{ sensorInfo.areaGroup || '--' }}</div>
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
          <span v-for="(tab, idx) in timeTabs" :key="tab" class="scm-trend-tab"
            :class="{ active: activeTimeTab === idx }" @click="onTimeTabClick(idx)">{{ tab }}</span>
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
    },
    data: {
      type: Object,
      default: () => { }
    },
    orgNo: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      activeTimeTab: 0,
      timeTabs: ['近24小时', '近7天'],
      chartInstance: null,
      sensor: {
        name: '',
        currentValue: '',
        currentColor: '#F53F3F',
        highAlarm: '',
        lowAlarm: ''
      },
      sensorInfo: {
        sensorNo: '',
        dataTime: '',
        areaGroup: '',
        type: ''
      },
      chartData: {
        hours: [],
        currentData: [],
        highAlarm: '',
        lowAlarm: ''
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        if (this.data) {
          this.getRealTime()
          this.getHistory()
          this.sensor.highAlarm = this.data.UPPER_LEV1
          this.sensor.lowAlarm = this.data.LOWER_LEV1
          this.chartData.highAlarm = this.data.UPPER_LEV1
          this.chartData.lowAlarm = this.data.LOWER_LEV1
        }
      }
    }
  },
  mounted() {
    if (this.visible) {
      if (this.data) {
          this.getRealTime()
          this.getHistory()
          this.sensor.highAlarm = this.data.UPPER_LEV1
          this.sensor.lowAlarm = this.data.LOWER_LEV1
          this.chartData.highAlarm = this.data.UPPER_LEV1
          this.chartData.lowAlarm = this.data.LOWER_LEV1
        }
    }
  },
  beforeDestroy() {
    this.destroyChart()
  },
  methods: {
    async postData(url = "", data = {}) {
      data.param_orgNo = this.orgNo
      const response = await fetch(url, {
        method: "POST",

        body: JSON.stringify(data),
      });
      return response.json();
    },
    getRealTime() {
      this.postData('/api/scaqyzt/getRealtime', {
        LOT_DOMAIN: this.data.LOT_DOMAIN,
        GZBH_DSC: this.data.GZBH_DSC,
        CDBM_DSC: this.data.CDBM_DSC,
        LOT_TYPE_NAM: this.data.LOT_TYPE_NAM,
        LOT_NAM: this.data.LOT_NAM,
        AREA_GROUP: this.data.AREA_GROUP
      }).then(res => {
        const data = res.data;
        this.sensor = {
          name: data.LOT_NAM,
          currentValue: data.deviceValue,
          currentColor: '#F53F3F'
        }
        this.sensorInfo = {
          sensorNo: data.GZBH_DSC,
          dataTime: data.dataTime,
          areaGroup: data.AREA_GROUP,
          type: data.LOT_TYPE_NAM
        }
      })
    },
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
    getHistory() {
      const end = this.getDateYmd()
      let start = ''
      if (this.activeTimeTab === 0) {
        start = this.getDateYmd(new Date(new Date().getTime() - 24 * 60 * 60 * 1000))
      } else {
        start = this.getDateYmd(new Date(new Date().getTime() - 24 * 7 * 60 * 60 * 1000))
      }
      this.postData('/api/scaqyzt/getHistory', {
        dimType: 'd',
        GZBH_DSC: this.data.GZBH_DSC,
        CDBM_DSC: this.data.CDBM_DSC,
        LOT_TYPE_NAM: this.data.LOT_TYPE_NAM,
        start,
        end
      }).then(res => {
        const data = res.data
        this.chartData = {
          hours: Object.keys(data),
          currentData: Object.values(data)
        }
        this.$nextTick(() => {
          this.initChart()
        })
      })
    },
    onClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    onAlarmHandle() {
      this.$emit('alarm-handle', this.alarm)
    },
    onTimeTabClick(idx) {
      this.activeTimeTab = idx
      this.getHistory()
    },
    initChart() {
      if (!this.$refs.chartRef) return
      if (!this.chartInstance) {
        this.chartInstance = echarts.init(this.$refs.chartRef)
      }

      const { hours, highAlarm, lowAlarm, currentData } = this.chartData
      // 动态构建 markLine：有值才绘制
      const markLineData = []
      if (highAlarm != null && highAlarm !== '') {
        markLineData.push({
          yAxis: highAlarm,
          name: '高报',
          lineStyle: { color: '#EC3000', type: 'dashed' },
          label: { position: 'end', formatter: '{c}' }
        })
      }
      if (lowAlarm != null && lowAlarm !== '') {
        markLineData.push({
          yAxis: lowAlarm,
          name: '低报',
          lineStyle: { color: '#1764E8', type: 'dashed' },
          label: { position: 'end', formatter: '{c}' }
        })
      }

      this.chartInstance.setOption({
        grid: {
          top: 36,
          left: 48,
          right: 16,
          bottom: 32
        },
        tooltip: {
          show: true,
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: hours,
          axisLine: { lineStyle: { color: '#DDDDDD' } },
          axisLabel: { color: '#666', fontSize: 14 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#DDDDDD' } },
          axisLabel: { color: '#666', fontSize: 14, formatter: '{value}' }
        },
        series: [
          {
            name: '当前值',
            type: 'line',
            data: currentData,
            smooth: true,
            symbol: 'none',
            symbolSize: 4,
            lineStyle: { color: '#26A94E', width: 2 },
            markLine: {
              silent: true,
              data: markLineData
            }
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
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.scm-info-row:last-child {
  margin-bottom: 0;
}

.scm-info-card {
  width: calc(50% - 8px);
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
