<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class App extends Vue {}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  height: 48px;
  background: #1764e8;
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
}

.nav-item {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

/* 全局滚动条宽度 */
::-webkit-scrollbar {
  width: 8px;    /* 垂直滚动条宽度 */
  height: 8px;   /* 水平滚动条高度 */
}

/* 滚动条轨道（背景） */
::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

/* hover 滑块加深 */
::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.ivu-table .ivu-table-tip td {
  background: url('./pages/cad/CAD10001/css/images/no_data.jpg') no-repeat center center;
  background-size: 180px 180px;
  height: 400px;
  font-size: 0;
}

/* Firefox 兼容 */
* {
  scrollbar-width: thin;       /* auto | thin | none */
  scrollbar-color: #c1c1c1 #f5f5f5; /* 滑块颜色 轨道颜色 */
}

router-view {
  flex: 1;
  overflow: hidden;
}
</style>
