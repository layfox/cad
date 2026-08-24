<template>
    <div class="viewer-panel-wrapper">
        <!-- 顶部：标题 + 搜索框 -->
        <div class="vp-topbar">
            <span class="vp-title">{{title}}</span>
            <div class="vp-search">
                <input
                    v-model="searchKeyword"
                    type="text"
                    class="vp-search-input"
                    placeholder="请输入搜索关键词"
                    @input="onSearch"
                />
                <svg class="vp-search-icon" viewBox="0 0 1024 1024" width="14" height="14">
                    <path d="M909.6 854.5L649.9 594.8c69.2-73.2 111.1-171 111.1-279C761 178.2 582.8 0 360.5 0S-1.9 178.2-1.9 402.5c0 107 41.9 204.8 111.1 279l-259.7 259.7c-5.1 5.1-5.1 13.3 0 18.4l63.6 63.6c5.1 5.1 13.3 5.1 18.4 0l264.2-264.2c5.1-5.1 13.3-5.1 18.4 0l63.6 63.6c5.1 5.1 13.3 5.1 18.4 0l298.9-298.9c5.1-5.1 5.1-13.3 0-18.4zM360.5 661c-143.4 0-259.7-116.3-259.7-259.7S217.1 141.6 360.5 141.6s259.7 116.3 259.7 259.7S503.9 661 360.5 661z" fill="currentColor"/>
                </svg>
            </div>
        </div>

        <!-- 分类列表 -->
        <div class="vp-categories">
            <div
                v-for="(cat, catIdx) in displayCategories"
                :key="catIdx"
                class="vp-category"
            >
                <!-- 分类头部 -->
                <div class="vp-cat-header" @click="toggleCat(catIdx)">
                    <span class="vp-cat-actions" @click.stop>
                        <Checkbox
                            :value="isCatAllSelected(catIdx)"
                            :indeterminate="isCatIndeterminate(catIdx)"
                            @on-change="(val) => handleCatSelectAll(catIdx, val)"
                        >
                        </Checkbox>
                    </span>
                    <span class="vp-cat-name">{{ cat.name }}</span>
                    <span v-if="displayCategories.length > 1" class="vp-cat-arrow" :class="cat.expanded ? 'arrow-up' : 'arrow-down'">
                        <img src="../../css/images/arrow-down.png" alt="">
                    </span>
                </div>

                <!-- 分类表格 -->
                <div v-show="cat.expanded||displayCategories.length==1" :key="'cat-body-' + catIdx" class="vp-cat-body">
                    <Table
                        :ref="'catTable_' + catIdx"
                        :data="cat.pageData"
                        :columns="catColumns"
                        :border="false"
                        size="small"
                        highlight-row
                        @on-selection-change="onCatSelectionChange(catIdx, $event)"
                        no-data-text=""
                    />
                    <!-- 分页 -->
                    <div class="vp-cat-footer">
                        <Page
                            :total="cat.total"
                            :page-size="cat.pageSize"
                            :current="cat.currentPage"
                            :page-size-opts="[10, 20, 50]"
                            show-easy-prev show-easy-next show-total
                            @on-change="(p) => onCatPageChange(catIdx, p)"
                            @on-page-size-change="(s) => onCatPageSizeChange(catIdx, s)"
                        />
                    </div>
                </div>
            </div>
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
        }
    },
    data() {
        return {
            searchKeyword: '',
            catColumns: [
                { type: 'selection', width: 40, align: 'center' },
                {
                    title: '序号',
                    key: 'seq',
                    width: 60,
                    align: 'center'
                },
                { title: this.title== '人员定位' ? '人员名称' : '图纸点位名称', key: 'LOT_NAM', minWidth: 160, ellipsis: true },
                { title: this.title== '人员定位' ? '所属团队' :'数值', key: 'value', minWidth: 120, align: 'center' }
            ]
        }
    },
    computed: {
        // 搜索过滤后的分类数据
        filteredCategories() {
            if (!this.searchKeyword.trim()) {
                return this.categories
            }
            const kw = this.searchKeyword.trim().toLowerCase()
            return this.categories.map(cat => ({
                ...cat,
                points: cat.points.filter(p =>
                    (p.LOT_NAM && p.LOT_NAM.toLowerCase().includes(kw)) ||
                    (p.value && String(p.value).toLowerCase().includes(kw))
                )
            })).filter(cat => cat.points.length > 0)
        },
        // 展示用的分类数据（包含分页、选中状态等）
        displayCategories() {
            return this.filteredCategories.map(cat => {
                // 初始化分页参数
                if (!cat.currentPage) cat.currentPage = 1
                if (!cat.pageSize) cat.pageSize = 10
                // 初始化选中列表（存储的是完整的 row 对象，便于跨页选中）
                if (!cat.selectedPoints) {
                    this.$set(cat, 'selectedPoints', [])
                }
                
                const start = (cat.currentPage - 1) * cat.pageSize
                const end = Math.min(start + cat.pageSize, cat.points.length)
                const pageData = cat.points.slice(start, end).map((item, index) => {
                    // 添加序号
                    const seq = (cat.currentPage - 1) * cat.pageSize + index + 1
                    // 关键：根据 selectedPoints 判断是否选中，设置 _checked
                    const isChecked = cat.selectedPoints.some(p => p.PT_ID === item.PT_ID)
                    return {
                        ...item,
                        seq,
                        _checked: isChecked
                    }
                })
                
                return {
                    ...cat,
                    total: cat.points.length,
                    pageData,
                    // 保留原始的 selectedPoints 引用
                }
            })
        }
    },
    watch: {
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
            // 搜索后重置页码和选中状态
            this.filteredCategories.forEach(cat => {
                cat.currentPage = 1
                if (cat.selectedPoints) {
                    // 过滤掉不在当前搜索结果中的选中项
                    const validIds = new Set(cat.points.map(p => p.PT_ID))
                    cat.selectedPoints = cat.selectedPoints.filter(p => validIds.has(p.PT_ID))
                }
            })
            this.$nextTick(() => this.refreshSelection())
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.refreshSelection()
        })
    },
    methods: {
        // ============ 刷新所有表格的选中状态 ============
        refreshSelection() {
            this.displayCategories.forEach((cat, idx) => {
                const table = this.$refs['catTable_' + idx]
                if (table && table.clearSelection) {
                    table.clearSelection()
                }
            })
        },
        
        // ============ 折叠/展开 ============
        toggleCat(idx) {
            const cat = this.filteredCategories[idx]
            if (cat) {
                cat.expanded = !cat.expanded
                if (cat.expanded) {
                    this.$nextTick(() => this.refreshSelection())
                }
            }
        },
        
        // ============ 表格选中变化 ============
        onCatSelectionChange(catIdx, rows) {
            const cat = this.filteredCategories[catIdx]
            if (!cat) return
            
            // 获取当前页所有数据的 id
            const currentPageIds = new Set(
                this.displayCategories[catIdx].pageData.map(p => p.PT_ID)
            )
            
            // 移除当前页在 selectedPoints 中的旧数据
            cat.selectedPoints = cat.selectedPoints.filter(
                p => !currentPageIds.has(p.PT_ID)
            )
            
            // 添加当前页新选中的数据
            rows.forEach(row => {
                if (!cat.selectedPoints.some(p => p.PT_ID === row.PT_ID)) {
                    cat.selectedPoints.push(row)
                }
            })
        },
        
        // ============ 分类全选/取消全选 ============
        handleCatSelectAll(catIdx, checked) {
            const cat = this.filteredCategories[catIdx]
            if (!cat) return
            
            if (checked) {
                // 全选：将该分类下所有点加入 selectedPoints
                const existingIds = new Set(cat.selectedPoints.map(p => p.PT_ID))
                cat.points.forEach(p => {
                    if (!existingIds.has(p.PT_ID)) {
                        cat.selectedPoints.push(p)
                    }
                })
            } else {
                // 取消全选：清空该分类的选中列表
                cat.selectedPoints = []
            }
            
            // 刷新表格显示
            this.$nextTick(() => this.refreshSelection())
        },
        
        // ============ 判断分类全选状态 ============
        isCatAllSelected(catIdx) {
            const cat = this.filteredCategories[catIdx]
            if (!cat || cat.points.length === 0) return false
            return cat.selectedPoints.length === cat.points.length
        },
        
        isCatIndeterminate(catIdx) {
            const cat = this.filteredCategories[catIdx]
            if (!cat || cat.points.length === 0) return false
            const count = cat.selectedPoints.length
            return count > 0 && count < cat.points.length
        },
        
        // ============ 分页切换 ============
        onCatPageChange(catIdx, page) {
            const cat = this.filteredCategories[catIdx]
            if (cat) {
                cat.currentPage = page
                this.$nextTick(() => this.refreshSelection())
            }
        },
        
        onCatPageSizeChange(catIdx, size) {
            const cat = this.filteredCategories[catIdx]
            if (cat) {
                cat.pageSize = size
                cat.currentPage = 1
                this.$nextTick(() => this.refreshSelection())
            }
        },
        
        // ============ 搜索 ============
        onSearch() {
            this.filteredCategories.forEach(cat => {
                cat.currentPage = 1
            })
        },
        
        // ============ 获取所有分类的选中数据（供父组件调用） ============
        getSelectedData() {
            const result = {}
            this.filteredCategories.forEach(cat => {
                result[cat.name] = cat.selectedPoints || []
            })
            return result
        },
        
        // ============ 清空所有选中（供父组件调用） ============
        clearAllSelection() {
            this.filteredCategories.forEach(cat => {
                if (cat.selectedPoints) {
                    cat.selectedPoints = []
                }
            })
            this.$nextTick(() => this.refreshSelection())
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
    padding: 0 32px 0 12px;
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

.vp-search-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #bfbfbf;
    pointer-events: none;
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

.vp-cat-actions  .ivu-checkbox-wrapper {
    margin-right: 0;
}

.vp-cat-actions >>> .ivu-checkbox-wrapper {
    font-size: 14px;
    color: #515a6e;
}

.vp-cat-total {
    font-size: 14px;
    color: #808695;
}

/* ===== 分类表格区域 ===== */

.vp-cat-body >>> .ivu-table-wrapper {
    border: none;
}

.vp-cat-body >>> .ivu-table-header thead tr th {
    height: 42px;
    padding: 0 8px;
    background: #EEF1F6;
    font-size: 14px;
    color: #515a6e;
    border: none;
}

.vp-cat-body >>> .ivu-table-body tr td {
    height: 42px;
    padding: 0 8px;
    font-size: 14px;
    color: #333;
    border: none;
}

.vp-cat-body >>> .ivu-table-cell {
    padding: 0 8px;
}

.vp-cat-body >>> .ivu-table .ivu-table-row:nth-child(odd) td {
    background: #fff;
}

.vp-cat-body >>> .ivu-table .ivu-table-row:nth-child(even) td {
    background: #EEF1F6;
}

.vp-cat-body >>> .ivu-table .ivu-table-row:hover td {
    background: #e6f4ff !important;
}

.vp-cat-body >>> .ivu-table {
    border: none;
}

.vp-cat-body >>> .ivu-table:before,
.vp-cat-body >>> .ivu-table:after {
    display: none;
}

.vp-cat-body >>> .ivu-table-border td,
.vp-cat-body >>> .ivu-table-border th {
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

.vp-cat-footer >>> .ivu-page {
    font-size: 14px;
}

.vp-cat-footer >>> .ivu-page-total {
    font-size: 14px;
    color: #515a6e;
}
</style>