<template>
    <div id="CAD10001R">
      <div class="sui-page-body">
        <div class="step-container">
            <div class="step-item" @click="onStep(index)" :class="currentStep>=index?'step-item-active':''" v-for="(item, index) in steps" :key="index">
                <span class="step-item-icon"></span>
                <span class="step-item-text">{{ item.title }}</span>
                <img v-if="index!=3" src="./css/images/divider.png" alt="" class="step-item-divider">
            </div>
            <div class="step-info">{{stepInfo[currentStep]}}</div>
            <!-- <Button type="success" icon="md-navigate" long @click="startMeasureCoord">坐标测量</Button> -->
        </div>
        <div class="page-content">
            <div class="step-content" v-show="currentStep==0">
                <div class="step-content-header">选择图纸</div>
                <div class="form-container">
                    <Form ref="sForm" :model="entity" :label-colon="false" class="s-form">
                        <Row :gutter="56">
                            <Col :span="6">
                                <FormItem label="配置编号">
                                    <Input v-model="entity.id" disabled />
                                </FormItem>
                            </Col>
                            <Col :span="6">
                                <FormItem label="图纸信息名称" prop="name" :rules="[{ required: true, message: '请选择图纸信息', trigger: 'change' }]">
                                    <Input v-model="entity.name" @click="onChoose" style="cursor:pointer">
                                        <Button slot="append" icon="ios-more"></Button>
                                    </Input>
                                </FormItem>
                            </Col>
                            <Col :span="6">
                                <FormItem label="图纸信息编码">
                                    <Input v-model="entity.code" disabled />
                                </FormItem>
                            </Col>
                            <Col :span="6">
                                <FormItem label="图纸版本号">
                                    <Input v-model="entity.version" disabled />
                                </FormItem>
                            </Col>
                        </Row>
                        <Row :gutter="56">
                            <Col :span="6">
                                <FormItem label="配置人员" prop="user" :rules="[{ required: true, message: '请选择配置人员', trigger: 'change' }]">
                                    <Select v-model="entity.user" placeholder="请选择配置人员">
                                        <Option value="管理员">管理员</Option>
                                        <Option value="工程师">工程师</Option>
                                        <Option value="审核员">审核员</Option>
                                    </Select>
                                </FormItem>
                            </Col>
                            <Col :span="6">
                                <FormItem label="配置日期" prop="date" :rules="[{ required: true, message: '请选择配置日期', trigger: 'change' }]">
                                    <DatePicker v-model="entity.date" type="date" placeholder="请选择配置日期" style="width: 100%" />
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </div>
            <div class="step-content" v-show="currentStep==1||currentStep==2">
                <div class="step-content-header">{{currentStep==1 ? '图纸解析' : '点位绑定'}}</div>
                <div class="viewer-container">
                    <div class="viewer-panel" :class="panelCollapsed?'':'expand'" v-show="currentStep==1">
                        <ViewerPanel
                            v-show="!panelCollapsed"
                            :layers="layers"
                            :points="pointList"
                            @toggle-layer="onToggleLayer"
                            @zoom-to-point="zoomToPoint"
                            style="height:calc(100% - 36px);margin-bottom: 16px;"
                        />
                        <div v-if="panelCollapsed" class="viewer-panel-btn" @click="panelCollapsed = false">
                            <img src="./css/images/expand.png" alt="">
                        </div>
                        <div v-else class="viewer-panel-btn" @click="panelCollapsed = true">
                            <img src="./css/images/collapse.png" alt="">
                        </div>
                    </div>
                    <div class="viewer-panel panel1" :class="panelCollapsed1?'':'expand'" v-show="currentStep==2">
                        <ViewerPanel1
                            v-show="!panelCollapsed1"
                            :points="points"
                            @zoom-to-point="zoomToPoint"
                            @delete-points="onDeletePoints"
                            style="height:calc(100% - 36px);margin-bottom: 16px;"
                        />
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
                        <!-- 点位悬浮提示框 -->
                        <!-- <div
                            v-if="hoverPoint"
                            class="point-tooltip"
                            :style="tooltipStyle"
                        >
                            <div class="tooltip-header">
                                <span class="tooltip-status status-matched">
                                    图纸点位
                                </span>
                            </div>
                            <div class="tooltip-body">
                                <div class="tooltip-row">
                                    <span class="tooltip-label">X 坐标：</span>
                                    <span class="tooltip-value">{{ hoverPoint.x }}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Y 坐标：</span>
                                    <span class="tooltip-value">{{ hoverPoint.y }}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">Z 坐标：</span>
                                    <span class="tooltip-value">{{ hoverPoint.z || '-' }}</span>
                                </div>
                                <div class="tooltip-row">
                                    <span class="tooltip-label">图层：</span>
                                    <span class="tooltip-value">{{ hoverPoint.layer || '-' }}</span>
                                </div>
                            </div>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import CAD10001R from './js/CAD10001R';
export default {
  name: 'CAD10001R',
  mixins: [CAD10001R]
}
</script>

<style scoped>
@import url('./css/CAD10001R.css');
</style>