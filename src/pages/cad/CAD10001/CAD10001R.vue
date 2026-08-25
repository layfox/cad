<template>
    <div id="CAD10001R">
        <div class="page-body">
            <div class="page-header">
                <Button type="primary" v-if="currentStep == 0" @click="save">保存</Button>
                <Button type="primary" @click="onStep(1)" v-if="currentStep == 0">图纸解析</Button>
                <Button type="primary" @click="onStep(2)" v-if="currentStep == 1">点位绑定</Button>
                <Button type="primary" v-if="currentStep == 2">复制旧版本测点</Button>
                <Button type="primary" @click="onStep(3)" v-if="currentStep == 2 && entity.TZPZ_STA === '03'">发布版本</Button>
                <Button type="primary" @click="stopVersion" v-if="currentStep == 3">停用版本</Button>
                <Button type="primary" @click="setDefault" v-if="currentStep == 3">设置默认页</Button>
                <Button v-if="currentStep > 0" @click="onStep(currentStep - 1)">返回上一步</Button>
            </div>
            <div class="page-main">
                <div class="step-container">
                    <div class="step-item" @click="onStep(index)" :class="currentStep >= index ? 'step-item-active' : ''"
                        v-for="(item, index) in steps" :key="index">
                        <span class="step-item-icon"></span>
                        <span class="step-item-text">{{ item.title }}</span>
                        <img v-if="index != 3" src="./css/images/divider.png" alt="" class="step-item-divider">
                    </div>
                    <div class="step-info">{{ stepInfo[entity.TZPZ_STA] || '待解析' }}</div>
                </div>
                <div class="page-content">
                    <div class="step-content"
                        :style="{ height: currentStep == 3 ? 'auto' : '100%', 'margin-bottom': currentStep == 3 ? '16px' : '', }"
                        v-show="currentStep == 0 || currentStep == 3">
                        <div class="step-content-header">图纸选择</div>
                        <div class="form-container">
                            <Form ref="sForm" :model="entity" :label-colon="false" class="s-form">
                                <Row :gutter="56">
                                    <Col :span="6">
                                    <FormItem label="配置编号">
                                        <Input v-model="entity.TZPZ_ID" disabled />
                                    </FormItem>
                                    </Col>
                                    <Col :span="6">
                                    <FormItem label="图纸信息名称" prop="TZXX_NO"
                                        :rules="[{ required: true, message: '请选择图纸信息', trigger: 'change' }]">
                                        <Input :disabled="entity.TZPZ_STA && entity.TZPZ_STA !== '01'"
                                            v-model="entity.TZXX_NO" @click="onChoose" style="cursor:pointer">
                                        <Button @click="selectTz" slot="append" icon="ios-more"></Button>
                                        </Input>
                                    </FormItem>
                                    </Col>
                                    <Col :span="6">
                                    <FormItem label="图纸信息编码">
                                        <Input v-model="entity.TZXX_ID" disabled />
                                    </FormItem>
                                    </Col>
                                    <Col :span="6">
                                    <FormItem label="图纸版本号">
                                        <Input v-model="entity.TZ_VERSION" disabled />
                                    </FormItem>
                                    </Col>
                                </Row>
                                <Row :gutter="56">
                                    <Col :span="6">
                                    <FormItem label="配置人员" prop="TZPZ_USR"
                                        :rules="[{ required: true, message: '请选择配置人员', trigger: 'change' }]">
                                        <Input :disabled="entity.TZPZ_STA == '04'" v-model="entity.TZPZ_USR"
                                            placeholder="请选择配置人员">
                                        </Input>
                                    </FormItem>
                                    </Col>
                                    <Col :span="6">
                                    <FormItem label="配置日期" prop="TZPZ_DAT"
                                        :rules="[{ validator: (rule, value, callback) => { value ? callback() : callback('请选择配置日期'); }, trigger: 'change' }]">
                                        <DatePicker :disabled="entity.TZPZ_STA == '04'" v-model="entity.TZPZ_DAT"
                                            type="date" placeholder="请选择配置日期" style="width: 100%" />
                                    </FormItem>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                    </div>
                    <div class="step-content" v-show="currentStep == 1 || currentStep == 2 || currentStep == 3">
                        <div class="step-content-header">{{ currentStep == 1 ? '图纸解析' : '点位绑定' }}</div>
                        <div class="viewer-container">
                            <div class="viewer-panel" :class="panelCollapsed ? '' : 'expand'" v-show="currentStep == 1">
                                <ViewerPanel v-show="!panelCollapsed" :layers="layers" :points="pointList"
                                    @toggle-layer="onToggleLayer" @zoom-to-point="zoomToPoint"
                                    style="height:calc(100% - 36px);margin-bottom: 16px;" />
                                <div v-if="panelCollapsed" class="viewer-panel-btn" @click="panelCollapsed = false">
                                    <img src="./css/images/expand.png" alt="">
                                </div>
                                <div v-else class="viewer-panel-btn" @click="panelCollapsed = true">
                                    <img src="./css/images/collapse.png" alt="">
                                </div>
                            </div>
                            <div class="viewer-panel panel1" :class="panelCollapsed1 ? '' : 'expand'"
                                v-show="currentStep == 2">
                                <ViewerPanel1 v-show="!panelCollapsed1" :points="points" @zoom-to-point="zoomToPoint"
                                    @delete-points="onDeletePoints" @auto-match="onAutoMatch"
                                    @manual-match="onManualMatch" @auto-place="onAutoPlace"
                                    @manual-place="onManualPlace" @unmatch="onUnmatch" @add-points="onAddPoints"
                                    style="height:calc(100% - 36px);margin-bottom: 16px;" />
                                <div v-if="panelCollapsed1" class="viewer-panel-btn" @click="panelCollapsed1 = false">
                                    <img src="./css/images/expand.png" alt="">
                                </div>
                                <div v-else class="viewer-panel-btn" @click="panelCollapsed1 = true">
                                    <img src="./css/images/collapse.png" alt="">
                                </div>
                            </div>
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
                                <!-- <div ref="markerLayer" class="marker-layer"></div>
                        <div class="svg-container" ref="matchLineContainer">
                        </div> -->
                                <!-- <div class="marker-container">
                            <div class="marker-item" :style="{left: item.screenX + 'px', top: item.screenY + 'px'}" v-for="(item, index) in pointList" :key="index"></div>
                        </div> -->
                            </div>
                            <div v-if="showManualMatchPop" class="manual‑match‑popover"
                                :style="{ left: popoverPos.x + 'px', top: popoverPos.y + 'px' }">
                                <div class="pop‑title">人工匹配</div>
                                <div class="pop‑content">
                                    <div class="pop‑row">实时测点：{{ popData.realPoint.PT_NAM }}</div>
                                    <div class="pop‑row">图纸点位：{{ popData.drawPoint.name }}</div>
                                </div>
                                <div class="pop‑footer">
                                    <Button class="btn‑cancel" @click="closeManualPop">取消</Button>
                                    <Button type="primary" class="btn‑confirm" @click="handlePopConfirm">匹配</Button>
                                </div>
                            </div>
                            <div v-if="showPointInfoModal" class="mx-tooltip" :style="{left: detailPos.x + 'px', top: detailPos.y + 'px'}">
                               {{ pointInfo }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- 人工布点弹窗 -->
        <Modal v-model="manualPlaceVisible" width="770" :mask-closable="false" class-name="custom-modal1"
            :footer-hide="true">
            <ManualPlaceDialog ref="manualPlaceForm" :survey-point="selectedSurveyPoint"
                :has-coord-fill="manualPlaceHasCoordFill" @pick-request="onPickCoordinateFromCanvas"
                @confirm="onManualPlaceConfirm" @cancel="onManualPlaceCancel" />
        </Modal>
        <Modal v-model="showTz" :width="800" :footer-hide="true" class-name="custom-modal1" :styles="{ top: '40px' }">
            <TzModal :visible="showTz" :orgNo="orgNo" @update:visible="showTz = $event" @close="showTz = false"
                @confirm="onSelectTz" />
        </Modal>
    </div>
</template>

<script>
import CAD10001R from './js/CAD10001R';
import ManualPlaceDialog from './dialog/ManualPlaceDialog.vue';
import TzModal from './dialog/tzModal.vue';
import PointSelectModal from './dialog/PointSelectModal.vue';
export default {
    name: 'CAD10001R',
    mixins: [CAD10001R],
    components: { ManualPlaceDialog, TzModal, PointSelectModal }
}
</script>

<style scoped>
@import url('./css/CAD10001R.css');
</style>

<style>
.custom-modal1 .ivu-modal-body {
    padding: 0;
}

.custom-modal1 .ivu-modal-close {
    top: 8px;
    color: #8B99B9;
    font-weight: bold;
}

#CAD10001R table {
    width: 100% !important;
}
</style>