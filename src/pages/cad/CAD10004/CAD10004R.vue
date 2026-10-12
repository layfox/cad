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
            <div class="draw-config-tabbar">
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
                  断层
                  <span>({{ sections.length }})</span>
                </button>
              </div>
              <Button
                class="draw-config-add"
                type="primary"
                plain
                @click="openActiveConfigDialog"
              >
                <Icon type="md-add" />
                新增
              </Button>
            </div>

            <div class="draw-config-list">
              <template v-if="activeConfigTab === 'workface'">
                <Table
                  class="draw-config-table"
                  :columns="workFaceColumns"
                  :data="pagedWorkFaces"
                  :row-class-name="configRowClassName"
                  size="small"
                  :border="false"
                  no-data-text="暂无工作面"
                  @on-row-dblclick="onConfigRowDblClick"
                />
                <div class="draw-config-pager">
                  <Page
                    show-total
                    :current="workFacePage"
                    :page-size="configPageSize"
                    :total="workFaces.length"
                    @on-change="onWorkFacePageChange"
                  />
                </div>
              </template>

              <template v-else>
                <Table
                  class="draw-config-table"
                  :columns="sectionColumns"
                  :data="pagedSections"
                  :row-class-name="configRowClassName"
                  size="small"
                  :border="false"
                  no-data-text="暂无断层"
                  @on-row-dblclick="onConfigRowDblClick"
                />
                <div class="draw-config-pager">
                  <Page
                    show-total
                    :current="sectionPage"
                    :page-size="configPageSize"
                    :total="sections.length"
                    @on-change="onSectionPageChange"
                  />
                </div>
              </template>
            </div>
          </div>

          <button
            type="button"
            class="collapse-btn"
            :title="panelCollapsed ? '展开配置面板' : '收起配置面板'"
            @click="panelCollapsed = !panelCollapsed"
          ></button>
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
      :width="640"
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
        :can-delete="workFaceExists"
        @pick-coordinate="onPickCoordinate"
        @confirm="onSaveWorkFace"
        @delete="removeEditingWorkFace"
        @cancel="closeWorkFaceDialog"
      />
    </Modal>

    <Modal
      v-model="sectionDialogVisible"
      :width="600"
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
        @draw-polygon="onDrawSectionPolygon"
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
/* 表格内部节点由 iview 渲染，scoped 样式覆盖不到，只能放在全局样式里用 #CAD10004R 限定。
   行高、表头底色、斑马纹取自 CAD10001R ViewerPanel 的 .vp-body 规则 */
#CAD10004R .draw-config-table .ivu-table-header thead tr th {
  height: 42px;
  padding: 0 8px;
  color: #515a6e;
  font-size: 13px;
  background: #fff;
}

#CAD10004R .draw-config-table .ivu-table {
    background: transparent;
}

#CAD10004R .draw-config-table .ivu-table-body tr td {
  height: 42px;
  padding: 0 8px;
}

#CAD10004R .draw-config-table .ivu-table-body tr:nth-child(2n + 1) td {
    background: #EDF1F9;
}

#CAD10004R .draw-config-table .ivu-table-body tr:nth-child(2n + 2) td {
  background: #fff;
}

#CAD10004R .draw-config-table .ivu-table-cell {
  padding: 0;
}

#CAD10004R .draw-config-table .ivu-table-body .ivu-table-row.config-row-active td {
  background: #e8f2ff;
}

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
  top: 8px;
  z-index: 3;
}
</style>
