<template>
    <div id="CAD10002R">
      <div class="sui-page-body">
        <div class="page-header">
            <div class="tabs-container">
              <div class="tab-item" @click="onTabClick(item, index)" :class="tabIndex==index?'tab-item-active':''" v-for="(item, index) in tabs" :key="index">{{ item }}</div>
            </div>
            <div class="select-container" @click="showTz = true">
              <span class="select-text">{{ fileName }}</span>
              <img src="./css/images/arrow-down.png" alt="">
            </div>
        </div>
        <div class="page-content">
          <!-- <transition name="vierer-panel-slide" mode="out-in"> -->
            <div class="viewer-panel" :class="panelCollapsed?'panel-collapsed':''">
              <div class="viewer-panel-box" v-show="tabIndex === 0">
                  <ViewerPanel
                      ref="panel1Ref"
                      :categories="categories"
                      title="安全监测"
                      @zoom-to-point="zoomToPoint"
                      panel-key="safety"
                      @select-change="onPanelSelectChange"
                  />
              </div>
              <div class="viewer-panel-box" v-show="tabIndex === 1">
                  <ViewerPanel
                      ref="panel2Ref"
                      title="水文监测"
                      @zoom-to-point="zoomToPoint"
                      :categories="categories1"
                      panel-key="hydro"
                      @select-change="onPanelSelectChange"
                  />
              </div>
              <div class="viewer-panel-box" v-show="tabIndex === 2">
                  <ViewerPanel
                      ref="panel3Ref"
                      title="瓦斯抽采"
                      :categories="categories2"
                      panel-key="gas"
                      @zoom-to-point="zoomToPoint"
                      @select-change="onPanelSelectChange"
                  />
              </div>
              <div class="viewer-panel-box" v-show="tabIndex === 3">
                  <ViewerPanel
                      ref="panel4Ref"
                      :categories="categories3"
                      @zoom-to-point="zoomToPoint"
                      title="人员定位站"
                      panel-key="person"
                      @select-change="onPanelSelectChange"
                  />
              </div>
              <div class="collapse-btn" @click="panelCollapsed = !panelCollapsed"></div>
            </div>
          <!-- </transition> -->
          <div ref="viewerContent" class="viewer-content">
                <div ref="viewerContainer" class="viewer-box">
                    <canvas ref="mxcadCanvas" id="mxcad"></canvas>
                </div>
                <div v-if="loading" class="loading-overlay">
                            <div class="loading-content">
                                <div class="loading-spinner"></div>
                                <div class="loading-text">文件加载解析中，请稍候...</div>
                            </div>
                        </div>
                <div v-show="tooltip.show" class="mx-tooltip1" :style="{left: tooltip.x + 'px', top: tooltip.y + 'px'}">
                    {{ tooltip.text }}
                  </div>
            </div>
          <RiskWarning :orgNo="orgNo" />
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
          :TZPZ_NO="TZPZ_NO"
          :orgNo="orgNo"
          @update:visible="showPersonModal = $event"
          @close="showPersonModal = false"
        />
      </Modal>

      <!-- 告警闭环处理弹窗 -->
      <Modal
        v-model="showAlarmModal"
        :width="640"
        :footer-hide="true"
        class-name="custom-modal alarm-handle-modal-wrapper"
        :styles="{ top: '40px' }"
      >
        <AlarmHandleModal
          :visible="showAlarmModal"
          :alarm="currentAlarm"
          @update:visible="showAlarmModal = $event"
          @close="showAlarmModal = false"
          @step-change="onAlarmStepChange"
          @dispatch="onAlarmDispatch"
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
          :alarm="currentAlarm"
          :orgNo="orgNo"
          @update:visible="showSafetyCheckModal = $event"
          @close="showSafetyCheckModal = false"
          @alarm-handle="onAlarmHandle"
          :data="currentData"
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
          :TZPZ_NO="TZPZ_NO"
          :orgNo="orgNo"
          :data="currentData"
          @update:visible="showEquipModal = $event"
          @close="showEquipModal = false"
        />
      </Modal>
      <Modal
        v-model="showTz"
        :width="1100"
        :footer-hide="true"
        class-name="custom-modal tz-modal"
        :styles="{ top: '40px' }"
      >
        <TzModal
          :visible="showTz"
          :orgNo="orgNo"
          @update:visible="showTz = $event"
          @close="showTz = false"
          @confirm="onConfirmTz"
        />
      </Modal>
    </div>
</template>

<script>
import RiskWarning from './components/RiskWarning/RiskWarning.vue';
import CAD10002R from './js/CAD10002R';
export default {
  name: 'CAD10002R',
  mixins: [CAD10002R]
}
</script>

<style scoped>
@import url('./css/CAD10002R.css');
</style>

<style>
.custom-modal {
  display: flex;
  align-items: center;
  justify-content: center;
}
.custom-modal .ivu-modal {
  top: 0!important;
}
  .custom-modal .ivu-modal-body {
    padding: 0;
  }

  .custom-modal .ivu-modal-close {
    top: 4px;
    color: #8B99B9;
    font-weight: bold;
  }

  .tz-modal .ivu-modal-close {
    top: 8px;
  }

  .alarm-handle-modal-wrapper .ivu-modal-body {
    padding: 0;
  }

  #CAD10002R table {
    width: 100%!important;
  }
</style>
