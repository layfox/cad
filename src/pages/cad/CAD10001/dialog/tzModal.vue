<template>
  <div class="drawing-select-modal">
    <!-- 头部：标题 + 公司选择 -->
    <div class="dsm-header">
      <div class="dsm-title">
        <img src="../css/images/modal-icon.png" alt="">
        <span class="dsm-title-text">选择图纸</span>
      </div>
    </div>
    <!-- 搜索框 -->
    <div class="dsm-search" style="justify-content: flex-end;">
      <Input
        v-model="searchKeyword"
        placeholder="输入关键字"
        clearable
        class="dsm-search-input"
      />
    </div>
    <!-- 图纸列表 -->
    <div class="dsm-list">
      <Table
        ref="drawingTable"
        :data="displayDrawings"
        :columns="columns"
        :border="false"
        size="small"
        highlight-row
        :loading="tableLoading"
        @on-selection-change="onSelectionChange"
        @on-row-click="onRowClick"
      />
    </div>
    <!-- 分页 -->
    <div class="dsm-pagination">
      <Page
        :total="total"
        :page-size="pageSize"
        :current="currentPage"
        show-easy-prev
        show-easy-next
        show-sizer
        :page-size-opts="[10, 20, 50]"
        @on-change="onPageChange"
        @on-page-size-change="onPageSizeChange"
      />
    </div>
    <!-- 底部按钮 -->
    <div class="dsm-footer">
      <Button type="primary" class="dsm-btn-confirm" @click="onConfirm">确定</Button>
      <Button class="dsm-btn-cancel" @click="onCancel">取消</Button>
    </div>
  </div>
</template>
<script>
// 防抖工具
// 防抖工具
function debounce(fn, delay = 350) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// ========== Mock 开关：true=用本地假数据，false=走真实接口 ==========
const USE_MOCK = false

// ========== Mock 原始数据（35条，覆盖多页） ==========
const MOCK_DRAWINGS = (function () {
  const types = ['工艺流程图', '设备布置图', '电气原理图', '管道仪表图', '土建结构图', '给排水图', '通风空调图', '消防系统图']
  const list = []
  for (let i = 1; i <= 35; i++) {
    list.push({
      TZLX_NAM: types[i % types.length] + '-' + String(i).padStart(3, '0'),
      TZXX_ID: 'TZ' + (20240000 + i),
      TZ_VERSION: 'V' + ((i % 3) + 1) + '.0',
      ZT_DAT: '2024-' + String(((i - 1) % 12) + 1).padStart(2, '0') + '-' + String(((i * 3) % 28) + 1).padStart(2, '0'),
      // 额外字段，真实接口可能有，mock 里带上方便调试
      orgNo: i <= 20 ? 'XJH' : 'XJW',
      company: i <= 20 ? '小纪汗' : '肖家洼'
    })
  }
  return list
})()

export default {
  name: 'DrawingSelectModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    company: {
      type: String,
      default: '小纪汗'
    },
    orgNo: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      selectedCompany: '小纪汗',
      searchKeyword: '',
      currentPage: 1,
      pageSize: 10,
      selectedDrawings: [],
      companyOptions: ['小纪汗', '肖家洼'],
      displayDrawings: [],
      total: 0,
      tableLoading: false
    }
  },
  computed: {
    columns() {
      return [
        { type: 'selection', width: 45, align: 'center' },
        { title: '图纸类型名称', key: 'TZLX_NAM', minWidth: 180 },
        { title: '图纸信息编号', key: 'TZXX_ID', minWidth: 120 },
        { title: '图纸版本号', key: 'TZ_VERSION', minWidth: 120, align: 'center' },
        { title: '制图日期', key: 'ZT_DAT', minWidth: 120, align: 'center' }
      ]
    }
  },
  watch: {
    company(val) {
      this.selectedCompany = val
    },
    visible(val) {
      if (val) {
        this.searchKeyword = ''
        this.currentPage = 1
        this.selectedDrawings = []
        this.clearTableSelection()
        this.fetchDrawingList()
      }
    },
    // 监听搜索框，防抖请求
    searchKeyword: debounce(function () {
      if (this.visible) {
        this.currentPage = 1
        this.clearTableSelection()
        this.fetchDrawingList()
      }
    })
  },
  mounted() {
  },
  methods: {
    // ========== iview3.5.4 兼容：清空表格选中 ==========
    clearTableSelection() {
      
    },

    // ========== 请求图纸列表（Mock / 真实接口二选一） ==========
    async fetchDrawingList() {
      this.tableLoading = true

      // ---- Mock 分支 ----
      if (USE_MOCK) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 300))

        const keyword = (this.searchKeyword || '').trim().toLowerCase()
        // 1. 关键字过滤（模拟后端按 图纸类型名称 / 图纸信息编号 模糊搜索）
        let filtered = MOCK_DRAWINGS.filter(item => {
          if (!keyword) return true
          return (
            String(item.TZLX_NAM).toLowerCase().includes(keyword) ||
            String(item.TZXX_ID).toLowerCase().includes(keyword)
          )
        })
        // 2. 按 orgNo 过滤（如果传了）
        if (this.orgNo) {
          filtered = filtered.filter(item => item.orgNo === this.orgNo)
        }

        const total = filtered.length
        // 3. 分页切片
        const start = (this.currentPage - 1) * this.pageSize
        const pageData = filtered.slice(start, start + this.pageSize)

        this.displayDrawings = pageData
        this.total = total
        this.tableLoading = false
        return
      }

      // ---- 真实接口分支 ----
      const params = {
        pageNum: String(this.currentPage),
        pageSize: String(this.pageSize),
        searchText: this.searchKeyword?.trim() || '',
        param_orgNo: this.orgNo || ''
      }
      try {
        const res = await this.postData('/api/scaqyzt/getTzxx', params)
        if (res.success && res.data) {
          this.displayDrawings = res.data.data || []
          this.total = res.data.pageInfo?.totalCount || 0
          this.selectedDrawings = []
          this.clearTableSelection()
        } else {
          this.displayDrawings = []
          this.total = 0
        }
      } catch (err) {
        this.$Message.error('图纸列表请求失败')
        console.error(err)
      } finally {
        this.tableLoading = false
      }
    },

    async postData(url = "", data = {}) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    onCompanyChange() {
      this.searchKeyword = ''
      this.currentPage = 1
      this.selectedDrawings = []
      this.clearTableSelection()
      this.$emit('company-change', this.selectedCompany)
      this.fetchDrawingList()
    },

    onSelectionChange(rows) {
      // 单选业务：超过1条时只保留最后一条
        this.selectedDrawings = rows
    },

    onRowClick(row) {
      this.selectedDrawings = [row]
    },

    onPageChange(page) {
      this.currentPage = page
      this.fetchDrawingList()
    },

    onPageSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.fetchDrawingList()
    },

    onConfirm() {
      if (this.selectedDrawings.length !== 1) {
        this.$Message.warning('请选择一张图纸')
        return
      }
      this.$emit('confirm', this.selectedDrawings[0])
      this.onCancel()
    },

    onCancel() {
      this.$emit('update:visible', false)
      this.$emit('close')
    }
  }
}

</script>
<style scoped>
.drawing-select-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 14px;
}
/* ===== 头部 ===== */
.dsm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.dsm-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #333333;
  gap: 6px;
}
.dsm-title-icon {
  font-size: 18px;
  color: #1764e8;
  line-height: 1;
}
.dsm-company-select {
  width: 120px;
}
/* ===== 搜索 ===== */
.dsm-search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  flex-shrink: 0;
}
.dsm-search-input {
  width: 320px;
}
/* ===== 列表 ===== */
.dsm-list {
  flex: 1;
  overflow: hidden;
  padding: 0 16px;
  min-height: 0;
}
.dsm-list >>> .ivu-table-wrapper {
  border: none;
}
.dsm-list >>> .ivu-table-header thead tr th {
  height: 42px;
  padding: 0 8px;
  background: #EEF1F6;
  font-size: 14px;
  color: #515a6e;
  border: none;
}
.dsm-list >>> .ivu-table-body tr td {
  height: 42px;
  padding: 0 8px;
  font-size: 14px;
  color: #333;
  border: none;
}
.dsm-list >>> .ivu-table:before,
.dsm-list >>> .ivu-table:after {
  display: none;
}
.dsm-list >>> .ivu-table-border td,
.dsm-list >>> .ivu-table-border th {
  border: none;
}
.dsm-list >>> .ivu-table .ivu-table-row:nth-child(odd) td {
  background: #fff;
}
.dsm-list >>> .ivu-table .ivu-table-row:nth-child(even) td {
  background: #f8fafc;
}
.dsm-list >>> .ivu-table .ivu-table-row:hover td {
  background: #e6f4ff !important;
}
.dsm-list >>> .ivu-table .ivu-table-row.ivu-table-row-selected td {
  background: #e6f4ff !important;
}
.dsm-list >>> .ivu-table {
  border: none;
}
.dsm-list >>> .ivu-table-bordered:before,
.dsm-list >>> .ivu-table-bordered:after {
  display: none;
}
/* ===== 分页 ===== */
.dsm-pagination {
  display: flex;
  align-items: center;
  justify-content: right;
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.dsm-pagination >>> .ivu-page {
  margin: 0;
}
.dsm-pagination >>> .ivu-page-item {
  min-width: 28px;
  height: 28px;
  line-height: 26px;
}
/* ===== 底部按钮 ===== */
.dsm-footer {
  display: flex;
  align-items: center;
  justify-content: right;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}
</style>
<style>
.drawing-select-modal-wrapper .ivu-modal-body {
  padding: 0;
}
</style>
