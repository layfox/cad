<template>
    <div class="dialog-container sui-dialog-page">
        <div class="sui-table-main">
            <Table
                ref="selectTable"
                border
                :data="tableData"
                :columns="columns"
                highlight-row
                height="500"
                @on-selection-change="onSelectionChange"
                @on-row-click="onRowClick"
                style="width: 100%"
            ></Table>
        </div>
        <div class="sui-table-pager">
            <Page
                :total="total"
                :page-size="pageSize"
                :current="currentPage"
                show-total
                show-elevator
                show-sizer
                @on-change="handlePageChange"
                @on-page-size-change="handlePageSizeChange"
            ></Page>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ChooseDialog',
    data() {
        return {
            // 所有数据（可由父页面传入 props）
            allData: [
                        {
                            "TZLX_ID": "11",
                            "ZT_DAT": "2026-08-12",
                            "resourceUrl": "http://198.19.67.152:11010/api/scaqyzt/download?docId=133644104775168950272",
                            "TZXX_ID": "11",
                            "TZLX_NAM": "11",
                            "TZLX_NO": "133598064962091614208",
                            "docId": "133644104775168950272",
                            "TZ_VERSION": "0001",
                            "TZXX_NO": "133614455193216745472",
                            "BZ_DSC": "11"
                        },
                        {
                            "TZLX_ID": "11",
                            "ZT_DAT": "2026-08-15",
                            "resourceUrl": "http://198.19.67.152:11010/api/scaqyzt/download?docId=133644284140787859456",
                            "TZXX_ID": "22",
                            "TZLX_NAM": "11",
                            "TZLX_NO": "133598064962091614208",
                            "docId": "133644284140787859456",
                            "TZ_VERSION": "0002",
                            "TZXX_NO": "133644282322942951424",
                            "BZ_DSC": "22"
                        }
                    ],
            // 当前页展示数据
            tableData: [],
            // 列定义
            columns: [
                {
                    type: 'selection',
                    width: 60,
                    align: 'center'
                },
                {
                    title: '编号',
                    key: 'id',
                    width: 120
                },
                {
                    title: '名称',
                    key: 'name'
                },
                {
                    title: '编码',
                    key: 'code',
                    width: 150
                },
                {
                    title: '版本',
                    key: 'version',
                    width: 100
                }
            ],
            // 当前选中行
            selectedRow: null,
            // 分页
            currentPage: 1,
            pageSize: 10,
            total: 0
        }
    },
    created() {
        this.total = this.allData.length
        this.handlePageChange(1)
    },
    methods: {
        // 生成模拟数据
        generateMockData(count) {
            const data = []
            for (let i = 1; i <= count; i++) {
                data.push({
                    id: `ZT${String(i).padStart(4, '0')}`,
                    name: `图纸信息_${i}`,
                    code: `CODE-${String(i).padStart(6, '0')}`,
                    version: `V1.${i}.0`,
                    user: ['张三', '李四', '王五', '赵六'][i % 4],
                    date: `2026-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`
                })
            }
            return data
        },
        // 翻页
        handlePageChange(page) {
            this.currentPage = page
            const start = (page - 1) * this.pageSize
            const end = start + this.pageSize
            this.tableData = this.allData.slice(start, end)
            // 翻页时清空选中
            this.selectedRow = null
            this.$nextTick(() => {
                if (this.$refs.selectTable) {
                    this.$refs.selectTable.clearCurrentRow()
                }
            })
        },
        // 每页条数变化
        handlePageSizeChange(size) {
            this.pageSize = size
            this.handlePageChange(1)
        },
        // 选中行变化
        onSelectionChange(rows) {
            if (rows && rows.length > 0) {
                this.selectedRow = rows[0]
            } else {
                this.selectedRow = null
            }
        },
        // 点击行也选中
        onRowClick(row) {
            this.selectedRow = row
            this.$refs.selectTable.toggleRowSelection(row, true)
        },
        // 确认选择
        confirm() {
            if (!this.selectedRow) {
                this.$Message.warning('请先选择一条记录')
                return
            }
            this.$emit('confirm', this.selectedRow)
            this.$Dialog.getInstance().close()
        },
        // 取消
        cancel() {
            this.$Dialog.getInstance().close()
        }
    }
}
</script>

<style scoped>
.dialog-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.sui-table-main {
    overflow: hidden;
    margin-top: 0;
    padding: 0;
}

.sui-table-pager {
    padding: 8px 0;
    text-align: right;
}

.dialog-footer {
    padding: 12px 16px;
    text-align: right;
    border-top: 1px solid #e8eaec;
}

.dialog-footer .ivu-btn {
    margin-left: 8px;
}
</style>
