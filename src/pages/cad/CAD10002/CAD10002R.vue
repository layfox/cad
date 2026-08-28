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
          <div class="viewer-panel" :style="{width: panelCollapsed ? '' : '545px'}" :class="panelCollapsed?'':'expand'">
            <template v-if="tabIndex === 0">
                <ViewerPanel
                    ref="panelSafety"
                    v-show="!panelCollapsed"
                    :categories="categories"
                    title="安全检测"
                    panel-key="safety"
                    style="height: calc(100% - 36px); margin-bottom: 16px;"
                    @select-change="onPanelSelectChange"
                />
            </template>
            <template v-if="tabIndex === 1">
                <ViewerPanel
                    ref="panelHydro"
                    v-show="!panelCollapsed"
                    title="水文检测"
                    :categories="categories1"
                    panel-key="hydro"
                    style="height: calc(100% - 36px); margin-bottom: 16px;"
                    @select-change="onPanelSelectChange"
                />
            </template>
            <template v-if="tabIndex === 2">
                <ViewerPanel
                    ref="panelGas"
                    v-show="!panelCollapsed"
                    title="瓦斯抽采"
                    :categories="categories2"
                    panel-key="gas"
                    style="height: calc(100% - 36px); margin-bottom: 16px;"
                    @select-change="onPanelSelectChange"
                />
            </template>
            <template v-if="tabIndex === 3">
                <ViewerPanel
                    ref="panelPerson"
                    v-show="!panelCollapsed"
                    :categories="categories3"
                    title="人员定位"
                    panel-key="person"
                    style="height: calc(100% - 36px); margin-bottom: 16px;"
                    @select-change="onPanelSelectChange"
                />
            </template>
              <div v-if="panelCollapsed" class="viewer-panel-btn" @click="panelCollapsed = false">
                  <img src="./css/images/expand.png" alt="">
              </div>
              <div v-else class="viewer-panel-btn" @click="panelCollapsed = true">
                  <img src="./css/images/collapse.png" alt="">
              </div>
          </div>
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
          @update:visible="showEquipModal = $event"
          @close="showEquipModal = false"
        />
      </Modal>
      <Modal
        v-model="showTz"
        :width="1000"
        :footer-hide="true"
        class-name="custom-modal tz-modal"
        :styles="{ top: '40px' }"
      >
        <TzModal
          :visible="showTz"
          @update:visible="showTz = $event"
          @close="showTz = false"
          @confirm="onConfirmTz"
        />
      </Modal>
    </div>
</template>

<script>
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
