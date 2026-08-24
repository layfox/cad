<template>
  <div class="detail-content">
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">配置编号</span>
        <span class="detail-value">{{ info.TZPZ_ID || '-' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">配置人员</span>
        <span class="detail-value">{{ info.TZPZ_USR || '-' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">图纸信息编码</span>
        <span class="detail-value">{{ info.TZXX_ID || '-' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">图纸信息主键</span>
        <span class="detail-value">{{ info.TZPZ_NO || '-' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">图纸版本</span>
        <span class="detail-value">{{ info.TZ_VERSION || '-' }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">配置状态</span>
        <span class="detail-value">
          <span
            class="status-tag"
            :class="{
              'status-wait-parse': info.TZPZ_STA === '待解析',
              'status-wait-bind': info.TZPZ_STA === '待绑定',
              'status-wait-publish': info.TZPZ_STA === '待发布',
              'status-published': info.TZPZ_STA === '发布'
            }"
          >{{ info.TZPZ_STA || '-' }}</span>
        </span>
      </div>
      <div class="detail-item">
        <span class="detail-label">配置日期</span>
        <span class="detail-value">{{ info.TZPZ_DAT || '-' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailModal',
  props: {
    info: {
      type: Object,
      default: () => ({})
    }
  }
}
</script>

<style scoped>
.detail-content {
  font-size: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #eef1f6;
}

.detail-label {
  font-size: 12px;
  color: #888;
  line-height: 1;
}

.detail-value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
  word-break: break-all;
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.status-wait-parse {
  background: #fff7e6;
  color: #faad14;
  border: 1px solid #ffe7ba;
}

.status-wait-bind {
  background: #e6f4ff;
  color: #1764e8;
  border: 1px solid #bae0ff;
}

.status-wait-publish {
  background: #f9f0ff;
  color: #722ed1;
  border: 1px solid #e3bcff;
}

.status-published {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
</style>
