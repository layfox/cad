<template>
  <div class="sheet_layer_settings_window" v-show="isShow">
    <div class="sheet_layer_settings_window_header" @mousedown="onMousedown">
      <span class="sheet_layer-settings_window-header_title">{{ title }}</span>
      <div class="bf-close" @click="closeBox"></div>
    </div>
    <div class="sheet_layer_settings_window_header_table_head">
      <div class="sheet_layer_settings_window_header_table_th" v-for="title in titles" :key="title.name"
        :class="title.className">
        {{ title.name }}
      </div>
    </div>
    <div class="sheet_layer_settings_window_header_table_main sheet_layer_settings_window_container">
      <div class="sheet_layer_settings_window_header_table_tr" v-for="item in list" :key="item.id">
        <div class="sheet_layer_settings_window_header_table_td flex_basis_50 iconfont" v-if="typeof item.off !== 'undefined'"
          :class="item.off === 0 ? 'icon-xianshikejian' : 'icon-yincangbukejian'" @click="onClickIsVisible(item)"></div>
        <template v-if="item.color">
          <div class="sheet_layer_settings_window_header_table_td flex_basis_50">
            <div class="color_box"
              :style="'background-color: ' + `rgb(${item.color.red}, ${item.color.green}, ${item.color.blue})`"></div>
          </div>
        </template>
        <div class="sheet_layer_settings_window_header_table_td flex_basis_auto" @click="onClickName(item)">{{ item.name
        }}</div>
        <template v-if="item.isState">
          <div class="sheet_layer_settings_window_header_table_td flex_basis_50 iconfont"
            :class="true ? 'icon-jiesuo' : 'icon-suoding'" @click="onClickState(item)"></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
export type LayerItemType = {
  name: string,
  id: number,
  off?: number,
  color?: {
    red?: number,
    green?: number,
    blue?: number
  },
  colorValue?: number,
  zerolayer?: number,
  isState?: boolean
}


const win: any = window;

/**
 * @classdesc 图纸图层设置窗口
 * @abstract 用于控制和显示图层显示、颜色、名称、状态等信息
 *
 * */

@Component({
  name: "SheetLayerSettingsWindow",
})
export default class SheetLayerSettingsWindow extends Vue {
  @Prop({
    type: Boolean,
    default: false
  }) isShow!: boolean
  @Prop({
    type: Array
  })
  titles!: [];
  @Prop({
    type: Array,
    default: () => ([])
  }) list!: LayerItemType[]

  @Prop({
    type: String,
    default: "图层"
  }) title!: string

  onClickState(item: LayerItemType) {

  }
  onClickName(item: LayerItemType) {
    this.$emit("onClickName", item)
  }
  onClickIsVisible(item: LayerItemType) {
    this.$emit("onClickIsVisible", item)
  }
  closeBox() {
    this.$emit("close")
  }
  onMousedown(e: any) {
    // 获取该元素的transform的计算后的值
    function getStyle(el: any, attr: any) {
      if (typeof window.getComputedStyle !== 'undefined') {
        return window.getComputedStyle(el, null)[attr]
      } else if (typeof el.currentStyle !== 'undefined') {
        return el.currentStyle[attr]
      }
      return ''
    }
    // 正则解析
    const matrix3dReg = /^matrix3d\((?:[-\d.]+,\s*){12}([-\d.]+),\s*([-\d.]+)(?:,\s*[-\d.]+){2}\)/,
      matrixReg = /^matrix\((?:[-\d.]+,\s*){4}([-\d.]+),\s*([-\d.]+)\)$/
    /* 定义元素变量 */
    const windowClass: string = "sheet_layer_settings_window"

    const ELEMENT: any = document.getElementsByClassName(windowClass)[0]

    // 设置class
    if (ELEMENT.className.indexOf('drag_box_translate3d') === -1) {
      ELEMENT.className += ' drag_box_translate3d'
    }

    /* 定义距离尺寸的存储池 */
    const E_SIZER: any = {}
    // 获取解析后的transform样式属性值(计算后的样式)
    const matrix3dSourceValue: any = getStyle(ELEMENT, 'transform')
    // 使用正则解析matrix
    const matrix3dArrValue: any =
      matrix3dSourceValue.match(matrix3dReg) ||
      matrix3dSourceValue.match(matrixReg)
    // 记录鼠标点击时的坐标
    // console.log(ELEMENT.clientX);
    E_SIZER['clientX'] = e.clientX
    E_SIZER['clientY'] = e.clientY

    // 记录matrix解析后的translateX & translateY的值
    E_SIZER['targetX'] = matrix3dArrValue[1]

    E_SIZER['targetY'] = matrix3dArrValue[2]
    // 计算坐标边界巨鹿

    E_SIZER['distX'] = E_SIZER['clientX'] - E_SIZER['targetX']
    E_SIZER['distY'] = E_SIZER['clientY'] - E_SIZER['targetY']
    const disx = e.pageX - ELEMENT.offsetLeft
    const disy = e.pageY - ELEMENT.offsetTop
    // 鼠标移动
    const fun = function (e: any) {
      // 阻止原生和冒泡
      e.stopPropagation()
      e.preventDefault()

      // 计算元素到屏幕的距离
      let moveX = e.clientX - E_SIZER['distX']
      let moveY = e.clientY - E_SIZER['distY']


      // 限定拖拽范围
      // if (Math.abs(moveY) >= Math.abs(E_SIZER['clientY'] - disy)) {
      //   if (moveY > 0) {
      //     moveY = E_SIZER['clientY'] - disy
      //   } else {
      //     moveY = -(E_SIZER['clientY'] - disy)
      //   }
      // }
      // if (Math.abs(moveX) >= Math.abs(E_SIZER['clientX'] - disx)) {
      //   if (moveX > 0) {
      //     moveX = E_SIZER['clientX'] - disx
      //   } else {
      //     moveX = -(E_SIZER['clientX'] - disx)
      //   }
      // }
      // 动画拖拽
      ELEMENT.style.transform = ELEMENT.style.mozTransform = ELEMENT.style.webkitTransform = `translate3d(${moveX}px, ${moveY}px, 1px)`
    }
    // 取消事件
    document.onmousemove = fun
    document.onmouseup = function () {
      document.onmousemove = document.onmouseup = null
    }
  }
}

</script>

<style>
.sheet_layer_settings_window {
  width: 300px;
  height: 416px;
  box-sizing: border-box;
  color: #fff;
  position: absolute;
  user-select: none;
  overflow: hidden;
  background-color: rgba(17, 17, 17, 0.88);
  z-index: 9;
  right: 100px;
  top: 45px;
  border: 1px solid #333;
}

.sheet_layer_settings_window_header_table_head {
  cursor: default;
}

.sheet_layer_settings_window_header_table_main {
  cursor: pointer;
}

/* 滚动容器 */
.sheet_layer_settings_window_container {
  overflow-y: auto;
  height: 300px;
}

/* 设置滚动条的样式 */
.sheet_layer_settings_window_container::-webkit-scrollbar {
  width: 8px;
}

.sheet_layer_settings_window_container::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.3);
}

/*滚动槽*/
.sheet_layer_settings_window_container::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.3);
  /*border-radius: 10px;*/
}

/* 滚动条滑块 */
.sheet_layer_settings_window_container::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.3);
  -webkit-box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.3);
}


.sheet_layer_settings_window_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  height: 40px;
  border-bottom: 1px solid #666;
  padding: 0 10px;
}

.sheet_layer_settings_window_header_title {
  font-size: 14px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: -moz-none;
  background-color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet_layer_settings_window_header_table_head {
  display: flex;
}

.sheet_layer_settings_window_header_table_head {
  display: flex;
}

.sheet_layer_settings_window_header_table_th {
  font-size: 14px;
  padding: 5px 0;
}

.flex_basis_50 {
  flex: 0 1 50px;
}

.flex_basis_auto {
  flex: 1 1 auto;
}

.sheet_layer_settings_window_header_table_tr {
  width: 100%;
  display: flex;
  border-collapse: collapse;
  font-size: 12px;
  box-sizing: border-box;
  background-color: rgba(85, 85, 85, 0.45);
  align-items: center;
}

.sheet_layer_settings_window_header_table_td {
  display: flex;
  align-items: center;
  height: 35px;
  border: 1px solid #3f3f3f;
  padding-left: 5px;
}

.color_box {
  width: 12px;
  height: 12px;
  background-color: #fff;
  display: inline-block;
}

.drag_box_translate3d {
  position: absolute;
  transform: translate3d(0, 0, 1px);
  -moz-transform: translate3d(0, 0, 1px);
  -webkit-transform: translate3d(0, 0, 1px);
  will-change: transform;
  -moz-will-change: transform;
  -webkit-will-change: transform;
}

/* 关闭图标 */
.bf-close {
  top: 10px;
  right: 10px;
  width: 16px;
  height: 16px;
  cursor: pointer;
  z-index: 99;
}

.bf-close:after,
.bf-close:before {
  content: "";
  display: block;
  width: 16px;
  height: 1px;
  background-color: #fff;
  position: absolute;
  margin-top: 8px;
}

.bf-close:before {
  transform: rotate(45deg);
}

.bf-close:after {
  transform: rotate(-45deg);
}</style>