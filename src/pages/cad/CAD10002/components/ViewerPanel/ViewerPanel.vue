<template>
    <div class="viewer-panel-wrapper">
        <!-- 顶部：标题 + 搜索框 -->
        <div class="vp-topbar">
            <span class="vp-title">{{ title }}</span>
            <div class="vp-search">
                <input v-model="searchKeyword" type="text" class="vp-search-input" placeholder="请输入搜索关键词"
                    @input="onSearch" />
            </div>
        </div>
        <!-- 分类列表 -->
        <div v-show="displayCategories.length" class="vp-categories">
            <div v-for="(cat, catIdx) in displayCategories" :key="catIdx" class="vp-category">
                <!-- 分类头部 -->
                <div class="vp-cat-header" @click="toggleCat(catIdx)">
                    <span class="vp-cat-actions" @click.stop>
                        <Checkbox :value="isCatAllSelected(catIdx)" :indeterminate="isCatIndeterminate(catIdx)"
                            @on-change="(val) => handleCatSelectAll(catIdx, val)">
                        </Checkbox>
                    </span>
                    <span class="vp-cat-name">{{ cat.name }}</span>
                    <span v-if="displayCategories.length > 1" class="vp-cat-arrow"
                        :class="cat.expanded ? 'arrow-up' : 'arrow-down'">
                        <img src="../../css/images/arrow-down.png" alt="">
                    </span>
                </div>
                <!-- 分类表格 -->
                <div v-show="cat.expanded || displayCategories.length == 1" :key="'cat-body-' + catIdx" class="vp-cat-body">
                    <Table :ref="'catTable_' + catIdx" :data="cat.pageData" :columns="catColumns" :border="false"
                        size="small" highlight-row @on-row-click="onPointRowClick"
                        @on-selection-change="onCatSelectionChange(catIdx, $event)" no-data-text="" />
                    <!-- 分页 -->
                    <div class="vp-cat-footer">
                        <Page :total="cat.total" :page-size="cat.pageSize" :current="cat.currentPage"
                            :page-size-opts="[10, 20, 50]" show-easy-prev show-easy-next show-total
                            @on-change="(p) => onCatPageChange(catIdx, p)"
                            @on-page-size-change="(s) => onCatPageSizeChange(catIdx, s)" />
                    </div>
                </div>
            </div>
        </div>
        <div class="vp-empty" v-show="displayCategories.length == 0">
            <img src="../../css/images/no_data.jpg" alt="">
        </div>
    </div>
</template>
<script>
export default {
    name: 'ViewerPanel',
    props: {
        categories: {
            type: Array,
            default: () => []
            // 每项结构: { name, points: [{ id, LOT_NAM, value }] }
        },
        title: {
            type: String,
            default: ''
        },
        panelKey: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            searchKeyword: '',
            catColumns: [
                { type: 'selection', width: 40, align: 'center' },
                {
                    title: this.title === '人员定位站' ? '人员名称' : '测点名称',
                    key: 'LOT_NAM',
                    minWidth: 160,
                    ellipsis: true
                },
                {
                    title: this.title === '人员定位站' ? '所属团队' : (this.title === '安全监测' ? '当前值' : '感知编号'),
                    key: 'value',
                    minWidth: 120,
                    align: 'center'
                }
            ]
        }
    },
    computed: {
        // 搜索过滤后的分类数据【只用于页面渲染，不删除已选中数据】
        filteredCategories() {
            if (!this.searchKeyword.trim()) {
                return this.categories
            }
            const kw = this.searchKeyword.trim().toLowerCase()
            return this.categories.map(cat => {
                const filterPoints = cat.points.filter(p =>
                    (p.LOT_NAM && p.LOT_NAM.toLowerCase().includes(kw)) ||
                    (p.value && String(p.value).toLowerCase().includes(kw))
                )
                return {
                    ...cat,
                    showPoints: filterPoints
                }
            }).filter(cat => cat.showPoints.length > 0)
        },
        // 展示用的分类数据（核心：直接生成带_checked的pageData，驱动表格勾选）
        displayCategories() {
            return this.filteredCategories.map(cat => {
                if (!cat.currentPage) cat.currentPage = 1
                if (!cat.pageSize) cat.pageSize = 10
                if (!cat.selectedPoints) {
                    this.$set(cat, 'selectedPoints', [])
                }
                const sourcePoints = cat.showPoints ?? cat.points
                const start = (cat.currentPage - 1) * cat.pageSize
                const end = Math.min(start + cat.pageSize, sourcePoints.length)
                const pageData = sourcePoints.slice(start, end).map((item, index) => {
                    const seq = (cat.currentPage - 1) * cat.pageSize + index + 1
                    // 直接计算_checked，iview table自动识别渲染勾选框
                    const _checked = cat.selectedPoints.some(p => p.id === item.id)
                    return {
                        ...item,
                        seq,
                        _checked
                    }
                })
                return {
                    ...cat,
                    total: sourcePoints.length,
                    pageData,
                }
            })
        }
    },
    watch: {
        title: {
            handler(val) {
                this.catColumns = [
                { type: 'selection', width: 40, align: 'center' },
                {
                    title: this.title === '人员定位站' ? '人员名称' : '测点名称',
                    key: 'LOT_NAM',
                    minWidth: 160,
                    ellipsis: true
                },
                {
                    title: this.title === '人员定位站' ? '所属团队' : (this.title === '安全监测' ? '当前值' : '感知编号'),
                    key: 'value',
                    minWidth: 120,
                    align: 'center'
                }
            ]
            console.log(this.title, this.catColumns, 1111)
            },
            immediate: true
        },
        categories: {
            handler() {
                this.categories.forEach(cat => {
                    if (!cat.currentPage) cat.currentPage = 1
                    if (!cat.selectedPoints) {
                        this.$set(cat, 'selectedPoints', [])
                    }
                })
            },
            immediate: true,
            deep: true
        },
        searchKeyword() {
            this.filteredCategories.forEach(cat => {
                cat.currentPage = 1
            })
        }
    },
    mounted() {

    },
    methods: {
        onPointRowClick(row) {
            this.$emit('zoom-to-point', row.x, row.y)
        },
        // ============ 折叠/展开 ============
        toggleCat(idx) {
            const cat = this.filteredCategories[idx]
            if (cat) {
                cat.expanded = !cat.expanded
            }
        },
        // ============ 表格选中变化 ============
        onCatSelectionChange(catIdx, rows) {
            const cat = this.filteredCategories[catIdx]
            if (!cat) return
            const currentPageIds = new Set(
                this.displayCategories[catIdx].pageData.map(p => p.id)
            )
            // 移除当前页旧选中
            cat.selectedPoints = cat.selectedPoints.filter(
                p => !currentPageIds.has(p.id)
            )
            // 添加当前新选中
            rows.forEach(row => {
                if (!cat.selectedPoints.some(p => p.id === row.id)) {
                    cat.selectedPoints.push(row)
                }
            })
            this.$emit('select-change', { panelKey: this.panelKey, category: cat.name, selected: cat.selectedPoints })
        },
        // ============ 分类全选/取消全选【方案A：只作用当前筛选可见数据，隐藏选中保留】 ============
        handleCatSelectAll(catIdx, checked) {
            const cat = this.filteredCategories[catIdx]
            if (!cat) return
            const sourcePoints = cat.showPoints ?? cat.points
            if (checked) {
                const existingIds = new Set(cat.selectedPoints.map(p => p.id))
                sourcePoints.forEach(p => {
                    if (!existingIds.has(p.id)) {
                        cat.selectedPoints.push(p)
                    }
                })
            } else {
                // 取消只取消当前筛选可视范围内的数据
                const visibleIds = new Set(sourcePoints.map(p => p.id))
                cat.selectedPoints = cat.selectedPoints.filter(p => !visibleIds.has(p.id))
            }
            this.$emit('select-change', { panelKey: this.panelKey, category: cat.name, selected: cat.selectedPoints })
        },
        // ============ 判断分类全选状态 ============
        isCatAllSelected(catIdx) {
            const cat = this.filteredCategories[catIdx]
            if (!cat) return false
            const sourcePoints = cat.showPoints ?? cat.points
            if (sourcePoints.length === 0) return false
            return sourcePoints.every(item => cat.selectedPoints.some(p => p.id === item.id))
        },
        isCatIndeterminate(catIdx) {
            const cat = this.filteredCategories[catIdx]
            if (!cat) return false
            const sourcePoints = cat.showPoints ?? cat.points
            const visibleSelectedCount = sourcePoints.filter(item => cat.selectedPoints.some(p => p.id === item.id)).length
            return visibleSelectedCount > 0 && visibleSelectedCount < sourcePoints.length
        },
        // ============ 分页切换 ============
        onCatPageChange(catIdx, page) {
            const cat = this.filteredCategories[catIdx]
            if (cat) {
                cat.currentPage = page
            }
        },
        // ============ 每页条数变更 ============
        onCatPageSizeChange(catIdx, size) {
            const cat = this.filteredCategories[catIdx]
            if (cat) {
                cat.pageSize = size
                cat.currentPage = 1
            }
        },
        // ============ 搜索 ============
        onSearch() {
            this.filteredCategories.forEach(cat => {
                cat.currentPage = 1
            })
        },
        // ============ 获取所有分类选中完整数据 ============
        getSelectedData() {
            const result = {}
            this.filteredCategories.forEach(cat => {
                result[cat.name] = cat.selectedPoints || []
            })
            return result
        },
        // ============ 获取所有选中项ID数组 ============
        getSelectedIds() {
            const ids = []
            this.filteredCategories.forEach(cat => {
                cat.selectedPoints.forEach(item => {
                    if (!ids.includes(item.id)) {
                        ids.push(item.id)
                    }
                })
            })
            return ids
        },
        // ============ 清空所有选中 ============
        clearAllSelection() {
            this.filteredCategories.forEach(cat => {
                if (cat.selectedPoints) {
                    cat.selectedPoints = []
                }
            })
        }
    }
}
</script>
<style scoped>
.viewer-panel-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
    font-size: 14px;
}

/* ===== 顶部标题栏 ===== */
.vp-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding-bottom: 24px;
}

.vp-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    position: relative;
}

.vp-title::before {
    position: absolute;
    width: 23px;
    height: 4px;
    background: #4980FF;
    border-radius: 1px 1px 1px 1px;
    content: '';
    left: 0;
    top: 32px;
}

.vp-search {
    position: relative;
    width: 220px;
}

.vp-search-input {
    width: 100%;
    height: 32px;
    padding: 0 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    color: #333;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.vp-search-input:focus {
    border-color: #1764e8;
}

.vp-search-input::placeholder {
    color: #bfbfbf;
}

.vp-empty {
    display: flex;
    justify-content: center;
    padding-top: 160px;
}

/* ===== 分类列表 ===== */
.vp-categories {
    flex: 1;
    overflow-y: auto;
    padding: 0 0 8px;
}

.vp-category {
    margin-bottom: 4px;
}

/* ===== 分类头部 ===== */
.vp-cat-header {
    display: flex;
    align-items: center;
    height: 42px;
    cursor: pointer;
    gap: 8px;
    user-select: none;
    transition: background 0.15s;
    padding: 0 8px;
}

.vp-cat-arrow {
    display: inline-flex;
    align-items: center;
    color: #808695;
    flex-shrink: 0;
    transition: transform 0.2s;
}

.vp-cat-arrow img {
    transition: transform 0.2s;
}

.vp-cat-arrow.arrow-up img {
    transform: rotate(180deg);
}

.vp-cat-name {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
}

.vp-cat-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}

.vp-cat-actions>>>.ivu-checkbox-wrapper {
    margin-right: 0;
    font-size: 14px;
    color: #515a6e;
}

/* ===== 分类表格区域 ===== */
.vp-cat-body>>>.ivu-table-wrapper {
    border: none;
}

.vp-cat-body>>>.ivu-table-header thead tr th {
    height: 42px;
    padding: 0 8px;
    background: #EEF1F6;
    font-size: 14px;
    color: #515a6e;
    border: none;
}

.vp-cat-body>>>.ivu-table-body tr td {
    height: 42px;
    padding: 0 8px;
    font-size: 14px;
    color: #333;
    border: none;
}

.vp-cat-body>>>.ivu-table-cell {
    padding: 0 8px;
}

.vp-cat-body>>>.ivu-table .ivu-table-row:nth-child(odd) td {
    background: #fff;
}

.vp-cat-body>>>.ivu-table .ivu-table-row:nth-child(even) td {
    background: #EEF1F6;
}

.vp-cat-body>>>.ivu-table .ivu-table-row:hover td {
    background: #e6f4ff !important;
}

.vp-cat-body>>>.ivu-table {
    border: none;
}

.vp-cat-body>>>.ivu-table:before,
.vp-cat-body>>>.ivu-table:after {
    display: none;
}

.vp-cat-body>>>.ivu-table-border td,
.vp-cat-body>>>.ivu-table-border th {
    border: none;
}

/* ===== 分页底部 ===== */
.vp-cat-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 8px 8px 0;
    gap: 8px;
}

.vp-cat-footer>>>.ivu-page {
    font-size: 14px;
}

.vp-cat-footer>>>.ivu-page-total {
    font-size: 14px;
    color: #515a6e;
}
</style>
