<template>
    <div class="viewer-panel-wrapper">
        <!-- Tab 头部 -->
        <div class="vp-header">
            <div class="vp-tabs">
                <span
                    class="vp-tab-item"
                    :class="{ active: activeTab === 'layer' }"
                    @click="activeTab = 'layer'"
                >
                    图层
                    <span class="vp-tab-count">({{ layerTotal }})</span>
                </span>
                <span
                    class="vp-tab-item"
                    :class="{ active: activeTab === 'point' }"
                    @click="activeTab = 'point'"
                >
                    点位
                    <span class="vp-tab-count">({{ pointTotal }})</span>
                </span>
            </div>
        </div>

        <!-- 列表区域 -->
        <div class="vp-body">
            <!-- 图层列表 -->
            <div v-if="activeTab === 'layer'" class="vp-list">
                <Table
                    :data="layerPageData"
                    :columns="layerColumns"
                    :border="false"
                    size="small"
                    no-data-text="暂无图层数据"
                >
                    <template slot-scope="{ row, $index }" slot="seq">
                        {{ (currentPage - 1) * pageSize + $index + 1 }}
                    </template>
                </Table>
            </div>

            <!-- 点位列表 -->
            <div v-else class="vp-list">
                <Table
                    ref="pointTable"
                    :data="pointPageData"
                    :columns="pointColumns"
                    :border="false"
                    size="small"
                    highlight-row
                    @on-selection-change="onPointSelectionChange"
                    @on-row-click="onPointRowClick"
                    no-data-text="暂无点位数据"
                >
                    <template slot-scope="{ row }" slot="status">
                        <span :class="['vp-status', row.matchStatus === '未匹配' ? 'status-unmatched' : 'status-matched']">
                            {{ row.matchStatus || '匹配' }}
                        </span>
                    </template>
                </Table>
            </div>
        </div>

        <!-- 分页 -->
        <div class="vp-footer">
            <div class="vp-selected-info">
                <!-- <Checkbox v-if="activeTab === 'point'" :indeterminate="isIndeterminate" v-model="checkAll" @on-change="onCheckAllChange">
                    选择
                </Checkbox> -->
                <!-- <span class="vp-selected-count">已选 {{ selectedPoints.length }} 条</span> -->
            </div>
            <Page
                :total="total"
                :page-size="pageSize"
                :current="currentPage"
                show-total
                @on-change="handlePageChange"
                @on-page-size-change="handlePageSizeChange"
            />
        </div>
    </div>
</template>

<script>
export default {
    name: 'ViewerPanel',
    props: {
        layers: {
            type: Array,
            default: () => []
        },
        points: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            panelCollapsed: false,
            activeTab: 'layer',
            // 为每个 Tab 独立维护翻页状态
            layerPage: { current: 1, pageSize: 10 },
            pointPage: { current: 1, pageSize: 10 },
            selectedPoints: [],
            checkAll: false,
            isIndeterminate: false,
            layerColumns: [
                { slot: 'seq', title: '序号', key: 'seq', width: 60, align: 'center', render: (h, { row, index }) => {
                    return h('span', (this.layerPage.current - 1) * this.layerPage.pageSize + index + 1)
                } },
                { title: '图层名称', key: 'name', minWidth: 120 },
                { title: '状态', key: 'status', width: 80, align: 'center', render: (h, { row, index}) => {
                    return h('span', {
                        class: ['vp-status', 'vp-status-clickable', !row.off ? 'status-matched' : 'status-unmatched'],
                        on: {
                            click: () => {
                                this.$emit('toggle-layer', (this.layerPage.current -1) * this.layerPage.pageSize + index + 1, row.off)
                            }
                        }
                    }, row.off ? '隐藏' : '显示')
                }}
            ],
            pointColumns: [
                // { type: 'selection', width: 50, align: 'center' },
                { slot: 'seq', title: '序号', key: 'seq', width: 60, align: 'center', render: (h, { row, index }) => {
                    return h('span', (this.pointPage.current - 1) * this.pointPage.pageSize + index + 1)
                } },
                { title: '图纸点位名称', key: 'pointName', minWidth: 160 },
                { title: '图纸点位编码', key: 'pointCode', width: 130 },
                // { title: 'X 坐标', key: 'x', width: 120, align: 'right',  render: (h, { row, index}) => {
                //     return h('span', {}, row.x ? (+row.x).toFixed(2): '')
                // }},
                // { title: 'Y 坐标', key: 'y', width: 120, align: 'right',  render: (h, { row, index}) => {
                //     return h('span', {}, row.y ? (+row.y).toFixed(2): '')
                // } },
                // { title: '解析方式', key: 'parseMethod', width: 100, align: 'center' },
                // { title: '匹配状态', key: 'status', slot: 'status', width: 100, align: 'center' }
            ]
        }
    },
    computed: {
        layerTotal() {
            return this.layers.length
        },
        pointAuto() {
            return this.points.filter(p => p.parseMethod === '自动解析').length
        },
        pointManual() {
            return this.points.filter(p => p.parseMethod === '人工添加').length
        },
        layerPageData() {
            const start = (this.layerPage.current - 1) * this.layerPage.pageSize
            return this.layers.slice(start, start + this.layerPage.pageSize)
        },
        pointPageData() {
            const start = (this.pointPage.current - 1) * this.pointPage.pageSize
            return this.points.slice(start, start + this.pointPage.pageSize)
        },
        pointTotal() {
            return this.points.length
        },
        // 当前激活 Tab 对应的分页对象，供模板使用
        currentPage() {
            return this.activeTab === 'layer' ? this.layerPage.current : this.pointPage.current
        },
        pageSize() {
            return this.activeTab === 'layer' ? this.layerPage.pageSize : this.pointPage.pageSize
        },
        total() {
            return this.activeTab === 'layer' ? this.layerTotal : this.pointTotal
        }
    },
    watch: {
        layers() {
            this.onDataChange('layer')
        },
        points() {
            this.onDataChange('point')
        },
        activeTab(newTab) {
            // 重置当前 Tab 的选中状态
            if (newTab === 'layer') {
                this.selectedPoints = []
            } else {
                this.selectedPoints = []
                this.checkAll = false
                this.isIndeterminate = false
            }
        },
        checkAll(val) {
            this.isIndeterminate = false
            const pageData = this.activeTab === 'point' ? this.pointPageData : []
            if (val) {
                this.selectedPoints = [...pageData]
            } else {
                this.selectedPoints = []
            }
        }
    },
    created() {
        this.onDataChange('layer')
        this.onDataChange('point')
    },
    methods: {
        onDataChange(tab) {
            // 只重置切换到的 Tab，不干扰另一个 Tab 的翻页状态
            if (tab === 'layer') {
                this.layerPage.current = 1
            } else {
                this.pointPage.current = 1
            }
            this.selectedPoints = []
            this.checkAll = false
            this.isIndeterminate = false
        },
        handlePageChange(page) {
            if (this.activeTab === 'layer') {
                this.layerPage.current = page
            } else {
                this.pointPage.current = page
            }
        },
        handlePageSizeChange(size) {
            if (this.activeTab === 'layer') {
                this.layerPage.pageSize = size
                this.layerPage.current = 1
            } else {
                this.pointPage.pageSize = size
                this.pointPage.current = 1
            }
        },
        onPointSelectionChange(rows) {
            this.selectedPoints = rows || []
            this.checkAll = false
            this.isIndeterminate = false
            const pageData = this.pointPageData
            if (pageData.length > 0 && this.selectedPoints.length === pageData.length) {
                this.checkAll = true
            } else if (this.selectedPoints.length > 0) {
                this.isIndeterminate = true
            }
        },
        onCheckAllChange(val) {
            if (val) {
                this.selectedPoints = [...this.pointPageData]
            } else {
                this.selectedPoints = []
            }
            this.isIndeterminate = false
        },
        onPointRowClick(row) {
            this.$emit('zoom-to-point', row.x, row.y)
        },
        onAddPoint() {
            this.$Message.info('添加点位功能待实现')
        },
        onDeletePoint() {
            if (this.selectedPoints.length === 0) {
                this.$Message.warning('请先选择要删除的点位')
                return
            }
            this.$Modal.confirm({
                title: '确认删除',
                content: `确定删除选中的 ${this.selectedPoints.length} 个点位吗？`,
                onOk: () => {
                    const ids = this.selectedPoints.map(p => p.id || p.handle)
                    this.$emit('delete-points', ids)
                    this.$Message.success(`已删除 ${ids.length} 个点位`)
                    this.selectedPoints = []
                    this.checkAll = false
                    this.isIndeterminate = false
                }
            })
        },
        expand() {
            this.panelCollapsed = false
        }
    }
}
</script>

<style>
.viewer-panel-wrapper {
    
}

/* Tab 头部 */
.vp-header {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 2px;
    background: #EDF0F6;
    border-radius: 4px 4px 4px 4px;
    width: 444px;
    margin-bottom: 24px;
}

.vp-tabs {
    display: flex;
    align-items: center;
}

.vp-tab-item {
    height: 28px;
    line-height: 28px;
    border-radius: 4px 4px 4px 4px;
    color: #666666;
    cursor: pointer;
    font-size: 14px;
    width: 220px;
    text-align: center;
}

.vp-tab-item:hover {
    background: rgba(23, 100, 232, 0.08);
    color: #1764e8;
}

.vp-tab-item.active {
    background: #FFFFFF;
    color: #1764E8;
}

.vp-tab-count {
    font-size: 12px;
    opacity: 0.8;
}

.vp-actions {
    display: flex;
    align-items: center;
    gap: 6px;
}

.vp-actions .ivu-btn {
    height: 26px;
    padding: 0 10px;
    font-size: 12px;
}

.vp-collapse-btn {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    cursor: pointer;
    color: #808695;
    transition: all 0.2s;
}

.vp-collapse-btn:hover {
    background: rgba(23, 100, 232, 0.1);
    color: #1764e8;
}

/* 列表区域 */
.vp-body {
    flex: 1;
    overflow: auto;
    max-height: calc(100% - 104px);
    /* margin-bottom: 16px; */
}

.vp-body .ivu-table-header thead tr th {
    height: 42px;
    padding: 0 8px;
    background: #EEF1F6;
}

.vp-body .ivu-table-body tr td {
    height: 42px;
    padding: 0 8px;
}

.vp-body  .ivu-table-body tr:nth-child(2n + 2) td {
    background: #EEF1F6;
}

.vp-body .ivu-table-cell {
    padding: 0
}

.vp-list {
    height: 100%;
    overflow: auto;
}

/* 分页底部 */
.vp-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding: 16px;
}

.vp-selected-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.vp-selected-count {
    color: #515a6e;
}

/* 状态标签 */
.vp-status {
    font-size: 12px;
    padding: 1px 6px;
    border-radius: 2px;
}

.vp-status.status-matched {
    color: #515a6e;
}

.vp-status.status-unmatched {
    color: #ed4014;
}

.vp-status-clickable {
    cursor: pointer;
    user-select: none;
    transition: opacity 0.2s;
}

.vp-status-clickable:hover {
    opacity: 0.7;
}

/* 颜色圆点 */
.vp-color-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    vertical-align: middle;
}
</style>
