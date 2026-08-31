<template>
  <div class="person-info-modal">
    <!-- 头部：姓名 + 关闭按钮 -->
    <div class="pim-header">
      <div class="pim-title">
        <span class="pim-title-name">{{ person.name }}</span>
      </div>
    </div>

    <!-- 人员基本信息 -->
    <div class="pim-info-section">
      <div class="pim-info-grid">
        <div class="pim-info-item">
          <span class="pim-info-label">所属公司</span>
          <span class="pim-info-value">{{ person.company }}</span>
        </div>
        <div class="pim-info-item">
          <span class="pim-info-label">职务</span>
          <span class="pim-info-value">{{ person.position }}</span>
        </div>
        <div class="pim-info-item">
          <span class="pim-info-label">定位卡号</span>
          <span class="pim-info-value">{{ person.cardNo }}</span>
        </div>
        <div class="pim-info-item">
          <span class="pim-info-label">联系方式</span>
          <span class="pim-info-value">{{ person.phone }}</span>
        </div>
        <div class="pim-info-item">
          <span class="pim-info-label">性别</span>
          <span class="pim-info-value">{{ person.gender }}</span>
        </div>
        <div class="pim-info-item">
          <span class="pim-info-label">当前位置</span>
          <span class="pim-info-value">{{ person.location }}</span>
        </div>
        <div class="pim-info-item">
          <span class="pim-info-label">部门</span>
          <span class="pim-info-value">{{ person.department }}</span>
        </div>
        <div class="pim-info-item">
          <span class="pim-info-label">是否井下</span>
          <span class="pim-info-value">{{ person.isUnderground }}</span>
        </div>
      </div>
    </div>

    <!-- 人员轨迹数据 -->
    <div class="pim-track-section">
      <div class="pim-track-header">
        <span class="pim-track-title">人员轨迹数据</span>
        <!-- <div class="pim-track-search">
          <Input
            v-model="searchKeyword"
            placeholder="请输入搜索关键词"
            clearable
            class="pim-search-input"
          />
        </div> -->
      </div>

      <!-- 时间筛选按钮 -->
      <div class="pim-time-tabs">
        <span v-for="(tab, idx) in timeTabs" :key="tab" class="pim-time-tab" :class="{ active: activeTimeTab === idx }"
          @click="activeTimeTab = idx">{{ tab }}</span>
        <span class="pim-entry-count">出入井次数 <strong>{{ trackRecords.length }}</strong> 次</span>
      </div>

      <!-- 轨迹记录列表 -->
      <div class="pim-track-list" v-if="trackRecords.length">
        <div v-for="(record, idx) in trackRecords" :key="idx" class="pim-track-card">
          <div class="pim-track-card-row">
            <span class="pim-track-label">入井时间</span>
            <span class="pim-track-value">{{ record.enterTime }}</span>
          </div>
          <div class="pim-track-card-row">
            <span class="pim-track-label">出井时间</span>
            <span class="pim-track-value">{{ record.exitTime }}</span>
          </div>
          <div class="pim-track-card-row">
            <span class="pim-track-label">时长</span>
            <span class="pim-track-value">{{ record.duration }}</span>
          </div>
          <div class="pim-track-detail">
            <span class="pim-track-link">轨迹详情 &gt;</span>
          </div>
        </div>
      </div>
      <div class="pim-track-empty" v-else>
        <img src="../css/images/no_data.jpg" alt="">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PersonInfoModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    personId: {
      type: String,
      default: ''
    },
    TZPZ_NO: {
      type: String,
      default: ''
    },
    orgNo: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      searchKeyword: '',
      activeTimeTab: 0,
      timeTabs: ['今天', '本周', '本月', '近7天', '近30天'],
      person: {
        name: '',
        company: '',
        position: '',
        cardNo: '',
        phone: '',
        gender: '',
        location: '',
        department: '',
        isUnderground: ''
      },
      trackRecords: []
    }
  },
  mounted() {
  },
  watch: {
    visible(val) {
      if (val) {
        this.getData()
      }
    }
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    async postData(url = "", data = {}) {
      data.param_orgNo = this.orgNo
      const response = await fetch(url, {
        method: "POST",

        body: JSON.stringify(data),
      });
      return response.json();
    },
    getData() {
      this.postData('/api/scaqyzt/getRydwRealtime', {
        TZPZ_NO: this.TZPZ_NO
      }).then(res => {
        const data = res.data
        this.person = {
          name: data.PL_NAM,
          company: data.ORG_SHOT_NAM,
          position: data.PL_DUTY,
          cardNo: data.CARD_CODE,
          phone: data.PL_PHONE,
          gender: data.GENDER_TYP,
          location: data.ORG_SHOT_NAM,
          department: data.DEP_NAM,
          isUnderground: data.JX_FLG
        }
      })
    }
  }
}
</script>

<style scoped>
.person-info-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 头部 ===== */
.pim-header {
  height: 40px;
  padding-left: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: url('../css/images//modal-header.png') no-repeat;
  background-size: 100% 100%;
}

.pim-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #333333;
}

.pim-title-arrow {
  color: #1764e8;
  margin-right: 6px;
  font-size: 12px;
}

.pim-title-name {
  font-size: 16px;
}

.pim-close {
  font-size: 22px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.pim-close:hover {
  color: #333;
}

/* ===== 基本信息区 ===== */
.pim-info-section {
  padding: 16px;
  flex-shrink: 0;
  background: #F3F7F9;
  margin: 20px 16px;
}

.pim-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 32px;
}

.pim-info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.pim-info-label {
  color: #999;
  flex-shrink: 0;
  width: 60px;
  text-align: right;
  margin-right: 10px;
}

.pim-info-value {
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 轨迹数据区 ===== */
.pim-track-section {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.pim-track-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pim-track-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  position: relative;
  padding-left: 10px;
}

.pim-search-input {
  width: 200px;
  height: 32px;
}

.pim-track-empty {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

/* ===== 时间筛选 ===== */
.pim-time-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.pim-time-tab {
  padding: 4px 14px;
  font-size: 14px;
  color: #666;
  background: #f0f2f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pim-time-tab:hover {
  color: #1764e8;
  background: #e6f0ff;
}

.pim-time-tab.active {
  color: #fff;
  background: #1764e8;
}

.pim-entry-count {
  margin-left: auto;
  font-size: 14px;
  color: #666;
}

.pim-entry-count strong {
  color: #1764e8;
  font-weight: 600;
}

/* ===== 轨迹卡片 ===== */
.pim-track-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow: auto;
}

.pim-track-card {
  background: url('../css/images/info-bg.png') no-repeat;
  background-size: 100% 100%;
  height: 134px;
  padding: 16px;
}

.pim-track-card-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 14px;
}

.pim-track-card-row:last-child {
  margin-bottom: 8px;
}

.pim-track-label {
  color: #888;
  width: 70px;
  flex-shrink: 0;
}

.pim-track-value {
  color: #333;
}

.pim-track-detail {
  margin-top: 4px;
  padding-top: 6px;
}

.pim-track-link {
  font-size: 14px;
  color: #1764e8;
  cursor: pointer;
}

.pim-track-link:hover {
  text-decoration: underline;
}
</style>
