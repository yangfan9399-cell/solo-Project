import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./styles/app.css";

export default function Root() {
  return (
    <Router
      root={(props) => (
        <Suspense>
          <div class="app-shell">
            <header class="app-header">
              <div class="header-inner">
                <div class="brand">
                  <span class="brand-mark">典</span>
                  <div class="brand-text">
                    <h1>古籍避讳字替换审读工具</h1>
                    <p>Ancient Text Taboo Character Review Platform</p>
                  </div>
                </div>
                <nav class="header-nav">
                  <a href="/" class="nav-link">项目台账</a>
                  <a href="/rules" class="nav-link">朝代规则库</a>
                  <a href="/exports" class="nav-link">导出记录</a>
                </nav>
                <div class="header-user">
                  <span class="user-avatar">张</span>
                  <span class="user-name">张校勘</span>
                </div>
              </div>
            </header>
            <main class="app-main">
              {props.children}
            </main>
            <footer class="app-footer">
              <p>© 2025 古籍文献整理研究室 · 版本 v1.0.0</p>
            </footer>
          </div>
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
