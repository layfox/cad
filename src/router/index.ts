import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import CAD10001R from '@/pages/cad/CAD10001/CAD10001R.vue';
import CAD10002R from '@/pages/cad/CAD10002/CAD10002R.vue';
import IvCadViewer from '@/components/IvCadViewer.vue';

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
	path: '/',
	redirect: '/CAD10001R',
  },
  {
	path: '/CAD10001R',
	name: 'CAD10001R',
	component:  CAD10001R, // 后台配置
  },
  {
	path: '/CAD10002R',
	name: 'CAD10002R',
	component:  CAD10002R, // 一张图
  },
  {
	path: '/CAD10003S',
	name: 'CAD10003S',
	component: () => import('@/pages/cad/CAD10003/CAD10003S.vue'),
  },
];

const router = new VueRouter({
  mode: 'hash',
  routes,
});

export default router;
