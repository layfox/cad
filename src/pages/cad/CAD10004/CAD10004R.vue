<template>
  <div id="CAD10004R">
    <div class="page-body">
      <div class="viewer-header">
        <span class="viewer-title">图纸解析</span>
        <span class="viewer-file">{{ fileName }}</span>
      </div>

      <div class="viewer-container">
        <aside
          class="draw-config-panel"
          :class="{ 'panel-collapsed': panelCollapsed }"
        >
          <div class="draw-config-panel-inner">
            <div class="draw-config-toolbar">
              <Button type="primary" plain @click="openWorkFaceDialog">
                <Icon type="md-add" />
                添加工作面
              </Button>
              <Button type="primary" plain @click="openSectionDialog">
                <Icon type="md-add" />
                添加断面
              </Button>
              <Button plain @click="deleteSelectedConfigurations">
                <Icon type="ios-trash-outline" />
                删除图层
              </Button>
            </div>

            <div class="draw-config-tabs">
              <button
                type="button"
                class="draw-config-tab"
                :class="{ active: activeConfigTab === 'workface' }"
                @click="activeConfigTab = 'workface'"
              >
                工作面
                <span>({{ workFaces.length }})</span>
              </button>
              <button
                type="button"
                class="draw-config-tab"
                :class="{ active: activeConfigTab === 'section' }"
                @click="activeConfigTab = 'section'"
              >
                断面
                <span>({{ sections.length }})</span>
              </button>
            </div>

            <div class="draw-config-list">
              <template v-if="activeConfigTab === 'workface'">
                <div class="draw-config-list-head">
                  <Checkbox
                    :value="workFaceAllSelected"
                    :indeterminate="workFaceIndeterminate"
                    @on-change="toggleAllWorkFaces"
                  />
                  <span class="col-seq">序号</span>
                  <span class="col-name">工作面名称</span>
                  <span class="col-code">工作面编码</span>
                </div>
                <div
                  v-for="(item, index) in workFaces"
                  :key="item.id"
                  class="draw-config-row"
                  :class="{ selected: isWorkFaceSelected(item.id) }"
                >
                  <Checkbox
                    :value="isWorkFaceSelected(item.id)"
                    @on-change="toggleWorkFace(item.id)"
                  />
                  <button
                    type="button"
                    class="row-zoom"
                    title="定位到工作面"
                    @click="zoomToConfiguration(item, 'workface')"
                  >
                    <Icon type="ios-search" />
                  </button>
                  <span class="col-seq">{{ index + 1 }}</span>
                  <button
                    type="button"
                    class="col-name row-name"
                    @click="zoomToConfiguration(item, 'workface')"
                  >
                    {{ item.name }}
                  </button>
                  <span class="col-code">{{ item.code }}</span>
                </div>
              </template>

              <template v-else>
                <div class="draw-config-list-head">
                  <Checkbox
                    :value="sectionAllSelected"
                    :indeterminate="sectionIndeterminate"
                    @on-change="toggleAllSections"
                  />
                  <span class="col-seq">序号</span>
                  <span class="col-name">断面名称</span>
                  <span class="col-code">断面编码</span>
                </div>
                <div
                  v-for="(item, index) in sections"
                  :key="item.id"
                  class="draw-config-row"
                  :class="{ selected: isSectionSelected(item.id) }"
                >
                  <Checkbox
                    :value="isSectionSelected(item.id)"
                    @on-change="toggleSection(item.id)"
                  />
                  <button
                    type="button"
                    class="row-zoom"
                    title="定位到断面"
                    @click="zoomToConfiguration(item, 'section')"
                  >
                    <Icon type="ios-search" />
                  </button>
                  <span class="col-seq">{{ index + 1 }}</span>
                  <button
                    type="button"
                    class="col-name row-name"
                    @click="openSectionConfig(item)"
                  >
                    {{ item.name }}
                  </button>
                  <span class="col-code">{{ item.code }}</span>
                </div>
              </template>
            </div>
          </div>

          <button
            type="button"
            class="collapse-btn"
            :title="panelCollapsed ? '展开配置面板' : '收起配置面板'"
            @click="panelCollapsed = !panelCollapsed"
          >
            <Icon :type="panelCollapsed ? 'md-arrow-forward' : 'md-arrow-back'" />
          </button>
        </aside>

        <div class="viewer-content">
          <div ref="viewerContainer" class="viewer-box">
            <canvas ref="mxcadCanvas" id="mxcad"></canvas>
          </div>
          <div v-if="loading" class="loading-overlay">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <div class="loading-text">文件加载解析中，请稍候...</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal
      v-model="workFaceDialogVisible"
      :width="720"
      :mask-closable="false"
      :footer-hide="true"
      class-name="cad10004-config-modal"
      @on-cancel="closeWorkFaceDialog"
    >
      <WorkFaceDialog
        ref="workFaceDialog"
        :visible="workFaceDialogVisible"
        :value="editingWorkFace"
        :next-code="nextWorkFaceCode"
        @pick-coordinate="onPickCoordinate"
        @confirm="onSaveWorkFace"
        @cancel="closeWorkFaceDialog"
      />
    </Modal>

    <Modal
      v-model="sectionDialogVisible"
      :width="650"
      :mask-closable="false"
      :footer-hide="true"
      class-name="cad10004-config-modal"
      @on-cancel="closeSectionDialog"
    >
      <SectionDialog
        ref="sectionDialog"
        :visible="sectionDialogVisible"
        :value="editingSection"
        :work-faces="workFaces"
        :next-code="nextSectionCode"
        @pick-coordinate="onPickCoordinate"
        @confirm="onSaveSection"
        @cancel="closeSectionDialog"
      />
    </Modal>
  </div>
</template>

<script>
import CAD10004R from './js/CAD10004R'
import WorkFaceDialog from './dialog/WorkFaceDialog.vue'
import SectionDialog from './dialog/SectionDialog.vue'

export default {
  name: 'CAD10004R',
  mixins: [CAD10004R],
  components: {
    WorkFaceDialog,
    SectionDialog
  }
}
</script>

<style scoped>
@import url('./css/CAD10004R.css');
</style>

<style>
.cad10004-config-modal {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cad10004-config-modal .ivu-modal {
  top: 0 !important;
}

.cad10004-config-modal .ivu-modal-body {
  padding: 0;
}

.cad10004-config-modal .ivu-modal-close {
  top: 10px;
  z-index: 3;
}
</style>
