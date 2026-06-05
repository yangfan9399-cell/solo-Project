<template>
  <el-container class="app-container">
    <el-aside width="220px" class="app-aside">
      <div class="logo">
        <el-icon :size="28" color="#fff"><Biking /></el-icon>
        <span class="logo-text">自行车调度系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="app-menu"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dispatch">
          <el-icon><List /></el-icon>
          <span>调度工单</span>
        </el-menu-item>
        <el-menu-item index="/stations">
          <el-icon><Location /></el-icon>
          <span>站点管理</span>
        </el-menu-item>
        <el-menu-item index="/repair">
          <el-icon><Tools /></el-icon>
          <span>维修工单</span>
        </el-menu-item>
        <el-menu-item index="/analytics">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据复盘</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta.title">{{ currentRoute.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag type="success">当前角色：调度员 / 维修员 / 复核人</el-tag>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Biking, List, Location, Tools, DataAnalysis } from '@element-plus/icons-vue';

const route = useRoute();
const currentRoute = route;

const activeMenu = computed(() => {
  if (route.path.startsWith('/dispatch/')) {
    return '/dispatch';
  }
  return route.path;
});
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
}

.app-aside {
  background: #001529;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid #1f3a5f;
  color: #fff;
  font-size: 18px;
  font-weight: bold;

  .logo-text {
    letter-spacing: 1px;
  }
}

.app-menu {
  border-right: none;
  flex: 1;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
}

.app-main {
  background: #f5f7fa;
  padding: 24px;
  overflow: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
