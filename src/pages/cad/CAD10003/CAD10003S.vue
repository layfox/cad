<template>
  <div id="CAD10003S">
    <!-- 顶部：标题 + 添加按钮 -->
    <div class="c3-topbar">
      <span class="c3-title">图纸配置管理</span>
      <Button type="primary" icon="md-add" @click="onAdd">添加</Button>
    </div>
    <div class="page-main">
    <!-- 搜索栏 -->
     <div class="c3-search-bar">
      <Input placeholder="请输入" suffix="ios-search" v-model="searchText" @input="onSearch"></Input>
     </div>
    <!-- <div class="c3-search-bar">
      <div class="filter-container">
      <div class="c3-search-item">
        <span class="c3-label">配置编号：</span>
        <Input class="c3-input" v-model="form.TZPZ_ID" placeholder="请输入" clearable style="width:160px" />
      </div>
      <div class="c3-search-item">
        <span class="c3-label">配置人员：</span>
        <Input class="c3-input" v-model="form.TZPZ_USR" placeholder="请输入" clearable style="width:160px" />
      </div>
      <div class="c3-search-item">
        <span class="c3-label">图纸版本：</span>
        <Input class="c3-input" v-model="form.TZ_VERSION" placeholder="请输入" clearable style="width:160px" />
      </div>
      <div class="c3-search-item">
        <span class="c3-label">配置状态：</span>
        <Select class="c3-input" v-model="form.TZPZ_STA" placeholder="请选择" clearable style="width:140px">
          <Option value="01">待解析</Option>
          <Option value="02">待绑定</Option>
          <Option value="03">待发布</Option>
          <Option value="04">发布</Option>
        </Select>
      </div>
    </div>
      <div class="c3-search-actions">
        <Button @click="onReset">重置</Button>
        <Button type="primary" @click="onSearch">查询</Button>
      </div>
    </div> -->

    <!-- 表格 -->
    <div class="c3-table-box">
      <Table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        :border="false"
        class="c3-table"
        size="small"
        no-data-text=""
        highlight-row
        @on-select="onRowSelect"
        @on-select-all="onRowSelectAll"
      />
      <Page
          :total="total"
          :page-size="pageSize"
          :current="pageNum"
          show-easy-prev
          show-easy-next
          class="c3-page"
          show-total
          @on-change="onPageChange"
          @on-page-size-change="onPageSizeChange"
        />
    </div>

    <!-- 底部操作栏 + 分页 -->
    <!-- <div class="c3-footer">
      <div class="c3-footer-left">
        <span class="c3-selected-count">已选 {{ selectedCount }} 条</span>
        <Button size="small" :disabled="selectedCount === 0" @click="onBatchDelete">删除</Button>
        <Button size="small" @click="onExport">导出</Button>
      </div>
      <div class="c3-footer-right">
        
      </div>
    </div> -->
    </div>
    <!-- 详情弹窗 -->
    <Modal
      v-model="showDetail"
      title="图纸配置详情"
      :width="560"
      :mask-closable="false"
      class-name="c3-detail-modal"
    >
      <DetailModal v-if="showDetail" :info="currentDetail" />
      <div slot="footer">
        <Button @click="showDetail = false">关闭</Button>
      </div>
    </Modal>

    <!-- 删除确认 -->
    <Modal
      v-model="showDeleteConfirm"
      title="确认删除"
      :width="400"
      :mask-closable="false"
    >
      <p>确定要删除选中的 {{ deleteTargetCount }} 条图纸配置吗？删除后不可恢复。</p>
      <div slot="footer">
        <Button @click="showDeleteConfirm = false">取消</Button>
        <Button type="error" :loading="deleteLoading" @click="confirmDelete">删除</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import DetailModal from './dialog/DetailModal.vue'

export default {
  name: 'CAD10003List',
  components: { DetailModal },
  data() {
    return {
      form: { TZPZ_ID: '', TZPZ_USR: '', TZ_VERSION: '', TZPZ_STA: '' },
      tableData: [],
      loading: false,
      deleteLoading: false,
      pageNum: 1,
      pageSize: 10,
      total: 0,
      selectedRows: [],
      showDetail: false,
      showDeleteConfirm: false,
      currentDetail: {},
      deleteTargetCount: 0,
      searchText: ''
    }
  },
  computed: {
    selectedCount() {
      return this.selectedRows.length
    },
    columns() {
      const self = this
      return [
        // { type: 'selection', align: 'center', width: 60, fixed: 'left' },
        { title: '序号', key: 'index', width: 80, align: 'center', render: (h, { index }) => h('span', (this.pageNum - 1) * this.pageSize + index + 1) },
        { title: '配置编号', align: 'center',  key: 'TZPZ_ID', minWidth: 200 },
        { title: '图纸信息名称', align: 'center',  key: 'TZXX_NAM', minWidth: 220 },
        { title: '配置人员', align: 'center',  key: 'TZPZ_USR', minWidth: 120 },
        { title: '图纸版本', align: 'center',  key: 'TZ_VERSION', minWidth: 120 },
        {
          title: '配置状态',
          key: 'TZPZ_STA',
          width: 120,
          align: 'center',
          render: (h, { row }) => {
            const colorMap = { '01': '#faad14', '02': '#1764e8', '03': '#722ed1', '04': '#52c41a' }
            const bgMap = { '01': '#fff7e6', '02': '#e6f4ff', '03': '#f9f0ff', '04': '#f6ffed' }
            return h('span', {
              style: {
                display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                fontSize: '12px',
                color: colorMap[row.TZPZ_STA] || '#333',
                background: bgMap[row.TZPZ_STA] || '#f5f5f5',
                border: '1px solid ' + (colorMap[row.TZPZ_STA] || '#d9d9d9') + '40'
              }
            }, row.TZPZ_STA_NAM)
          }
        },
        { title: '配置日期', key: 'TZPZ_DAT', width: 140 },
        {
          title: '操作',
          key: 'action',
          width: 120,
          align: 'center',
          fixed: 'right',
          render: (h, { row }) => h('div', [
            h('a', { style: { marginRight: '12px', cursor: 'pointer', color: '#1764e8' }, on: { click: () => self.onDetail(row) } }, '查看'),
            // h('a', { style: { marginRight: '12px', cursor: 'pointer', color: '#1764e8' }, on: { click: () => self.onEdit(row) } }, '编辑'),
            h('a', { style: { cursor: 'pointer', color: '#ff4d4f' }, on: { click: () => self.onDelete(row) } }, '删除')
          ])
        }
      ]
    }
  },
  mounted() {
    this.fetchData()
    const params = new URLSearchParams(location.search)
    this.orgNo = params.get('orgNo')
  },
  methods: {
    onSearch() {
      this.pageNum = 1;
      this.fetchData()
    },
    async postData(url, data) {
      data.param_orgNo = this.orgNo
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return res.json()
    },
    async fetchData() {
      this.loading = true
      try {
        const res = await this.postData('/api/scaqyzt/getTzpzList', {
          pageSize: String(this.pageSize),
          pageNum: String(this.pageNum),
          searchText: this.searchText
        })
        const body = res.data
        if (body && body.data) {
          this.tableData = body.data
          const pg = body.pageInfo || {}
          this.total = pg.totalCount || 0
        } else {
          this.tableData = []
          this.total = 0
        }
      } catch (e) {
        console.error('获取图纸配置列表失败:', e)
        this.$Message.error('获取列表失败')
      } finally {
        this.loading = false
      }
    },
    onSearch() {
      this.pageNum = 1
      this.fetchData()
    },
    onReset() {
      this.form = { TZPZ_ID: '', TZPZ_USR: '', TZ_VERSION: '', TZPZ_STA: '' }
      this.pageNum = 1
      this.fetchData()
    },
    onPageChange(page) {
      this.pageNum = page
      this.fetchData()
    },
    onPageSizeChange(size) {
      this.pageSize = size
      this.pageNum = 1
      this.fetchData()
    },
    onRowSelect(selection, row) {
      this.selectedRows = selection
    },
    onRowSelectAll(selection) {
      this.selectedRows = selection
    },
    onDetail(row) {
      if (parent && parent.detailTzpz) {
        parent.detailTzpz(row)
      }
    },
    onEdit(row) {
      if (parent && parent.detailTzpz) {
        parent.detailTzpz(row)
      }
    },
    onDelete(row) {
      if (row.TZPZ_STA && row.TZPZ_STA != '01') {
        this.$Message.error('只能删除未解析的配置图纸')
        return
      }
      this.deleteTargetCount = 1
      this.currentDetail = row
      this.showDeleteConfirm = true
    },
    onBatchDelete() {
      if (this.selectedCount === 0) return
      this.deleteTargetCount = this.selectedCount
      this.showDeleteConfirm = true
    },
    async confirmDelete() {
      this.deleteLoading = true
      try {
        const targets = this.deleteTargetCount === 1
          ? [this.currentDetail.TZPZ_NO]
          : this.selectedRows.map(r => r.TZPZ_NO)
        for (const no of targets) {
          await this.postData('/api/scaqyzt/deleteTzpz', { TZPZ_NO: no })
        }
        this.$Message.success('删除成功')
        this.showDeleteConfirm = false
        this.selectedRows = []
        this.fetchData()
      } catch (e) {
        console.error('删除失败:', e)
        this.$Message.error('删除失败')
      } finally {
        this.deleteLoading = false
      }
    },
    onExport() {
      this.$Message.info('导出功能待接入')
    },
    onAdd() {
      if (parent && parent.addTzpz) {
        parent.addTzpz()
      }
    }
  }
}
</script>

<style scoped>
#CAD10003S {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

/* ===== 顶部栏 ===== */
.c3-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
    height: 64px;
    padding: 0 16px;
    position: relative;
    -webkit-box-shadow: 0 4px 5px rgba(0, 0, 0, .05);
    box-shadow: 0 4px 5px rgba(0, 0, 0, .05);
    z-index: 99999;
    background-color: var(--sui-primary-bgcolor, #FFF);
}

.c3-title {
  font-size: 20px;
  color: #1a1a1a;
}

.page-main {
    height: calc(100% - 64px);
    background-color: var(rgba(239, 244, 248, 1));
    padding: 16px;
    overflow: hidden;
    width: 100%;
}
.c3-input {
  flex: 1;
}

/* ===== 搜索栏 ===== */
.c3-search-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background-color: #FFF;
  padding: 16px;
  border-radius: 2px;
  position: relative;
  gap: 24px;
}

.c3-search-bar >>> .ivu-input-wrapper {
  width:320px;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  flex: 1;
}

.c3-search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.c3-label {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
}

.c3-search-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* ===== 表格区 ===== */
.c3-table-box {
    background-color: var(--sui-primary-bgcolor, #FFF);
    height: 100%;
    margin-top: 16px;
    padding: 16px 16px 8px 16px;
}

.c3-table-box >>> .ivu-table-wrapper {
  border-radius: 4px;
  overflow: hidden;
}

.c3-table-box >>> .ivu-table th {
  background: #fafafa !important;
  color: #333;
  font-weight: 700;
  font-size: 14px;
  border-bottom: 1px solid #e8e8e8;
}

.c3-table-box >>> .ivu-table td {
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.c3-table-box >>> .ivu-table-row:hover td {
  background: #f5f7fa !important;
}

.c3-table {
  max-height: calc(100% - 48px);
}

.c3-page {
  margin-top: 16px;
  text-align: right;
}

.c3-page >>> .ivu-page-options-sizer {
  margin-right: 0;
}
.c3-table >>> .ivu-table .ivu-table-tip td {
  background: url('./css/images/no_data.jpg') no-repeat center center;
  background-size: 180px 180px;
}
/* ===== 底部栏 ===== */
.c3-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.c3-footer-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.c3-selected-count {
  font-size: 14px;
  color: #666;
}

.c3-footer-right {
  display: flex;
  align-items: center;
}

.c3-footer-right >>> .ivu-page {
  margin: 0;
}
</style>

<style>
.c3-detail-modal .ivu-modal-body {
  padding: 20px 24px;
}
</style>
