<template>
  <div>
   
    <transition name="menu-animation">
     
      <div class="test-menu" v-show="isShowMenu" ref="menu">
        <div ref="top">
          <slot name="top"></slot>
        </div>
        <!-- 子菜单 -->
        <div
         
          v-show="submenuData && submenuData.length > 0 && isShowSubmenu"
          class="submenu-box"
          :style="{
            transform:
              'translate(' +
              (submenuLocation.x - 5)  +
              'px, ' +
              (submenuLocation.y) +
              'px)',
          }"
        >
          <div class="submenu-badge-box">
            <span
              class="submenu-badge"
              ref="submenuBadge"
              :style="{
                marginTop: 20 + 'px',
              }"
            ></span>
          </div>
          <ul class="submenu srcollbar" ref="submenu">
            <li
              class="submenu-item"
              v-for="(subItem, index1) in submenuData"
              @click="onChange(subItem, $event, index1)"
              :key="index1"
            >
              <img
                class="subitem-img"
                v-if="subItem.icon.indexOf('/') >= 0"
                :src="subItem.icon"
              />
              <span
                v-else
                class="iconfont subitem-icon"
                :class="subItem.icon"
              ></span>
              <span class="subitem-name">{{ subItem.name }}</span>
            </li>
          </ul>
        </div>
        <ul
          class="menu-box srcollbar"
          ref="menuBox"
          :style="{
            maxHeight: menuBoxMaxHeight + 'px',
          }"
        >
          <li
            class="menu-item"
            v-for="(item, index) in data"
            :key="index"
            :class="[index === activeIndex ? 'active' : '']"
            @click="onChange(item, $event, index)"
            @mouseover="onHover(item, $event, index)"
            @touchend="onHover(item, $event, index)"
          >
            <img
              class="item-img"
              v-if="item.icon.indexOf('/') >= 0"
              :src="item.icon"
            />
            <span v-else class="iconfont item-icon" :class="item.icon"></span>
            <span class="item-name">{{ item.name }}</span>
          </li>
        </ul>
      </div>
    </transition>
    <transition name="menu-animation">
    <div
      ref="switch"
      class="menu-switch iconfont"
      :class="isShowMenu ? 'icon-arrow-left' : 'icon-youjiantou'"
      @click="isShowMenu = !isShowMenu"
      :style="{
        left: isShowMenu ? submenuLocation.x  + 'px' : 0,
      }"
    >
    </div>
    </transition>
    <OperationInstruction  :left="isShowMenu ? submenuLocation.x + 25 : 0" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import OperationInstruction from "@/components/OperationInstruction/OperationInstruction.vue"
export interface MenuItemType {
  icon: string;
  name: string;
  cmd?: string;
  children?: MenuItemType[];
  changeCallback?: (item: MenuItemType, event: Event, index: number)=> void
}

@Component({
  name: "TestMenu",
  components: {
    OperationInstruction
  }
})
export default class TestMenu extends Vue {
  @Prop({
    type: Array,
    default: () => {
      return [
        {
          icon: "",
          name: "",
          cmd: "",
          children: [
            {
              icon: "",
              name: "",
              cmd: "",
            },
          ],
        },
      ];
    },
  })
  data!: MenuItemType[];
  submenuData: MenuItemType[] = [];

  // 子菜单定位
  submenuLocation = {
    x: 0,
    y: 0,
  };

  activeIndex = -1;
  // 菜单列表高度最高值
  menuBoxMaxHeight = 0;
  isShowSubmenu = false;
  isShowMenu = true;
  mounted() {
    const menu = this.$refs.menu as HTMLElement;
    const top = this.$refs.top as HTMLElement;

    let topHeight = 0;
    for (let i = 0; i < top.children.length; i++) {
      const el = top.children[i] as HTMLElement;
      const height = el.scrollHeight;
      const elStyle = window.getComputedStyle(el);
      const marginTop = this.transformStylePxToNumber(elStyle.marginTop);
      const marginBottom = this.transformStylePxToNumber(elStyle.marginBottom);

      topHeight = topHeight + marginTop + marginBottom + height;
    }
    this.menuBoxMaxHeight = menu.clientHeight - topHeight - 10;

    this.submenuLocation.x = menu.clientWidth - 5;
    (this.$refs.switch as HTMLElement).classList.add("switch-animation")
  }

  // px转number
  transformStylePxToNumber(str: string) {
    const index = str.indexOf("px");
    return Number(str.substring(0, index));
  }
  // 判断是否为移动段
  _isMobile() {
    let flag = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
    return flag;
  }
  onHover(item: MenuItemType, event: MouseEvent | any, index: number) {
    if(this._isMobile()) {
      event.preventDefault();
      if(!item.children || item.children?.length === 0) this.onChange(item, event, index)
    }
    
    this.isShowSubmenu = true;
    this.activeIndex = index;
    let el = event.target as any;
    if(el.tagName.toLowerCase() === "span" && el.className === "item-name") el = el.parentElement
    this.submenuData = item.children as MenuItemType[];
    if (el.tagName.toLowerCase() === "li") {
      this.$nextTick(() => {
        const submenu = this.$refs.submenu as HTMLElement;
        const submenuBadge = this.$refs.submenuBadge as HTMLElement;
        const winHeight = window.innerHeight;
        const top = el.getBoundingClientRect().top;
        
        const bottom = winHeight - (event.clientY || event.changedTouches[0].clientY);
        const submenuHeight = submenu.clientHeight;
        if (bottom > submenuHeight) {
          submenuBadge.className = "submenu-badge submenu-badge-top";
          this.submenuLocation.y = top - el.clientHeight / 3
        } else {
          const menuTopSlot = this.$refs.top as HTMLElement;
          submenuBadge.className = "submenu-badge submenu-badge-bottom";
          this.submenuLocation.y =
            top - submenuHeight + menuTopSlot.clientHeight
        } 
      });
       
    }
   
    this.$emit("hover", item, event, index);
  }
  /** 关闭子菜单 */
  closeSubmenu() {
    this.isShowSubmenu = false;
  }
  /** 关闭按钮激活状态 */ 
  closeActive() {
    this.activeIndex = -1
  }
  /** 关闭菜单 */
  closeMenu() {
    this.isShowMenu = false
  }
  onChange(item: MenuItemType, event: Event, index: number) {
    item.changeCallback && item.changeCallback.call(this, item, event, index)
    this.$emit("change", item, event, index);
    this.closeSubmenu();
  }
}
</script>

<style>
.test-menu {
  opacity: 1;
  width: auto;
  height: 100%;
  position: absolute;
  color: #ffffff;
  background-color: rgba(51, 51, 51, 1);
  padding: 0 10px;
  -moz-user-select: none;
  -o-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  transition: display 0.5s;
  -webkit-transition: display 0.5s; 
  z-index: 2;
}

.menu-box,
.submenu {
  list-style-type: none;
  padding: 0;
  overflow-y: auto;
}

.srcollbar::-webkit-scrollbar {
  width: 0 !important;
}

/* .srcollbar::-webkit-scrollbar {
  width: 10px; 
  height: 1px;
}
.srcollbar::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: skyblue;
  background-image: -webkit-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
}
.srcollbar::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #ededed;
  border-radius: 10px;
} */

.menu-item {
  display: flex;
  align-items: center;
  padding: 5px 14px;
  height: 40px;
  border-radius: 4px;
  box-sizing: border-box;
  margin: 5px 0;
  cursor: pointer;
}

.item-name {
  margin-left: 4px;
  font-size: 18px;
}
.item-icon {
  font-size: 22px;
}
.active {
  background: #00a99e;
}

.submenu-box {
  width: max-content;
  height: auto;
  position: absolute;
  top: 0;
  display: flex;
}

/* 可以为进入和离开动画设置不同的持续时间和动画函数 */
.menu-animation-enter-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.5, 1);
}
.menu-animation-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.5, 1);
}

.menu-animation-enter-from,
.menu-animation-leave-to
{
  transform: translateX(-100%);
  opacity: 0;
}

.menu-switch {
  
  position: absolute;
  top: calc(50% - 30px);
  right: -30px;
  width: 30px;
  height: 60px;
  border-radius: 0 30px 30px 0;
  line-height: 40px;
  background: rgba(51, 51, 51, 1);
  color: #fff;
  display: flex;
  align-items: center;
  font-size: 20px;
  z-index: 1;
}

.switch-animation {
  transition: left 0.3s;
  -webkit-transition: left 0.3s; 
}


.submenu {
  border-radius: 8px;
  padding: 10px 4px;
  margin: 4px 0px;
  background-color: rgba(51, 51, 51, 1);
  cursor: pointer;
  max-height: 94vh;
}
.submenu-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 4px;
}
.submenu-item:hover {
  background-color: #575656;
}
.subitem-icon {
  font-size: 20px;
}
.subitem-name {
  font-size: 16px;
  margin-left: 4px;
}

.submenu-badge-box {
  width: 10px;
  height: 50px;
  display: flex;
  align-items: center;
}
.submenu-badge {
  display: block;
  position: absolute;
  left: 0;
  top: auto;
  z-index: 100;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-right: 10px solid #007f76;
  border-bottom: 5px solid transparent;
}
.submenu-badge-top {
  top: auto;
}

.submenu-badge-bottom {
  bottom: 24px;
}


</style>