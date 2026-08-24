
import Vue from 'vue';
import App from './App.vue';
import store from "@/store/index"
import router from '@/router';
import iView from 'iview'
import 'iview/dist/styles/iview.css'
import '@/rely/css/sui/sushine.css'
import '@/rely/iconfont/iconfont.css'
import mockData from './mock'

// 注册vue指令
import "./directive/index"
// 注册 iView (ViewUI)
Vue.use(iView)

Vue.config.productionTip = false;
window.cadApp = new Vue({
  render: (h) => h(App),
  store,
  router
}).$mount("#app");

window.cadStore = store



