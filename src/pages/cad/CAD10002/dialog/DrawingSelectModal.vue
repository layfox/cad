<template>
  <div class="drawing-select-modal">
    <!-- 头部：标题 + 公司选择 -->
    <div class="dsm-header">
      <div class="dsm-title">
        <span class="dsm-title-icon">≡</span>
        <span class="dsm-title-text">选择图纸</span>
      </div>
      <Select
        v-model="selectedCompany"
        size="small"
        class="dsm-company-select"
        @on-change="onCompanyChange"
      >
        <Option
          v-for="company in companyOptions"
          :key="company"
          :value="company"
        >{{ company }}</Option>
      </Select>
    </div>

    <!-- 搜索框 -->
    <div class="dsm-search">
      <Input
        v-model="searchKeyword"
        size="small"
        placeholder="输入关键字"
        clearable
        class="dsm-search-input"
      />
    </div>

    <!-- 图纸列表 -->
    <div class="dsm-list">
      <Table
        :data="displayDrawings"
        :columns="columns"
        :border="false"
        size="small"
        highlight-row
        @on-selection-change="onSelectionChange"
        @on-row-click="onRowClick"
        no-data-text="暂无数据"
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
      <Button size="large" class="dsm-btn-confirm" @click="onConfirm">确定</Button>
      <Button size="large" class="dsm-btn-cancel" @click="onCancel">取消</Button>
    </div>
  </div>
</template>

<script>
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
      drawings: [
        { id: '1', name: '图纸1', code: 'XJH-SWJC-30', number: '0002' },
        { id: '2', name: '图纸2', code: 'XJH-SWJC-32', number: '0001' },
        { id: '3', name: '图纸3', code: 'XJH-SWJC-23', number: '0012' },
        { id: '4', name: '图纸4', code: 'XJH-SWJC-22', number: '0003' },
        { id: '5', name: '图纸5', code: 'XJH-SWJC-11', number: '0005' }
      ]
    }
  },
  computed: {
    filteredDrawings() {
      if (!this.searchKeyword.trim()) return this.drawings
      const kw = this.searchKeyword.trim().toLowerCase()
      return this.drawings.filter(d =>
        d.name.toLowerCase().includes(kw) ||
        d.code.toLowerCase().includes(kw) ||
        d.number.toLowerCase().includes(kw)
      )
    },
    displayDrawings() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredDrawings.slice(start, start + this.pageSize)
    },
    total() {
      return this.filteredDrawings.length
    },
    columns() {
      return [
        { type: 'selection', width: 45, align: 'center' },
        { title: '名称', key: 'name', width: 120 },
        { title: '编码', key: 'code', minWidth: 140 },
        { title: '编号', key: 'number', width: 80, align: 'center' }
      ]
    }
  },
  watch: {
    company(val) {
      this.selectedCompany = val
    }
  },
  methods: {
    onCompanyChange() {
      // 切换公司时重置搜索和分页
      this.searchKeyword = ''
      this.currentPage = 1
      this.selectedDrawings = []
      this.$emit('company-change', this.selectedCompany)
    },
    onSelectionChange(rows) {
      this.selectedDrawings = rows
    },
    onRowClick(row) {
      // 行点击时同步 selection
      this.$refs.drawingTable.clearSelection()
      this.$refs.drawingTable.toggleRowSelection(row)
      this.selectedDrawings = [row]
    },
    onPageChange(page) {
      this.currentPage = page
      this.selectedDrawings = []
    },
    onPageSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.selectedDrawings = []
    },
    onConfirm() {
      if (this.selectedDrawings.length === 0) {
        this.$Message.warning('请选择图纸')
        return
      }
      this.$emit('confirm', this.selectedDrawings[0])
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
  padding: 14px 20px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.dsm-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsm-title-icon {
  font-size: 18px;
  color: #1764e8;
  line-height: 1;
}

.dsm-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1764e8;
}

.dsm-company-select {
  width: 120px;
}

/* ===== 搜索 ===== */
.dsm-search {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.dsm-search-input {
  width: 100%;
}

/* ===== 列表 ===== */
.dsm-list {
  flex: 1;
  overflow: hidden;
  padding: 8px 20px;
  min-height: 0;
}

.dsm-list >>> .ivu-table-wrapper {
  border: none;
}

.dsm-list >>> .ivu-table-header thead tr th {
  height: 40px;
  padding: 0 12px;
  background: #f5f7fa;
  font-size: 13px;
  color: #666;
  border: none;
}

.dsm-list >>> .ivu-table-body tr td {
  height: 40px;
  padding: 0 12px;
  font-size: 13px;
  color: #333;
  border: none;
  cursor: pointer;
}

.dsm-list >>> .ivu-table-cell {
  padding: 0 12px;
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
  justify-content: center;
  padding: 10px 20px;
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
  justify-content: center;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.dsm-btn-confirm {
  min-width: 100px;
  background: linear-gradient(135deg, #d6f0ff 0%, #b8e0ff 100%);
  border-color: #8ec5ff;
  color: #1764e8;
  font-weight: 500;
}

.dsm-btn-confirm:hover {
  background: linear-gradient(135deg, #b8e0ff 0%, #9dd0ff 100%);
  border-color: #6bb5ff;
  color: #0f52cc;
}

.dsm-btn-cancel {
  min-width: 100px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f6 100%);
  border-color: #c5c5c5;
  color: #666;
}

.dsm-btn-cancel:hover {
  background: linear-gradient(135deg, #eef1f6 0%, #e0e4ea 100%);
  border-color: #a8a8a8;
  color: #444;
}
</style>

<style>
.drawing-select-modal-wrapper .ivu-modal-body {
  padding: 0;
}
</style>
