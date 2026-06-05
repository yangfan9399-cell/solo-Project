import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dispatch',
  },
  {
    path: '/dispatch',
    name: 'DispatchList',
    component: () => import('@/views/dispatch/DispatchList.vue'),
    meta: { title: '调度工单', icon: 'List' },
  },
  {
    path: '/dispatch/:id',
    name: 'DispatchDetail',
    component: () => import('@/views/dispatch/DispatchDetail.vue'),
    meta: { title: '调度详情', hidden: true },
  },
  {
    path: '/stations',
    name: 'StationList',
    component: () => import('@/views/station/StationList.vue'),
    meta: { title: '站点管理', icon: 'Location' },
  },
  {
    path: '/repair',
    name: 'RepairList',
    component: () => import('@/views/repair/RepairList.vue'),
    meta: { title: '维修工单', icon: 'Tools' },
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/analytics/AnalyticsDashboard.vue'),
    meta: { title: '数据复盘', icon: 'DataAnalysis' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || ''} - 公共自行车调度与维修闭环系统`;
  next();
});

export default router;
