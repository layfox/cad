<template>
  <div class="equip-info-modal">
    <!-- 头部（样式与 PersonInfoModal 一致） -->
    <div class="eim-header">
      <div class="eim-title">
        <span class="eim-title-arrow">▶</span>
        <span class="eim-title-name">{{ equip.name }}</span>
      </div>
      <span class="eim-close" @click="onClose">×</span>
    </div>

    <!-- 设备基本信息 -->
    <div class="eim-info-section">
      <div class="eim-info-grid">
        <div class="eim-info-item">
          <span class="eim-info-label">所属公司</span>
          <span class="eim-info-value">{{ equip.company }}</span>
        </div>
        <div class="eim-info-item">
          <span class="eim-info-label">流水号</span>
          <span class="eim-info-value">{{ equip.serialNo }}</span>
        </div>
        <div class="eim-info-item">
          <span class="eim-info-label">装备名称</span>
          <span class="eim-info-value">{{ equip.equipName }}</span>
        </div>
        <div class="eim-info-item">
          <span class="eim-info-label">装备类型</span>
          <span class="eim-info-value">{{ equip.equipType }}</span>
        </div>
        <div class="eim-info-item eim-info-item-full">
          <span class="eim-info-label">感知编号</span>
          <span class="eim-info-value">{{ equip.sensorNo }}</span>
        </div>
      </div>
    </div>

    <!-- 测点列表 -->
    <div class="eim-points-section">
      <div class="eim-points-header">
        <span class="eim-points-title">测点列表</span>
        <div class="eim-points-search">
          <Input
            v-model="searchKeyword"
            placeholder="请输入搜索关键词"
            clearable
            class="eim-search-input"
          />
        </div>
      </div>

      <!-- 测点分组列表 -->
      <div class="eim-points-body">
        <div
          v-for="(group, groupIdx) in displayGroups"
          :key="groupIdx"
          class="eim-point-group"
        >
          <!-- 分组标题（可折叠） -->
          <div class="eim-group-header" @click="toggleGroup(groupIdx)">
            <span class="eim-group-name">{{ group.name }}</span>
            <span class="eim-group-arrow" :class="group.expanded ? 'arrow-up' : 'arrow-down'">
              <img src="../css/images/arrow-down.png" alt="">
            </span>
          </div>

          <!-- 分组表格 -->
          <div v-if="group.expanded" class="eim-group-body">
            <Table
              :data="group.pageData"
              :columns="pointColumns"
              :border="false"
              size="small"
              no-data-text="暂无数据"
              @on-row-click="onRowClick"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 测点详情弹窗 -->
    <Modal
      v-model="showPointDetail"
      :width="560"
      :footer-hide="true"
      class-name="point-detail-modal-wrapper"
      :styles="{ top: '40px' }"
    >
      <PointDetailModal
        :visible="showPointDetail"
        :point="currentPoint"
        @update:visible="showPointDetail = $event"
        @close="showPointDetail = false"
      />
    </Modal>
  </div>
</template>

<script>
import PointDetailModal from './PointDetailModal.vue';
export default {
  name: 'EquipInfoModal',
  components: { PointDetailModal },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    equipId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      searchKeyword: '',
      showPointDetail: false,
      currentPoint: {},
      groups: [
        {
          name: '模拟量-温度',
          expanded: true,
          currentPage: 1,
          pageSize: 10,
          points: [
            { seq: 1, name: '定子A温度', value: '106.00°C', time: '2026-07-23 18:00:00' },
            { seq: 2, name: '定子C温度', value: '98.00°C', time: '2026-07-23 18:00:00' },
            { seq: 3, name: '瓦斯泵温度', value: '31.00°C', time: '2026-07-23 18:00:00' },
            { seq: 4, name: '电机后轴温度', value: '63.00°C', time: '2026-07-23 18:00:00' }
          ]
        },
        {
          name: '模拟量-默认分组',
          expanded: true,
          currentPage: 1,
          pageSize: 10,
          points: [
            { seq: 1, name: '压力', value: '-3Kpa', time: '2026-07-23 18:00:00' }
          ]
        },
        {
          name: '开关量-默认分组',
          expanded: true,
          currentPage: 1,
          pageSize: 10,
          points: [
            { seq: 1, name: '开关状态', value: '是', time: '2026-07-23 18:00:00' },
            { seq: 2, name: '缺水状态', value: '否', time: '2026-07-23 18:00:00' }
          ]
        }
      ]
    }
  },
  computed: {
    equip() {
      return {
        name: '1#瓦斯泵',
        company: '肖家洼',
        serialNo: '27045788',
        equipName: '1#瓦斯泵',
        equipType: '瓦斯抽采',
        sensorNo: 'WSCC-1#WS'
      }
    },
    pointColumns() {
      return [
        { type: 'seq', title: '序号', key: 'seq', width: 70, align: 'center' },
        { title: '测点名称', key: 'name', minWidth: 140 },
        { title: '数值', key: 'value', minWidth: 120, align: 'center' },
        { title: '数据时间', key: 'time', minWidth: 180 }
      ]
    },
    filteredGroups() {
      if (!this.searchKeyword.trim()) return this.groups
      const kw = this.searchKeyword.trim().toLowerCase()
      return this.groups.map(group => ({
        ...group,
        points: group.points.filter(p =>
          p.name.toLowerCase().includes(kw) ||
          String(p.value).toLowerCase().includes(kw)
        )
      })).filter(g => g.points.length > 0)
    },
    displayGroups() {
      return this.filteredGroups.map(group => {
        if (!group.currentPage) group.currentPage = 1
        const start = (group.currentPage - 1) * group.pageSize
        const pageData = group.points.slice(start, start + group.pageSize)
        return {
          ...group,
          total: group.points.length,
          pageData
        }
      })
    }
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    toggleGroup(idx) {
      const group = this.filteredGroups[idx]
      if (group) {
        group.expanded = !group.expanded
      }
    },
    onRowClick(row) {
      const group = this.filteredGroups.find(g =>
        g.points.some(p => p.seq === row.seq && p.name === row.name)
      )
      const title = group ? `${group.name}/${row.name}` : row.name
      this.currentPoint = {
        title,
        dataType: group ? group.name.split('-')[0] : '模拟量',
        unit: row.value.replace(/[\d.\-]/g, ''),
        code: '',
        range: '不限-不限',
        enabled: '是'
      }
      this.showPointDetail = true
    }
  }
}
</script>

<style scoped>
.equip-info-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 14px;
}

/* ===== 头部（与 PersonInfoModal 一致） ===== */
.eim-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding-left: 42px;
  background: url('../css/images/modal-header.png') no-repeat;
  background-size: 100% 100%;
}

.eim-title {
  display: flex;
  align-items: center;
  font-weight: bold;
font-size: 16px;
color: #333333;
}

.eim-title-arrow {
  color: #1764e8;
  margin-right: 6px;
  font-size: 12px;
  flex-shrink: 0;
}

.eim-title-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eim-close {
  font-size: 22px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  flex-shrink: 0;
}

.eim-close:hover {
  color: #333;
}

/* ===== 设备基本信息 ===== */
.eim-info-section {
  padding: 16px;
  flex-shrink: 0;
  background: #F3F7F9;
  margin: 20px 16px;
}

.eim-info-grid {
  
}

.eim-info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  gap: 10px;
  line-height: 26px;
}


.eim-info-label {
  color: #999;
  flex-shrink: 0;
  width: 60px;
  text-align: right;

}

.eim-info-value {
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 测点列表 ===== */
.eim-points-section {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.eim-points-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.eim-points-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  position: relative;
  padding-left: 10px;
}

.eim-points-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: #1764e8;
  border-radius: 2px;
}

.eim-search-input {
  width: 200px;
}

/* ===== 测点分组 ===== */
.eim-point-group {
  margin-bottom: 8px;
}

.eim-group-header {
  display: flex;
  align-items: center;
  height: 40px;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.eim-group-name {
  font-weight: bold;
font-size: 14px;
color: #333333;
}

.eim-group-arrow {
  display: inline-flex;
  align-items: center;
  color: #808695;
}

.eim-group-arrow.arrow-up img {
  transform: rotate(180deg);
}

.eim-group-body {
  margin-top: 4px;
}

.eim-group-body >>> .ivu-table-wrapper {
  border: none;
  border-radius: 4px;
  overflow: hidden;
}

.eim-group-body >>> .ivu-table-header thead tr th {
  height: 42px;
  padding: 0 8px;
  background: #f5f7fa;
  font-size: 14px;
  color: #666;
  border: none;
}

.eim-group-body >>> .ivu-table-body tr td {
  height: 42px;
  padding: 0 8px;
  font-size: 14px;
  color: #333;
  border: none;
}

.eim-group-body >>> .ivu-table-cell {
  padding: 0 12px;
}

.eim-group-body >>> .ivu-table .ivu-table-row:nth-child(odd) td {
  background: #fff;
}

.eim-group-body >>> .ivu-table .ivu-table-row:nth-child(even) td {
  background: #f8fafc;
}

.eim-group-body >>> .ivu-table .ivu-table-row:hover td {
  background: #e6f4ff !important;
}

.eim-group-body >>> .ivu-table {
  border: none;
}

.eim-group-body >>> .ivu-table-bordered:before,
.eim-group-body >>> .ivu-table-bordered:after {
  display: none;
}

.eim-points-body {
  max-height: 400px;
  overflow-y: auto;
}
</style>

<style>
.equip-info-modal-wrapper .ivu-modal-body {
  padding: 0;
}
</style>
