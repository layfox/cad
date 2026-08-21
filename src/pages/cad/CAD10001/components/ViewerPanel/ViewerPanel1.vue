<template>
    <div class="viewer-panel-wrapper">
        <!-- 工具栏 -->
        <div class="vp-toolbar">
            <Button type="primary" size="large" ghost><img src="../../css/images/icon1.png" alt="">添加测点</Button>
            <span class="vp-toolbar-label">坐标匹配容差</span>
            <InputNumber v-model="tolerance" :min="0" :precision="2" style="width: 80px" />
            <Button type="primary" ghost><img src="../../css/images/icon2.png" alt="">自动绑定</Button>
            <Button type="primary" ghost><img src="../../css/images/icon3.png" alt="">人工绑定</Button>
            <Button type="primary" ghost><img src="../../css/images/icon4.png" alt="">自动布点</Button>
            <Button type="primary" ghost><img src="../../css/images/icon4.png" alt="">人工布点</Button>
            <Button type="primary" ghost><img src="../../css/images/icon5.png" alt="">解除匹配</Button>
            <Button type="primary" ghost @click="onDeletePoints(selectedPoints)"><img src="../../css/images/icon6.png" alt="">删除测点</Button>
        </div>

        <!-- 统计栏 -->
        <div class="vp-summary">
            <div class="vp-summary-item">
                <div class="vp-summary-label">总测点</div>
                <div class="vp-summary-num">{{ summaryData.total }}</div>
            </div>
            <div class="vp-summary-divider"></div>
            <div class="vp-summary-item">
                <div class="vp-summary-label">无坐标测点</div>
                <div class="vp-summary-num vp-summary-num-red">{{ summaryData.noCoord }}</div>
             </div>
            <div class="vp-summary-divider"></div>
            <div class="vp-summary-item">
                <div class="vp-summary-label">已匹配测点</div>
                <div class="vp-summary-num vp-summary-num-green">{{ summaryData.matched }}</div>
                
            </div>
            <div class="vp-summary-divider"></div>
            <div class="vp-summary-item">
                <div class="vp-summary-label">未匹配测点</div>
                <div class="vp-summary-num vp-summary-num-orange">{{ summaryData.unmatched }}</div>
            </div>
            <div class="vp-summary-divider"></div>
            <div class="vp-summary-item">
                <div class="vp-summary-label">总点位</div>
                <div class="vp-summary-num vp-summary-num-orange">{{ summaryData.totalPoints }}</div>
            </div>
            <div class="vp-summary-divider"></div>
            <div class="vp-summary-item">
                <div class="vp-summary-label">已使用</div>
                <div class="vp-summary-num vp-summary-num-blue">{{ summaryData.used }}</div>
            </div> 
        </div>

        <!-- 表格 -->
        <div class="vp-body">
            <Table
                ref="pointTable"
                :data="pointPageDataWithSeq"
                :columns="pointColumns"
                :border="false"
                size="small"
                highlight-row
                @on-selection-change="onPointSelectionChange"
                @on-row-click="onPointRowClick"
                no-data-text="暂无点位数据"
            >
                <template slot-scope="{ row }" slot="coordStatus">
                    <span :class="row.coordValue === '无坐标' ? 'vp-no-coord' : ''">
                        {{ row.coordValue || '无坐标' }}
                    </span>
                </template>
                <template slot-scope="{ row }" slot="matchStatus">
                    <span :class="['vp-match-status', row.matchStatus === '未匹配' ? 'status-unmatched' : 'status-matched']">
                        {{ row.matchStatus || '匹配' }}
                    </span>
                </template>
            </Table>
        </div>

        <!-- 分页 -->
        <div class="vp-footer">
            <div class="vp-selected-info">
                <!-- <Checkbox :indeterminate="isIndeterminate" v-model="checkAll" @on-change="onCheckAllChange">
                    选择
                </Checkbox> -->
                <span class="vp-selected-count">已选 {{ selectedPoints.length }} 条</span>
            </div>
            <div class="vp-pagination">
                <span class="vp-total">共 {{ total }} 条</span>
                <Page
                    :total="total"
                    :page-size="pageSize"
                    :current="currentPage"
                    :page-size-opts="[10, 20, 50]"
                    show-easy-prev show-easy-next show-total
                    @on-change="handlePageChange"
                    @on-page-size-change="handlePageSizeChange"
                />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ViewerPanel1',
    props: {
        points: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            currentPage: 1,
            pageSize: 10,
            total: 0,
            selectedPoints: [],
            checkAll: false,
            isIndeterminate: false,
            tolerance: 4,
            pointColumns: [
                { type: 'selection', width: 60, align: 'center' },
                { slot: 'seq', title: '序号', key: 'seq', width: 60, align: 'center', render: (h, { row,index }) => {
                    return h('span',  (this.currentPage -1) * this.pageSize + index + 1)
                } },
                { title: '实时测点', key: 'pointName', minWidth: 160 },
                // { title: 'X 坐标', key: 'x', width: 120, align: 'right' },
                // { title: 'Y 坐标', key: 'y', width: 120, align: 'right' },
                { title: '测点坐标', key: 'coordValue', width: 140, align: 'center', slot: 'coordStatus' },
                { title: '匹配状态', key: 'matchStatus', width: 100, align: 'center', slot: 'matchStatus' },
                { title: '坐标差', key: 'coordDiff', width: 80, align: 'center' },
                { title: '匹配图纸点位', key: 'matchPoint', width: 140 },
                { title: '解析方式', key: 'parseMethod', width: 100, align: 'center' },
                { title: '匹配方式', key: 'matchMethod', width: 100, align: 'center' }
            ]
        }
    },
    computed: {
        pointPageData() {
            const start = (this.currentPage - 1) * this.pageSize
            return this.points.slice(start, start + this.pageSize)
        },
        summaryData() {
            const total = this.points.length
            const noCoord = this.points.filter(p => !p.coordValue || p.coordValue === '无坐标').length
            const matched = this.points.filter(p => p.matchStatus !== '未匹配').length
            const unmatched = this.points.filter(p => p.matchStatus === '未匹配').length
            const totalPoints = new Set(this.points.map(p => p.matchPoint).filter(Boolean)).size
            const used = new Set(this.points.filter(p => p.matchStatus !== '未匹配').map(p => p.matchPoint).filter(Boolean)).size
            return { total, noCoord, matched, unmatched, totalPoints, used }
        },
        // 为每页数据添加全局序号
        pointPageDataWithSeq() {
            const start = (this.currentPage - 1) * this.pageSize
            return this.points.slice(start, start + this.pageSize).map((item, index) => ({
                ...item,
                _seq: start + index + 1
            }))
        }
    },
    watch: {
        points() {
            this.onDataChange()
        }
    },
    created() {
        this.onDataChange()
    },
    methods: {
        onDataChange() {
            this.total = this.points.length
            this.currentPage = 1
            this.selectedPoints = []
            this.checkAll = false
            this.isIndeterminate = false
        },
        handlePageChange(page) {
            this.currentPage = page
        },
        handlePageSizeChange(size) {
            this.pageSize = size
            this.currentPage = 1
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
        onDeletePoints(points) {
            this.$emit('delete-points', points)
        }
    }
}
</script>

<style>
.viewer-panel-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
}

/* 工具栏 */
.vp-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    background: #fff;
    flex-wrap: wrap;
    margin-bottom: 16px;
}

.vp-toolbar-label {
    font-size: 13px;
    color: #515a6e;
    margin-left: 4px;
}

.vp-toolbar .ivu-btn {
    height: 32px;
    padding: 0 12px;
    font-size: 14px;
    border-radius: 4px;
}

.vp-toolbar .ivu-btn span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.vp-toolbar .ivu-input-number {
    width: 80px;
}

/* 统计栏 */
.vp-summary {
    display: flex;
    align-items: center;
    height: 60px;
    background: linear-gradient( 180deg, rgba(4,106,255,0.08) 0%, rgba(233,242,255,0) 100%);
    gap: 32px;
    margin-bottom: 16px;
}

.vp-summary-item {
    padding-top: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
    line-height: 1.2;
}

.vp-summary-num {
    font-size: 24px;
    font-weight: 600;
    font-family: D-DIN;
    color: #333;
    line-height: 1.2;
}

.vp-summary-num-red {
    color: #ed4014;
}

.vp-summary-num-green {
    color: #52c41a;
}

.vp-summary-num-orange {
    color: #fa8c16;
}

.vp-summary-num-blue {
    color: #1764e8;
}

.vp-summary-label {
    font-size: 14px;
    color: #808695;
}

.vp-summary-divider {
    width: 1px;
    height: 24px;
    background: #CDD8E9;
    flex: none;
}

/* 表格区域 */
.vp-body {
    flex: 1;
    overflow: auto;
    padding: 0;
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

.vp-body .ivu-table-cell {
    padding: 0
}

.vp-body .ivu-table .ivu-table-row:hover td {
    background: #e6f4ff !important;
}

.vp-list {
    height: 100%;
}

/* 坐标无值样式 */
.vp-no-coord {
    color: #ed4014;
}

/* 匹配状态 */
.vp-match-status {
    font-size: 12px;
}

.vp-match-status.status-matched {
    color: #515a6e;
}

.vp-match-status.status-unmatched {
    color: #ed4014;
}

/* 分页底部 */
.vp-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    /* border-top: 1px solid #e8eaec; */
    background: #fff;
    font-size: 14px;
}

.vp-selected-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.vp-selected-count {
    color: #515a6e;
}

.vp-pagination {
    display: flex;
    align-items: center;
    gap: 8px;
}

.vp-total {
    color: #515a6e;
    font-size: 13px;
}
</style>
