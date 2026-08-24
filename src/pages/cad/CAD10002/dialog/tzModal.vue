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
        :data="displayDrawings"
        :columns="columns"
        :border="false"
        size="small"
        highlight-row
        @on-selection-change="onSelectionChange"
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
      drawings: []
    }
  },
  computed: {
    filteredDrawings() {
      if (!this.searchKeyword.trim()) return this.drawings
      const kw = this.searchKeyword.trim().toLowerCase()
      return this.drawings.filter(d =>
        d.TZLX_NAM.toLowerCase().includes(kw)
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
        { title: '图纸类型名称', key: 'TZLX_NAM', minWidth: 180 },
        { title: '图纸信息编号', key: 'TZXX_ID', minWidth: 120 },
        { title: '图纸版本号', key: 'TZ_VERSION', minWidth: 120, align: 'center' }
      ]
    }
  },
  watch: {
    company(val) {
      this.selectedCompany = val
    }
  },
  mounted() {
    this.postData('/api/scaqyzt/getTzpzList', {
      "pageSize": "1000",
      "pageNum": "1",
      param_orgNo: this.orgNo
    }).then(data => {
      this.drawings = data.data.data.filter(item => item.TZPZ_STA=='04')
    })
  },
  methods: {
    async postData(url = "", data = {}) {
        const response = await fetch(url, {
            method: "POST",

            body: JSON.stringify(data),
        });
        return response.json();
    },
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

.dsm-list >>> .ivu-table-cell {
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
