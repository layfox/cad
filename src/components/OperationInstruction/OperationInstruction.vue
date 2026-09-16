<template>
  <div class="operation_instruction" :style="{
      left: left + 'px'
  }">
      <span class="iconfont icon-cloudshellyunminglinghang operation_instruction_icon"></span>
      <span class="content">{{ msCmdTip }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

@Component({
  name: "OperationInstruction",
})

export default class OperationInstruction extends Vue {
	@Prop({
		type: Number,
		default: 0,
	}) public left!: number;
	get msCmdTip() {
		return this.$store.state.msCmdTip;
	}
}
</script>

<style>
.operation_instruction {
    padding: 2px;
    display: flex;
    background: #fff;
    color: #000;
    position: absolute;
    bottom: 10px;
    border-radius: 2px;
    
}
.operation_instruction_icon {
    font-size: 22px;
}
</style>