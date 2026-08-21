<template>
    <div class="viewer-panel-wrapper">
        <!-- 顶部：标题 + 搜索框 -->
        <div class="vp-topbar">
            <span class="vp-title">人员定位</span>
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
                    <span class="vp-cat-name">{{ cat.name }}</span>
                    <span class="vp-cat-arrow" :class="cat.expanded ? 'arrow-up' : 'arrow-down'">
                        <img src="../../css/images/arrow-down.png" alt="">
                    </span>
                </div>

                <!-- 分类表格：用 v-if 替代 v-show，避免 View Design 在隐藏状态下初始化 selection 失效 -->
                <div v-if="cat.expanded" :key="'cat-body-' + catIdx" class="vp-cat-body">
                    <Table
                        ref="catTable"
                        :data="cat.pageData"
                        :columns="catColumns"
                        :border="false"
                        size="small"
                        highlight-row
                        @on-selection-change="onCatSelectionChange(catIdx, $event)"
                        no-data-text="暂无数据"
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
            // 每项结构: { name, points: [{ pointName, value }] }
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
                { title: '人员', key: 'pointName', minWidth: 160 },
                { title: '所属团队', key: 'value', minWidth: 160, align: 'center' }
            ]
        }
    },
    computed: {
        filteredCategories() {
            if (!this.searchKeyword.trim()) {
                return this.categories
            }
            const kw = this.searchKeyword.trim().toLowerCase()
            return this.categories.map(cat => ({
                ...cat,
                points: cat.points.filter(p =>
                    (p.pointName && p.pointName.toLowerCase().includes(kw)) ||
                    (p.value && String(p.value).toLowerCase().includes(kw))
                )
            })).filter(cat => cat.points.length > 0)
        },
        displayCategories() {
            return this.filteredCategories.map(cat => {
                if (!cat.currentPage) cat.currentPage = 1
                if (!cat.pageSize) cat.pageSize = 10
                const start = (cat.currentPage - 1) * cat.pageSize
                const pageData = cat.points.slice(start, start + cat.pageSize).map((item, index) => {
                    item.seq = (cat.currentPage - 1) * cat.pageSize + index + 1;
                    return item;
                })
                return {
                    ...cat,
                    total: cat.points.length,
                    currentPage: cat.currentPage,
                    pageSize: cat.pageSize,
                    pageData,
                    selectedPoints: cat.selectedPoints || []
                }
            })
        }
    },
    watch: {
        categories() {
            this.categories.forEach(cat => {
                cat.currentPage = 1
                cat.selectedPoints = cat.selectedPoints || []
            })
        },
        searchKeyword() {
            // 搜索恢复后刷新 selection
            this.$nextTick(() => this.refreshSelection())
        }
    },
    mounted() {
        // 默认展开的 category，等 DOM 渲染后重置 selection，修复 View Design 全选失效问题
        this.$nextTick(() => {
            this.refreshSelection()
        })
    },
    methods: {
        refreshSelection() {
            const tables = this.$refs.catTable
            ;(Array.isArray(tables) ? tables : [tables]).forEach(t => {
                if (t && t.clearSelection) t.clearSelection()
            })
        },
        toggleCat(idx) {
            const cat = this.filteredCategories[idx]
            if (cat) {
                cat.expanded = !cat.expanded
                if (cat.expanded) {
                    this.$nextTick(() => this.refreshSelection())
                }
            }
        },
        onCatSelectionChange(catIdx, rows) {
            const cat = this.filteredCategories[catIdx]
            if (cat) cat.selectedPoints = rows || []
        },
        onCatPageChange(catIdx, page) {
            const cat = this.filteredCategories[catIdx]
            if (cat) cat.currentPage = page
        },
        onCatPageSizeChange(catIdx, size) {
            const cat = this.filteredCategories[catIdx]
            if (cat) {
                cat.pageSize = size
                cat.currentPage = 1
            }
        },
        onSearch() {
            this.filteredCategories.forEach(cat => {
                cat.currentPage = 1
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
    padding: 0 32px 0 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 13px;
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

.vp-cat-header {
    display: flex;
    align-items: center;
    height: 48px;
    cursor: pointer;
    gap: 8px;
    user-select: none;
    transition: background 0.15s;
}

.vp-cat-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin-right: 8px;
    border-radius: 2px;
    flex-shrink: 0;
}

.vp-cat-icon.cat-icon-expanded,
.vp-cat-icon.cat-icon-collapsed {
    background: #1764e8;
    color: #fff;
}

.vp-cat-name {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
}

.vp-cat-arrow {
    display: inline-flex;
    align-items: center;
    color: #808695;
}

.vp-cat-arrow.arrow-up img {
    transform: rotate(180deg);
}

/* ===== 分类表格区域 ===== */
.vp-cat-body {
    
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

.vp-cat-body >>> .ivu-table-bordered:before,
.vp-cat-body >>> .ivu-table-bordered:after {
    display: none;
}

/* ===== 分页底部 ===== */
.vp-cat-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 8px 8px 0;
    gap: 8px;
}

.vp-cat-total {
    font-size: 13px;
    color: #515a6e;
    margin-right: 8px;
}
</style>
