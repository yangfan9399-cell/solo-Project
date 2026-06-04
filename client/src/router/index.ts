import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'WorkOrders',
    component: () => import('@/views/WorkOrderList.vue')
  },
  {
    path: '/work-order/:id',
    name: 'WorkOrderDetail',
    component: () => import('@/views/WorkOrderDetail.vue')
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/Analytics.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
