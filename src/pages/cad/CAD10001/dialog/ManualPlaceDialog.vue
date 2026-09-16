<template>
    <div class="modal-container">
        <div class="modal-header">
            <div class="modal-title">
                <img src="../css/images/modal-icon.png" alt="">
                <span class="modal-title-text">选择图纸</span>
            </div>
        </div>
        <Form class="modal-body" label-position="top" ref="formRef" :model="form" :rules="rules">
            <Row :gutter="16">
                <Col span="12">
                    <FormItem label="点位编码" prop="code">
                        <Input v-model="form.code" disabled />
                    </FormItem>
                </Col>
                <Col span="12">
                    <FormItem label="点位名称" prop="name">
                        <Input v-model="form.name" disabled />
                    </FormItem>
                </Col>
                <Col span="12">
                    <FormItem label="点位坐标">
                <Row :gutter="8" type="flex" align="middle">
                    <Col span="8">
                        <InputNumber
                            v-model="form.x"
                            :precision="2"
                            :min="-Infinity"
                            :max="Infinity"
                            placeholder="X"
                            style="width:100%"
                        />
                    </Col>
                    <Col span="8">
                        <InputNumber
                            v-model="form.y"
                            :precision="2"
                            :min="-Infinity"
                            :max="Infinity"
                            placeholder="Y"
                            style="width:100%"
                        />
                    </Col>
                    <Col span="8">
                        <Button type="primary" long @click="onPickFromCanvas">选择坐标</Button>
                    </Col>
                </Row>
            </FormItem>
                </Col>
            </Row>
            
        </Form>
        <div class="dialog-footer">
            <Button @click="onCancel">取消</Button>
            <Button type="primary" @click="onConfirm">确认</Button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ManualPlaceDialog',
    props: {
        surveyPoint: { type: Object, default: null },
        // 坐标是否已由画布拾取回填（由父组件在点击画布后设为 true）
        hasCoordFill: { type: Boolean, default: false }
    },
    data() {
        return {
            form: { code: '', name: '', x: null, y: null },
            rules: {
                x: [{ required: true, message: '请输入 X 坐标', trigger: 'blur' }],
                y: [{ required: true, message: '请输入 Y 坐标', trigger: 'blur' }]
            }
        }
    },
    watch: {
        surveyPoint(val) {
            if (val) {
                this._fillFromSurvey(val)
            }
        },
        // 父组件通知坐标已回填时自动更新表单，不重新填充
        hasCoordFill(val) {
            if (!val) {
                // hasCoordFill 重置为 false，说明是重新打开弹窗，清空坐标
                this.form.x = null
                this.form.y = null
                return
            }
            // 坐标由画布拾取回填后触发，不重新填充
        }
    },
    methods: {
        resetPos() {
            this.form.x = null
            this.form.y = null
        },
        _fillFromSurvey(survey) {
            this.form.code = survey.PT_ID || ''
            this.form.name = survey.PT_NAM || ''
            // const existing = this._parseExistingCoord(survey)
            // // 如果已有坐标值（画布拾取回填的），不覆盖
            // if (existing && (this.form.x === null || this.form.y === null)) {
            //     this.form.x = existing[0]
            //     this.form.y = existing[1]
            // }
        },
        _parseExistingCoord(survey) {
            if (survey.PT_X_VALUE && survey.PT_Y_VALUE) return [parseFloat(survey.PT_X_VALUE), parseFloat(survey.PT_Y_VALUE)]
            return null
        },
        onPickFromCanvas() {
            this.$emit('pick-request')
        },
        onFillCoord(x, y) {
            // 坐标由画布拾取后回填
            this.form.x = x
            this.form.y = y
            this.$emit('fill-coord')
        },
        onConfirm() {
            if (this.form.x === null || this.form.x === undefined ||
                this.form.y === null || this.form.y === undefined) {
                this.$Message.warning('请输入完整的坐标信息')
                return
            }
            this.$emit('confirm', {
                code: this.form.code,
                name: this.form.name,
                x: Number(this.form.x),
                y: Number(this.form.y)
            })
        },
        onCancel() {
            this.$emit('cancel')
        }
    }
}
</script>

<style scoped>
.modal-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: 14px;
}

/* ===== 头部 ===== */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.modal-title {
  display: flex;
  align-items: center;
  font-weight: bold;
font-size: 16px;
color: #333333;
gap: 6px;
}
.modal-body {
    padding: 16px;
}
.dialog-footer {
    padding: 16px;
    text-align: right;
    border-top: 1px solid #e8eaec;
}
.dialog-footer .ivu-btn {
    margin-left: 8px;
}
</style>
