<template>
    <div class="viewer-panel-wrapper">
        <!-- 工具栏 -->
        <div class="vp-toolbar" v-if="status!=='04'&&status!='05'">
            <Button type="primary" @click="onAdd" size="large" ghost><img src="../../css/images/icon1.png" alt="">添加测点</Button>
            <span class="vp-toolbar-label">坐标匹配容差</span>
            <InputNumber v-model="tolerance" :min="0" :precision="2" style="width: 80px" />
            <Button type="primary" ghost @click="onAutoMatch"><img src="../../css/images/icon2.png" alt="">自动绑定</Button>
            <Button type="primary" ghost @click="onManualMatch"><img src="../../css/images/icon3.png" alt="">人工绑定</Button>
            <Button type="primary" ghost @click="onAutoPlace"><img src="../../css/images/icon4.png" alt="">自动布点</Button>
            <Button type="primary" ghost @click="onManualPlace"><img src="../../css/images/icon4.png" alt="">人工布点</Button>
            <Button type="primary" ghost @click="onUnmatch"><img src="../../css/images/icon5.png" alt="">解除绑定</Button>
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
                no-data-text=""
            >
                <template slot-scope="{ row }" slot="coordStatus">
                    <span :class="row.PT_X_VALUE && row.PT_Y_VALUE ? '' : 'vp-no-coord'">
                        {{ row.PT_X_VALUE && row.PT_Y_VALUE ? ((+row.PT_X_VALUE).toFixed(2) + ',' + (+row.PT_Y_VALUE).toFixed(2)) : '无坐标' }}
                    </span>
                </template>
                <template slot-scope="{ row }" slot="MATCH_STA">
                    <span :class="['vp-match-status', row.MATCH_STA === '未匹配' ? 'status-unmatched' : 'status-matched']">
                        {{ row.MATCH_STA || '匹配' }}
                    </span>
                </template>
            </Table>
        </div>

        <!-- 分页 -->
        <div class="vp-footer">
            <div class="vp-selected-info">
                <span class="vp-selected-count">已选 {{ selectedPoints.length }} 条</span>
            </div>
            <div class="vp-pagination">
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

        <!-- 选择测点弹窗 -->
        <Modal
            v-model="pointModalVisible"
            :width="900"
            :footer-hide="true"
            class-name="point-select-modal-wrapper"
        >
            <PointSelectModal
                :visible="pointModalVisible"
                @update:visible="pointModalVisible = $event"
                @confirm="onPointSelectConfirm"
            />
        </Modal>
    </div>
</template>

<script>
import PointSelectModal from '../../dialog/PointSelectModal.vue'
export default {
    name: 'ViewerPanel1',
    props: {
        tzpzNo: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            default: ''
        }
    },
    emits: ['zoom-to-point', 'delete-points', 'auto-match', 'manual-match', 'auto-place', 'manual-place', 'unmatch', 'add-points'],
    data() {
        return {
            currentPage: 1,
            pageSize: 10,
            total: 0,
            pageData: [],
            selectedPoints: [],
            checkAll: false,
            isIndeterminate: false,
            tolerance: 4,
            pointModalVisible: false,
            orgNo: '',
            isDev: false,
            pointColumns: [
                { type: 'selection', width: 60, align: 'center' },
                { slot: 'seq', title: '序号', key: 'seq', width: 60, align: 'center', render: (h, { row, index }) => {
                    return h('span', (this.currentPage - 1) * this.pageSize + index + 1)
                } },
                { title: '实时测点', key: 'PT_NAM', minWidth: 120 },
                { title: '测点坐标', key: 'coordValue', minWidth: 120, align: 'center', slot: 'coordStatus' },
                { title: '匹配状态', key: 'MATCH_STA', width: 80, align: 'center', slot: 'MATCH_STA' },
                { title: '坐标差', key: 'DALTA_XY', minWidth: 80, align: 'center' },
                { title: '匹配图纸点位', key: 'POINT_NAM', minWidth: 120 },
                { title: '匹配方式', key: 'MATCH_TYP', width: 90, align: 'center' }
            ],
            summaryData: {
                total: 0,
                noCoord: 0,
                matched: 0,
                unmatched: 0,
                totalPoints: 0,
                used: 0
            }
        }
    },
    computed: {
        pointPageDataWithSeq() {
            const start = (this.currentPage - 1) * this.pageSize
            return this.pageData.map((item, index) => ({
                ...item,
                _seq: start + index + 1
            }))
        }
    },
    components: { PointSelectModal },
    watch: {
        tzpzNo() {
            this.fetchData()
            this.getIotStatistic()
        }
    },
    mounted() {
        const params = new URLSearchParams(location.search)
        this.orgNo = params.get('orgNo')
        if (this.isDev) {
            this.pageData =  [
            {
                "I2P_NO": "133777110241938767871",
                "TZPZ_NO": "133775589162091020281",
                "POINT_X_VALUE": "",
                "MATCH_STA": "匹配",
                "POINT_ID": "",
                "POINT_NAM": "",
                "PT_Y_VALUE": "-30388651.27496908",
                "PT_NAM": "氧气1",
                "PT_NO": "128681301464609980416",
                "MATCH_TYP": "",
                "DALTA_XY": "",
                "PT_ID": "61080201921101MN001200001816",
                "PT_X_VALUE": "23372898.909408778",
                "POINT_Y_VALUE": "",
                "POINT_NO": "58a6"
            },
            {
                "I2P_NO": "133777110241938767872",
                "TZPZ_NO": "133775589162091020288",
                "POINT_X_VALUE": "",
                "MATCH_STA": "未匹配",
                "POINT_ID": "",
                "POINT_NAM": "",
                "PT_Y_VALUE": "-30382999.282143094",
                "PT_NAM": "氧气",
                "PT_NO": "128681301464609980416",
                "MATCH_TYP": "",
                "DALTA_XY": "",
                "PT_ID": "61080201921101MN001200001818",
                "PT_X_VALUE": "23369467.220270775",
                "POINT_Y_VALUE": "",
                "POINT_NO": ""
            },
            {
                "I2P_NO": "133777112498138775552",
                "TZPZ_NO": "133775589162091020288",
                "POINT_X_VALUE": "",
                "MATCH_STA": "未匹配",
                "POINT_ID": "",
                "POINT_NAM": "",
                "PT_Y_VALUE": "39394974.134983465",
                "PT_NAM": "环境温度",
                "PT_NO": "128681301465683722240",
                "MATCH_TYP": "",
                "DALTA_XY": "",
                "PT_ID": "61080201921101MN000300000200",
                "PT_X_VALUE": "-63240812.58022698",
                "POINT_Y_VALUE": "",
                "POINT_NO": ""
            },
            {
                "I2P_NO": "133777112498138775552",
                "TZPZ_NO": "133775589162091020288",
                "POINT_X_VALUE": "",
                "MATCH_STA": "未匹配",
                "POINT_ID": "",
                "POINT_NAM": "",
                "PT_Y_VALUE": "",
                "PT_NAM": "环境温度",
                "PT_NO": "128681301465683722240",
                "MATCH_TYP": "",
                "DALTA_XY": "",
                "PT_ID": "61080201921101MN000300000200",
                "PT_X_VALUE": "",
                "POINT_Y_VALUE": "",
                "POINT_NO": ""
            }
        ]
        }
        this.fetchData()
        this.getIotStatistic()
    },
    methods: {
        async postData(url, data) {
            data.param_orgNo = this.orgNo
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(data)
            })
            return response.json()
        },
        async fetchData() {
            if (!this.tzpzNo) return
            const res = await this.postData('/api/scaqyzt/getIot', {
                TZPZ_NO: this.tzpzNo,
                pageSize: String(this.pageSize),
                pageNum: String(this.currentPage)
            })
            if (res.success && res.data) {
                this.pageData = res.data.data || []
                this.total = res.data.pageInfo ? res.data.pageInfo.totalCount : 0
            }
        },
        getIotStatistic() {
            this.postData('/api/scaqyzt/getIotStatistic', {
                TZPZ_NO: this.tzpzNo
            }).then(res => {
                this.summaryData = {
                    total: res.data.zcdNum,
                    noCoord: res.data.wzbcdNum,
                    matched: res.data.yppcdNum,
                    unmatched: res.data.wppcdNum,
                    totalPoints: res.data.zdwNum,
                    used: res.data.ysyNum
                }
            })
        },
        async refreshData() {
            this.currentPage = 1
            await this.fetchData()
            this.getIotStatistic()
        },
        onAdd() {
            this.pointModalVisible = true
        },
        onPointSelectConfirm(points) {
            this.$emit('add-points', points)
        },
        handlePageChange(page) {
            this.currentPage = page
            this.fetchData()
        },
        handlePageSizeChange(size) {
            this.pageSize = size
            this.currentPage = 1
            this.fetchData()
        },
        onPointSelectionChange(rows) {
            this.selectedPoints = rows || []
            this.checkAll = false
            this.isIndeterminate = false
            if (this.pageData.length > 0 && this.selectedPoints.length === this.pageData.length) {
                this.checkAll = true
            } else if (this.selectedPoints.length > 0) {
                this.isIndeterminate = true
            }
        },
        onCheckAllChange(val) {
            if (val) {
                this.selectedPoints = [...this.pageData]
            } else {
                this.selectedPoints = []
            }
            this.isIndeterminate = false
        },
        onPointRowClick(row) {
            if (row.PT_X_VALUE && row.PT_Y_VALUE) {
                this.$emit('zoom-to-point', row)
            }
        },
        onDeletePoints(points) {
            this.$emit('delete-points', points)
        },
        onAutoMatch() {
            this.$emit('auto-match', this.selectedPoints, this.tolerance)
        },
        onManualMatch() {
            this.$emit('manual-match', this.selectedPoints)
        },
        onAutoPlace() {
            this.$emit('auto-place', this.selectedPoints)
        },
        onManualPlace() {
            this.$emit('manual-place', this.selectedPoints)
        },
        onUnmatch() {
            this.$emit('unmatch', this.selectedPoints)
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
    font-size: 14px;
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
    border: none;
}

.vp-body .ivu-table-body tr td {
    height: 42px;
    padding: 0 8px;
    border: none;
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
    font-size: 14px;
}
</style>
