<template>
  <div class="risk-warning-layer">
    <!-- 展开/收起共用一个过渡动画，mode="out-in" 可避免两个面板同时占位。 -->
    <transition name="risk-warning-slide" mode="out-in">
      <section v-if="expanded" key="expanded" class="risk-warning-panel">
        <!-- 展开面板左侧的收起热区，按钮尺寸大于图标便于点击。 -->
        <button class="risk-warning-collapse" type="button" aria-label="收起风险预警单" @click="expanded = false">
          <img src="./images/risk-warning-show-box-icon.png" alt="">
        </button>

        <div class="risk-warning-content">
          <!-- 标题和状态筛选保持在滚动列表之外，列表滚动时不会带动它们。 -->
          <div class="risk-warning-header">
            <h2>风险预警单</h2>
            <div class="risk-warning-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.value"
                type="button"
                :class="['risk-warning-tab', { active: activeStatus === tab.value }]"
                @click="selectStatus(tab.value)"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="risk-warning-title-line"></div>

          <!-- 搜索框触发关键词查询，日期图标下的 DatePicker 负责时间范围查询。 -->
          <div class="risk-warning-search-row">
            <Input
              v-model="searchText"
              class="risk-warning-search"
              search
              clearable
              placeholder="请输入搜索关键词"
              @on-search="refreshWarnings"
              @on-clear="refreshWarnings"
            />
            <div class="risk-warning-date-trigger" :class="{ active: hasDateRange }" title="按日期范围筛选">
              <Icon type="ios-calendar-outline" />
              <DatePicker
                v-model="dateRange"
                ref="riskDatePicker"
                class="risk-warning-date-picker"
                type="daterange"
                format="yyyy-MM-dd"
                :transfer="true"
                :editable="false"
                placement="bottom-end"
                @on-change="changeDateRange"
                @on-open-change="handleDatePickerOpen"
               />
            </div>
          </div>

          <!-- 只有这个容器允许滚动，触底后按页加载下一批数据。 -->
          <div ref="warningList" class="risk-warning-list" @scroll.passive="handleScroll">
            <template v-if="warnings.length">
              <article v-for="(item, index) in warnings" @click="toRiskDetail(item)" :key="warningKey(item, index)" class="risk-warning-item">
                <i class="risk-warning-level-line" :style="{ backgroundColor: levelMeta(item).color }"></i>
                <div class="risk-warning-item-title" :title="item.MODEL_NAM || '-'">{{ item.MODEL_NAM || '-' }}</div>
                <div class="risk-warning-item-meta">
                  <span class="risk-warning-level" :style="{ backgroundColor: levelMeta(item).color }">
                    {{ levelMeta(item).label }}
                  </span>
                  <span class="risk-warning-owner" :title="item.USR_NAM || '-'">{{ item.USR_NAM || '-' }}</span>
                  <span class="risk-warning-time">{{ item.OCCUR_DTM || '-' }}</span>
                  <span class="risk-warning-status">{{ item.EVENT_STA_NAM || statusLabel(item.EVENT_STA) }}</span>
                </div>
                <div class="risk-warning-category" :title="item.RSKT_NAM || '-'">
                  {{ item.RSKT_NAM || '-' }}
                </div>
              </article>
              <div v-if="loading" class="risk-warning-list-tip">加载中...</div>
              <button v-else-if="loadError" class="risk-warning-list-tip retry" type="button" @click="loadWarnings(false)">
                加载失败，点击重试
              </button>
              <div v-else-if="!hasMore" class="risk-warning-list-tip">没有更多数据了</div>
            </template>

            <div v-else-if="loading" class="risk-warning-empty">
              <Spin size="large" />
              <span>正在加载风险预警...</span>
            </div>
            <button v-else-if="loadError" class="risk-warning-empty retry" type="button" @click="refreshWarnings">
              <Icon type="ios-refresh" />
              <span>加载失败，点击重试</span>
            </button>
            <div v-else class="risk-warning-empty">
              <Icon type="ios-information-circle-outline" />
              <span>暂无风险预警数据</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 收起状态只保留一个 24×80 的展开按钮。 -->
      <button v-else key="collapsed" class="risk-warning-expand" type="button" aria-label="展开风险预警单" @click="expanded = true">
        <img src="./images/risk-warning-hidden-box-icon.png" alt="">
      </button>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'RiskWarning',
  data() {
    // 页面交互状态、查询条件、分页状态和列表数据均由子组件自行维护。
    return {
      expanded: true,
      tabs: [
        { label: '全部', value: '' },
        { label: '待处置', value: '01' },
        { label: '处置中', value: '02' },
        { label: '已处置', value: '99' }
      ],
      activeStatus: '',
      searchText: '',
      // daterange 使用双向绑定，并始终保留起止日期两个槽位。
      dateRange: [null, null],
      formattedDateRange: [],
      warnings: [],
      pageNum: 1,
      pageSize: 20,
      hasMore: true,
      loading: false,
      loadError: false,
      requestId: 0
    }
  },
  props: {
    orgNo: {
        type: String,
        default: ''
      }
  },
  computed: {
    // 只有起止日期都存在时，日期图标才显示已选择状态。
    hasDateRange() {
      return this.formattedDateRange.length === 2
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.refreshWarnings()
    })
  },
  methods: {
    toRiskDetail(item) {
      if (parent && parent.riskDetail) {
        parent.riskDetail(item)
      }
    },
    // 统一封装 POST 请求，并自动附加组织参数。
    async postData(url, data) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, param_orgNo: this.orgNo })
      })
      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`)
      }
      return response.json()
    },
    // 切换状态标签时回到第一页，避免沿用上一个筛选条件的分页位置。
    selectStatus(status) {
      if (this.activeStatus === status) return
      this.activeStatus = status
      this.refreshWarnings()
    },
    // iView DatePicker 返回 [start, end] 字符串数组；清空时返回空数组。
    changeDateRange(values) {
      this.formattedDateRange = Array.isArray(values) ? values.filter(Boolean) : []
      this.refreshWarnings()
    },
    // 打开面板时只修复旧版 iView 的导航方法，不改写 dateRange。
    // 保留原始 v-model，避免重新打开时已选起止日期被清空。
    handleDatePickerOpen(open) {
      if (open) this.$nextTick(() => this.patchDatePickerNavigation())
    },
    // iview 3.1.3 的左侧 changePanelDate 会忽略年份/月份增量并重置到一月。
    // 仅覆盖当前 DatePicker 实例，避免修改 node_modules 或影响其他页面。
    patchDatePickerNavigation() {
      const datePicker = this.$refs.riskDatePicker
      const panel = datePicker && datePicker.$refs && datePicker.$refs.pickerPanel
      if (!panel || panel.__riskWarningNavigationPatched) return

      panel.__riskWarningNavigationPatched = true
      panel.changePanelDate = function changePanelDate(panelName, type, increment, updateOtherPanel = true) {
        const panelDateKey = `${panelName}PanelDate`
        const currentDate = new Date(this[panelDateKey])
        if (Number.isNaN(currentDate.getTime())) return

        currentDate.setDate(1)
        if (type === 'FullYear') currentDate.setFullYear(currentDate.getFullYear() + increment)
        else currentDate.setMonth(currentDate.getMonth() + increment)
        this[panelDateKey] = currentDate

        if (!updateOtherPanel) return
        const otherPanelName = panelName === 'left' ? 'right' : 'left'
        const otherDateKey = `${otherPanelName}PanelDate`
        const otherDate = new Date(this[otherDateKey])
        if (Number.isNaN(otherDate.getTime())) return

        if (this.splitPanels) {
          if (panelName === 'left' && this.leftPanelDate >= this.rightPanelDate) {
            otherDate.setMonth(otherDate.getMonth() + 1)
            this[otherDateKey] = otherDate
          } else if (panelName === 'right' && this.rightPanelDate <= this.leftPanelDate) {
            otherDate.setMonth(otherDate.getMonth() - 1)
            this[otherDateKey] = otherDate
          }
          return
        }

        if (type === 'FullYear') {
          otherDate.setFullYear(otherDate.getFullYear() + increment)
        } else {
          const targetMonth = otherDate.getMonth() + increment
          const lastDay = new Date(otherDate.getFullYear(), targetMonth + 1, 0).getDate()
          otherDate.setDate(Math.min(lastDay, otherDate.getDate()))
          otherDate.setMonth(targetMonth)
        }
        this[otherDateKey] = otherDate
      }
    },
    // 关键词、状态或日期发生变化时，重置列表并重新查询。
    refreshWarnings() {
      this.loadWarnings(true)
    },
    // reset=true 表示新的筛选条件；reset=false 表示滚动加载下一页。
    async loadWarnings(reset) {
      if (!reset && (this.loading || !this.hasMore)) return

      const targetPage = reset ? 1 : this.pageNum + 1
      const currentRequestId = ++this.requestId
      if (reset) {
        this.pageNum = 1
        this.hasMore = true
        this.loadError = false
      }
      this.loading = true

      try {
        const response = await this.postData('/api/scaqyzt/getRmList', {
          searchText: this.searchText.trim(),
          param_OCCUR_DTM: this.formattedDateRange,
          param_EVENT_STA: this.activeStatus,
          pageSize: String(this.pageSize),
          pageNum: String(targetPage)
        })
        if (currentRequestId !== this.requestId) return
        if (response.success === false) throw new Error(response.message || '获取风险预警单失败')

        const body = response.data || {}
        const list = Array.isArray(body.data) ? body.data : []
        const pageInfo = body.pageInfo || {}
        this.warnings = reset ? list : this.mergeWarnings(this.warnings, list)
        this.pageNum = targetPage
        this.hasMore = pageInfo.totalPage !== undefined
          ? targetPage < Number(pageInfo.totalPage)
          : list.length >= this.pageSize
        this.loadError = false
      } catch (error) {
        if (currentRequestId !== this.requestId) return
        if (reset || !this.warnings.length) {
          this.warnings = []
          this.pageNum = 1
          this.hasMore = false
          this.loadError = false
        } else {
          this.loadError = true
        }
        console.error('获取风险预警单失败:', error)
      } finally {
        if (currentRequestId === this.requestId) this.loading = false
      }
    },
    // 列表接近底部时加载下一页；loading/hasMore 防止重复请求。
    handleScroll(event) {
      const target = event.target
      if (target.scrollHeight - target.scrollTop - target.clientHeight <= 24) {
        this.loadWarnings(false)
      }
    },
    // 根据 RA_NO 去重，兼容后台偶发的重复记录。
    mergeWarnings(current, incoming) {
      const warningMap = new Map()
      current.concat(incoming).forEach((item, index) => {
        const key = item.RA_NO || `${item.PGM_ID || ''}-${item.OCCUR_DTM || ''}-${index}`
        warningMap.set(key, item)
      })
      return Array.from(warningMap.values())
    },
    // 模拟后台返回 data.data 数组中的记录，字段名与接口返回示例一致。
    getFallbackWarnings() {
      return [
        {
          EVENT_STA: '01',
          EVENT_STA_NAM: '待处置',
          OCCUR_DTM: '2026-08-20 10:45:25',
          CST_NAM: '煤业归口部门',
          RA_NO: 'DEMO-RISK-0001',
          PGM_ID: 'JYOMM00205',
          MODEL_NAM: '未及时下达年度生产指标计划',
          OCCUR_ORG_NAM: '华电煤业公司',
          RSKT_NAM: '华电煤业生产部(应急办)/运营风险-综合计划下达',
          RSK_LEVEL_NAM: '低级',
          USR_NAM: '周磊'
        },
        {
          EVENT_STA: '02',
          EVENT_STA_NAM: '处置中',
          OCCUR_DTM: '2026-08-20 10:45:25',
          CST_NAM: '煤业归口部门',
          RA_NO: 'DEMO-RISK-0002',
          PGM_ID: 'JYOMM00205',
          MODEL_NAM: '未及时下达年度生产指标计划',
          OCCUR_ORG_NAM: '华电煤业公司',
          RSKT_NAM: '华电煤业生产部(应急办)/运营风险-综合计划下达',
          RSK_LEVEL_NAM: '中级',
          USR_NAM: '周磊'
        },
        {
          EVENT_STA: '02',
          EVENT_STA_NAM: '处置中',
          OCCUR_DTM: '2026-08-20 10:45:25',
          CST_NAM: '煤业归口部门',
          RA_NO: 'DEMO-RISK-0003',
          PGM_ID: 'JYOMM00205',
          MODEL_NAM: '未及时下达年度生产指标计划',
          OCCUR_ORG_NAM: '华电煤业公司',
          RSKT_NAM: '华电煤业生产部(应急办)/运营风险-综合计划下达',
          RSK_LEVEL_NAM: '高级',
          USR_NAM: '周磊'
        },
        {
          EVENT_STA: '99',
          EVENT_STA_NAM: '已处置',
          OCCUR_DTM: '2026-08-20 10:45:25',
          CST_NAM: '煤业归口部门',
          RA_NO: 'DEMO-RISK-0004',
          PGM_ID: 'JYOMM00205',
          MODEL_NAM: '未及时下达年度生产指标计划',
          OCCUR_ORG_NAM: '华电煤业公司',
          RSKT_NAM: '华电煤业生产部(应急办)/运营风险-综合计划下达',
          RSK_LEVEL_NAM: '提醒级',
          USR_NAM: '周磊'
        },
        {
          EVENT_STA: '02',
          EVENT_STA_NAM: '处置中',
          OCCUR_DTM: '2026-08-20 10:45:25',
          CST_NAM: '煤业归口部门',
          RA_NO: 'DEMO-RISK-0005',
          PGM_ID: 'JYOMM00205',
          MODEL_NAM: '未及时下达年度生产指标计划',
          OCCUR_ORG_NAM: '华电煤业公司',
          RSKT_NAM: '华电煤业生产部(应急办)/运营风险-综合计划下达',
          RSK_LEVEL_NAM: '中级',
          USR_NAM: '周磊'
        },
        {
          EVENT_STA: '02',
          EVENT_STA_NAM: '处置中',
          OCCUR_DTM: '2026-08-20 10:45:25',
          CST_NAM: '煤业归口部门',
          RA_NO: 'DEMO-RISK-0006',
          PGM_ID: 'JYOMM00205',
          MODEL_NAM: '未及时下达年度生产指标计划',
          OCCUR_ORG_NAM: '华电煤业公司',
          RSKT_NAM: '华电煤业生产部(应急办)/运营风险-综合计划下达',
          RSK_LEVEL_NAM: '高级',
          USR_NAM: '周磊'
        }
      ]
    },
    // 卡片 key 优先使用后台主键，静态数据也可稳定渲染。
    warningKey(item, index) {
      return item.RA_NO || `${item.PGM_ID || 'risk'}-${item.OCCUR_DTM || index}-${index}`
    },
    // 后台未返回状态名称时，根据状态编码补充中文显示。
    statusLabel(status) {
      const labels = { '01': '待处置', '02': '处置中', '99': '已处置' }
      return labels[status] || '-'
    },
    // 兼容不同版本/接口字段名，并把风险等级映射为截图中的颜色。
    levelMeta(item) {
      const source = item.RISK_LEVEL_NAM || item.RSK_LEVEL_NAM || item.RSKT_LEVEL_NAM || item.RISK_LEVEL || ''
      const levels = [
        { keywords: ['高', '重大', '一级'], label: '高级', color: '#F04823' },
        { keywords: ['中', '较大', '二级'], label: '中级', color: '#FF7317' },
        { keywords: ['低', '一般', '三级'], label: '低级', color: '#F2C230' },
        { keywords: ['提醒', '提示', '四级'], label: '提醒级', color: '#3184E8' }
      ]
      const matched = levels.find(level => level.keywords.some(keyword => String(source).includes(keyword)))
      return matched || { label: source || '风险', color: '#3184E8' }
    }
  }
}
</script>

<style>
/* 外层只负责覆盖在 CAD 画布上，不参与页面普通文档流。 */
.risk-warning-layer {
  position: absolute;
  inset: 0;
  z-index: 120;
  pointer-events: none;
  font-family: "Microsoft YaHei", MicrosoftYaHei, sans-serif;
}

/* 展开面板背景图自带边框和左侧凸出造型。 */
.risk-warning-panel {
  position: absolute;
  top: 5%;
  right: 0;
  width: 428px;
  height: 90%;
  box-sizing: border-box;
  background: url('./images/risk-warning-show-box-bg.png') no-repeat center / 100% 100%;
  pointer-events: auto;
  z-index: 99999;
}

.risk-warning-collapse {
  position: absolute;
  top: 50%;
  left: 12px;
  width: 24px;
  height: 80px;
  padding: 0;
  border: 0;
  background: transparent;
  transform: translateY(-50%);
  cursor: pointer;
}

.risk-warning-collapse img,
.risk-warning-expand img {
  display: block;
  width: 14px;
  height: 12px;
  margin-left: 16px
}

/* 内容区域固定内边距，标题、筛选和列表共用同一条左右基线。 */
.risk-warning-content {
  height: 100%;
  box-sizing: border-box;
  padding: 26px 26px 26px 50px;
  display: flex;
  flex-direction: column;
}

.risk-warning-header {
  display: flex;
  align-items: center;
  height: 24px;
  flex: 0 0 24px;
}

.risk-warning-header h2 {
  flex: 0 0 auto;
  margin: 0;
  color: #333333;
  font-size: 18px;
  font-weight: bold;
  line-height: 24px;
}

.risk-warning-tabs {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.risk-warning-tab {
  width: 56px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: #ECF0F5;
  color: #666666;
  font-family: inherit;
  font-size: 12px;
  line-height: 24px;
  cursor: pointer;
}

.risk-warning-tab:first-child {
  width: 44px;
}

.risk-warning-tab.active {
  background: #1764E8;
  color: #FFFFFF;
}

.risk-warning-title-line {
  width: 23px;
  height: 4px;
  flex: 0 0 4px;
  margin-top: 10px;
  border-radius: 1px;
  background: #4980FF;
}

.risk-warning-search-row {
  display: flex;
  align-items: center;
  gap: 13px;
  height: 32px;
  flex: 0 0 32px;
  margin-top: 16px;
}

.risk-warning-search {
  width: 343px;
}

.risk-warning-search .ivu-input {
  height: 32px;
  border-color: #D9DEE7;
  border-radius: 2px;
  color: #333333;
  font-size: 14px;
}

.risk-warning-search .ivu-input:focus {
  border-color: #4980FF;
  box-shadow: 0 0 0 2px rgba(73, 128, 255, 0.12);
}

.risk-warning-search .ivu-input-icon {
  height: 32px;
  line-height: 32px;
  color: #A8AFBA;
}

.risk-warning-date-trigger {
  position: relative;
  width: 16px;
  height: 18px;
  color: #1764E8;
  font-size: 18px;
  line-height: 18px;
}

.risk-warning-date-trigger.active::after {
  content: '';
  position: absolute;
  right: -2px;
  bottom: -3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #F04823;
}

.risk-warning-date-picker {
  position: absolute !important;
  inset: 0;
  width: 16px !important;
  height: 18px;
  opacity: 0;
  cursor: pointer;
}

.risk-warning-date-picker .ivu-date-picker-rel,
.risk-warning-date-picker .ivu-input-wrapper,
.risk-warning-date-picker .ivu-input {
  width: 16px !important;
  height: 18px !important;
  cursor: pointer;
}

/* 列表单独滚动，保证标题和筛选栏始终固定。 */
.risk-warning-list {
  flex: 1;
  min-height: 0;
  margin-top: 16px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(73, 128, 255, 0.35) transparent;
}

.risk-warning-list::-webkit-scrollbar {
  width: 4px;
}

.risk-warning-list::-webkit-scrollbar-thumb {
  border-radius: 2px;
  background: rgba(73, 128, 255, 0.35);
}

.risk-warning-list::-webkit-scrollbar-track {
  background: transparent;
}

/* 每一条卡片使用设计稿背景图，最小高度允许文本变化时自然撑开。 */
.risk-warning-item {
  position: relative;
  width: 100%;
  min-height: 113px;
  box-sizing: border-box;
  padding: 16px;
  overflow: hidden;
  background: url('./images/risk-warning-item-bg.png') no-repeat center / 100% 100%;
  color: #999999;
  font-size: 14px;
  cursor: pointer;
}

.risk-warning-item + .risk-warning-item {
  margin-top: 10px;
}

.risk-warning-level-line {
  position: absolute;
  top: 20px;
  left: 0;
  width: 3px;
  height: 16px;
}

.risk-warning-item-title {
  overflow: hidden;
  color: #333333;
  font-size: 16px;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-warning-item-meta {
  display: flex;
  align-items: center;
  height: 24px;
  margin-top: 8px;
  min-width: 0;
  white-space: nowrap;
}

.risk-warning-level {
  flex: 0 0 auto;
  padding: 2px 10px;
  color: #FFFFFF;
  line-height: 20px;
}

.risk-warning-owner {
  max-width: 52px;
  margin-left: 10px;
  overflow: hidden;
  line-height: 22px;
  text-overflow: ellipsis;
}

.risk-warning-time {
  flex: 1;
  min-width: 0;
  margin-left: 10px;
  overflow: hidden;
  line-height: 22px;
  text-overflow: ellipsis;
}

.risk-warning-status {
  flex: 0 0 auto;
  margin-left: 10px;
  color: #666666;
  line-height: 22px;
}

.risk-warning-category {
  margin-top: 5px;
  overflow: hidden;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-warning-list-tip {
  display: block;
  width: 100%;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #999999;
  font-family: inherit;
  font-size: 12px;
  line-height: 32px;
  text-align: center;
}

.risk-warning-empty {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  background: transparent;
  color: #999999;
  font-family: inherit;
  font-size: 14px;
}

.risk-warning-empty .ivu-icon {
  color: #A8AFBA;
  font-size: 30px;
}

.risk-warning-list-tip.retry,
.risk-warning-empty.retry {
  color: #4980FF;
  cursor: pointer;
}

/* 收起按钮与展开按钮均通过背景图实现，过渡只改变透明度和水平位移。 */
.risk-warning-expand {
  position: absolute;
  top: 45%;
  right: 0;
  width: 34px;
  height: 100px;
  padding: 0;
  border: 0;
  background: url('./images/risk-warning-hidden-box-bg.png') no-repeat center / 100% 100%;
  pointer-events: auto;
  cursor: pointer;
}

.risk-warning-slide-enter-active,
.risk-warning-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.risk-warning-slide-enter,
.risk-warning-slide-leave-to {
  opacity: 0;
  transform: translateX(32px);
}
</style>
