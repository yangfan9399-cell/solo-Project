// @refresh reload
import { FileRoutes } from "@solidjs/start/router";
import { MetaProvider, Title } from "@solidjs/meta";
import "./root.css";

export default function App() {
  return (
    <MetaProvider>
      <Title>木活字字盘缺字盘点系统</Title>
      <div class="app-container">
        <header class="app-header">
          <div class="header-brand">
            <span class="brand-icon">🪵</span>
            <div>
              <h1 class="brand-title">木活字字盘缺字盘点系统</h1>
              <p class="brand-subtitle">Wood Type Tray Inventory System</p>
            </div>
          </div>
          <nav class="main-nav">
            <a href="/" class="nav-link">总览</a>
            <a href="/trays" class="nav-link">字盘视图</a>
            <a href="/search" class="nav-link">检索</a>
            <a href="/tasks" class="nav-link">印刷任务</a>
            <a href="/batches" class="nav-link">补刻批次</a>
            <a href="/history" class="nav-link">历史记录</a>
            <a href="/export" class="nav-link">导出</a>
          </nav>
        </header>

        <main class="app-main">
          <FileRoutes />
        </main>

        <footer class="app-footer">
          <p>木活字字盘缺字盘点系统 · 印坊专业版 · v1.0.0</p>
        </footer>
      </div>
    </MetaProvider>
  );
}
