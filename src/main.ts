
import Vue from 'vue';
import App from './App.vue';
import store from "@/store/index";
import router from '@/router';
import iView from 'iview';
import 'iview/dist/styles/iview.css';
import '@/rely/css/sui/sushine.css';
import '@/rely/iconfont/iconfont.css';

// 注册vue指令
import "./directive/index";
// 注册 iView (ViewUI)
Vue.use(iView);

Vue.prototype.$Message.config({
  duration: 3, // 默认3秒自动关闭
  top: 40,      // 可选，距离顶部像素，默认24
});

Vue.config.productionTip = false;
window.cadApp = new Vue({
  render: (h) => h(App),
  store,
  router,
}).$mount("#app");

window.cadStore = store;



