<template>
    <div id="CAD10002R">
      <div class="sui-page-body">
        <div class="page-header">
            <div class="tabs-container">
              <div class="tab-item" @click="onTabClick(item, index)" :class="tabIndex==index?'tab-item-active':''" v-for="(item, index) in tabs" :key="index">{{ item }}</div>
            </div>
            <div class="select-container" @click="showEquipModal = true">
              <span class="select-text">{{ fileName }}</span>
              <img src="./css/images/arrow-down.png" alt="">
            </div>
        </div>
        <div class="page-content">
          <div class="viewer-panel" :style="{width: panelCollapsed ? '' : '545px'}" :class="panelCollapsed?'':'expand'">
            <template v-if="tabIndex === 0">
                <ViewerPanel
                    v-show="!panelCollapsed"
                    :categories="categories"
                    style="height: calc(100% - 36px); margin-bottom: 16px;"
                />
            </template>
            <template v-if="tabIndex === 1">
                <ViewerPanel1
                    v-show="!panelCollapsed"
                    :categories="categories1"
                    style="height: calc(100% - 36px); margin-bottom: 16px;"
                />
            </template>
            <template v-if="tabIndex === 2">
                <ViewerPanel2
                    v-show="!panelCollapsed"
                    :categories="categories2"
                    style="height: calc(100% - 36px); margin-bottom: 16px;"
                />
            </template>
            <template v-if="tabIndex === 3">
                <ViewerPane3
                    v-show="!panelCollapsed"
                    :categories="categories"
                    style="height: calc(100% - 36px); margin-bottom: 16px;"
                />
            </template>
              <div v-if="panelCollapsed" class="viewer-panel-btn" @click="panelCollapsed = false">
                  <img src="./css/images/expand.png" alt="">
              </div>
              <div v-else class="viewer-panel-btn" @click="panelCollapsed = true">
                  <img src="./css/images/collapse.png" alt="">
              </div>
          </div>
          <div class="viewer-content">
                <div ref="viewerContainer" class="viewer-box">
                    <canvas ref="mxcadCanvas" id="mxcad"></canvas>
                </div>
            </div>
        </div>
      </div>

      <!-- 人员信息弹窗 -->
      <Modal
        v-model="showPersonModal"
        :width="600"
        :footer-hide="true"
        class-name="custom-modal"
        :styles="{ top: '40px' }"
      >
        <PersonInfoModal
          :visible="showPersonModal"
          @update:visible="showPersonModal = $event"
          @close="showPersonModal = false"
        />
      </Modal>

      <!-- 安全检测弹窗 -->
      <Modal
        v-model="showSafetyCheckModal"
        :width="600"
        :footer-hide="true"
        class-name="custom-modal"
        :styles="{ top: '40px' }"
      >
        <SafetyCheckModal
          :visible="showSafetyCheckModal"
          @update:visible="showSafetyCheckModal = $event"
          @close="showSafetyCheckModal = false"
          @alarm-handle="onAlarmHandle"
        />
      </Modal>

      <!-- 设备详情弹窗 -->
      <Modal
        v-model="showEquipModal"
        :width="600"
        :footer-hide="true"
        class-name="custom-modal"
        :styles="{ top: '40px' }"
      >
        <EquipInfoModal
          :visible="showEquipModal"
          @update:visible="showEquipModal = $event"
          @close="showEquipModal = false"
        />
      </Modal>
    </div>
</template>

<script>
import CAD10002R from './js/CAD10002R';
import PersonInfoModal from './dialog/PersonInfoModal.vue';
import SafetyCheckModal from './dialog/SafetyCheckModal.vue';
import EquipInfoModal from './dialog/EquipInfoModal.vue';
export default {
  name: 'CAD10002R',
  mixins: [CAD10002R],
  components: {
    PersonInfoModal,
    SafetyCheckModal,
    EquipInfoModal
  },
  data() {
    return {
      showPersonModal: false,
      showSafetyCheckModal: false,
      showEquipModal: false
    }
  },
  methods: {
    onAlarmHandle() {
      this.$Message.info('告警处理功能待接入')
    },
  },
  data() {
    return {
      showPersonModal: false,
      showSafetyCheckModal: false,
      showEquipModal: false,
    }
  },
}
</script>

<style scoped>
@import url('./css/CAD10002R.css');
</style>

<style>
  .custom-modal .ivu-modal-body {
    padding: 0;
  }

  .custom-modal .ivu-modal-close {
    top: 4px;
    color: #8B99B9;
    font-weight: bold;
  }
</style>
