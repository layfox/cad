<template>
  <div class="point-select-modal">
    <!-- 头部 -->
    <div class="psm-header">
      <div class="psm-title">
        <img src="../css/images/modal-icon.png" alt="">
        <span class="psm-title-text">选择测点</span>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="psm-search">
      <Input
        v-model="searchText"
        placeholder="输入测点名称搜索"
        clearable
        class="psm-search-input"
        @on-enter="onSearch"
        @on-clear="onSearch"
      />
    </div>

    <!-- 测点列表 -->
    <div class="psm-list">
      <Table
        ref="pointTable"
        :data="pageData"
        :columns="columns"
        :border="false"
        highlight-row
        @on-select="onSelect"
        @on-select-cancel="onSelectCancel"
        @on-select-all="onSelectAll"
        @on-select-all-cancel="onSelectAllCancel"
      />
    </div>

    <!-- 分页 -->
    <div class="psm-pagination">
      <span class="psm-selected-count">
        已选 {{ selectedPoints.length }} 条
      </span>
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
    <div class="psm-footer">
      <Button type="primary" class="psm-btn-confirm" @click="onConfirm">确定</Button>
      <Button class="psm-btn-cancel" @click="onCancel">取消</Button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PointSelectModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchText: '', // 传给后端的搜索字段
      currentPage: 1,
      pageSize: 10,
      total: 0,
      pageData: [],
      selectedPoints: [],
      loading: false,
      orgNo: ''
    }
  },
  computed: {
    columns() {
      return [
        { type: 'selection', width: 60, align: 'center' },
        { title: '测点名称', key: 'PT_NAM', minWidth: 180},
        { title: '测点编码', key: 'PT_NO', minWidth: 180 },
        { title: '测点类型', key: 'LOT_TYPE_NAM', width: 120, align: 'center' },
        { title: '公司', key: 'LOT_DOMAIN', width: 100, align: 'center' },
      ]
    }
  },
  watch: {
    visible(val) {
      if (val) {
        // 弹窗打开重置状态
        this.currentPage = 1
        this.searchText = ''
        this.selectedPoints = []
        this.fetchData()
      }
    }
  },
  mounted() {
    const params = new URLSearchParams(location.search)
    this.orgNo = params.get('orgNo')
  },
  methods: {
    async postData(url = '', data = {}) {
      data.param_orgNo = this.orgNo
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response.json()
    },
    // 请求后端分页接口，携带searchText
    async fetchData() {
      this.loading = true
      try {
        
        const res = await this.postData('/api/scaqyzt/getIotSelect', {
          pageSize: String(this.pageSize),
          pageNum: String(this.currentPage),
          searchText: this.searchText?.trim() || ''
        })
        if (res.success && res.data) {
          const list = res.data.data || []
          this.total = res.data.pageInfo ? res.data.pageInfo.totalCount : list.length
          // 自动绑定 _isChecked，翻页自动回显勾选
          this.pageData = list.map(item => ({
            ...item,
            _isChecked: this.selectedPoints.some(p => p.PT_ID === item.PT_ID)
          }))
        }
      } finally {
        this.loading = false
      }
    },
    // 搜索触发：重置到第一页，请求后端
    onSearch() {
      this.currentPage = 1
      this.fetchData()
    },
    // 切换页码
    onPageChange(page) {
      this.currentPage = page
      this.fetchData()
    },
    // 修改每页条数
    onPageSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.fetchData()
    },
    // iview3 @on-select(selection, row)
    onSelect(selection, row) {
      const idx = this.selectedPoints.findIndex(p => p.PT_ID === row.PT_ID)
      if (idx === -1) {
        this.selectedPoints.push(row)
      }
    },
    onSelectCancel(selection, row) {
      const idx = this.selectedPoints.findIndex(p => p.PT_ID === row.PT_ID)
      if (idx > -1) {
        this.selectedPoints.splice(idx, 1)
      }
    },
    onSelectAll(selection) {
      this.pageData.forEach(row => {
        const idx = this.selectedPoints.findIndex(p => p.PT_ID === row.PT_ID)
        if (idx === -1) {
          this.selectedPoints.push(row)
        }
      })
    },
    onSelectAllCancel(selection) {
      this.pageData.forEach(row => {
        const idx = this.selectedPoints.findIndex(p => p.PT_ID === row.PT_ID)
        if (idx > -1) {
          this.selectedPoints.splice(idx, 1)
        }
      })
    },
    onConfirm() {
      if (this.selectedPoints.length === 0) {
        this.$Message.warning('请选择至少一个测点')
        return
      }
      console.log(this.selectedPoints, 1111)
      this.$emit('confirm', this.selectedPoints)
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
.point-select-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 14px;
}

/* ===== 头部 ===== */
.psm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.psm-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #333333;
  gap: 6px;
}

.psm-selected-count {
  font-size: 14px;
  color: #333;
  padding: 2px 8px;
  border-radius: 10px;
}

/* ===== 搜索 ===== */
.psm-search {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px;
  flex-shrink: 0;
}

.psm-search-input {
  width: 320px;
}

/* ===== 列表 ===== */
.psm-list {
  flex: 1;
  overflow: hidden;
  padding: 0 16px;
  min-height: 0;
}

.psm-list >>> .ivu-table-wrapper {
  border: none;
}

.psm-list >>> .ivu-table-header thead tr th {
  height: 42px;
  padding: 0 8px;
  background: #EEF1F6;
  font-size: 14px;
  color: #515a6e;
  border: none;
}

.psm-list >>> .ivu-table-cell {
  padding: 0;
}

.psm-list >>> .ivu-table-body tr td {
  height: 42px;
  padding: 0 8px;
  font-size: 14px;
  color: #333;
  border: none;
}

.psm-list >>> .ivu-table:before,
.psm-list >>> .ivu-table:after {
  display: none;
}

.psm-list >>> .ivu-table-border td,
.psm-list >>> .ivu-table-border th {
  border: none;
}

.psm-list >>> .ivu-table .ivu-table-row:nth-child(odd) td {
  background: #fff;
}

.psm-list >>> .ivu-table .ivu-table-row:nth-child(even) td {
  background: #f8fafc;
}

.psm-list >>> .ivu-table .ivu-table-row:hover td {
  background: #e6f4ff !important;
}

.psm-list >>> .ivu-table .ivu-table-row.ivu-table-row-selected td {
  background: #e6f4ff !important;
}

.psm-list >>> .ivu-table {
  border: none;
}

/* ===== 分页 ===== */
.psm-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  flex-shrink: 0;
}

.psm-pagination >>> .ivu-page {
  margin: 0;
}

.psm-pagination >>> .ivu-page-item {
  min-width: 28px;
  height: 28px;
  line-height: 26px;
}

/* ===== 底部按钮 ===== */
.psm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}
</style>

<style>
.point-select-modal-wrapper .ivu-modal-body {
  padding: 0;
}
</style>
