<template>
  <div class="color-picker" v-show="isShowColorPicker">
      <Sketch :value="value" @input="onInput" />Mx_Color
      <el-button  @click="hide" class="color-picker-close" type="danger" icon="el-icon-close" size="mini" circle></el-button>
  </div>
</template>

<script lang='ts'>
import { Component, Vue, Prop } from "vue-property-decorator";
import { Sketch } from 'vue-color';
@Component({
  name: "ColorPciker",
   components: {
	Sketch,
  },
})
export default class ColorPciker extends Vue {
	@Prop({
		default: "#ffffff",
	}) public value: any;
	public isShowColorPicker = false;
	public show() {
		this.isShowColorPicker = true;
	}
	public hide() {
		this.isShowColorPicker = false;
	}
	public onInput(color: any) {
		this.$emit('input', color);
	}

}
</script>

<style>
.color-picker {
  top: 36%;
  left: 50%;
  position: absolute;
  display: flex;
  flex-direction: column;
}

.color-picker-close {
    align-self: center;margin-top: -8px;z-index: 1;
    filter:alpha(Opacity=80);  /*  IE有效 */
    -moz-opacity:0.8; /* 火狐浏览器有效，IE无效 */
    opacity: 0.8; /* 除IE外，所有浏览器都有效 */
}
</style>