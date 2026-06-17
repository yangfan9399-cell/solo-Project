<template>
  <div class="app-shell">
    <nav class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🪔</span>
        <span class="brand-text">香方配伍平台</span>
      </div>
      <ul class="nav-list">
        <li><NuxtLink to="/" class="nav-item" active-class="nav-active" exact><span class="nav-icon">📋</span>项目台账</NuxtLink></li>
        <li><NuxtLink to="/formula/new" class="nav-item" active-class="nav-active"><span class="nav-icon">➕</span>新建配方</NuxtLink></li>
        <li><NuxtLink to="/evaluation" class="nav-item" active-class="nav-active"><span class="nav-icon">📝</span>测评管理</NuxtLink></li>
        <li><NuxtLink to="/inventory" class="nav-item" active-class="nav-active"><span class="nav-icon">📦</span>库存管理</NuxtLink></li>
        <li><NuxtLink to="/export" class="nav-item" active-class="nav-active"><span class="nav-icon">📤</span>导出摘要</NuxtLink></li>
      </ul>
    </nav>
    <main class="main-content">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
:root {
  --bg: #faf8f5;
  --fg: #2c2417;
  --muted: #8c7e6a;
  --accent: #b8860b;
  --accent-light: #f5e6c8;
  --card: #ffffff;
  --border: #e8dcc8;
  --danger: #c0392b;
  --danger-light: #fde8e5;
  --success: #27ae60;
  --success-light: #e8f8ef;
  --warning: #e67e22;
  --warning-light: #fef3e2;
  --info: #2980b9;
  --info-light: #e8f0f8;
  --sidebar-bg: #3a2f23;
  --sidebar-fg: #e8dcc8;
  --sidebar-active: #b8860b;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(44,36,23,0.08);
  --shadow-lg: 0 4px 12px rgba(44,36,23,0.12);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
}

.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: var(--sidebar-bg);
  color: var(--sidebar-fg);
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  overflow-y: auto;
  z-index: 100;
}

.sidebar-brand {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon { font-size: 24px; }
.brand-text { font-size: 16px; font-weight: 600; color: #fff; }

.nav-list {
  list-style: none;
  padding: 8px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: var(--sidebar-fg);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.nav-active {
  background: rgba(184,134,11,0.2);
  color: var(--sidebar-active);
  font-weight: 600;
  border-right: 3px solid var(--sidebar-active);
}

.nav-icon { font-size: 16px; }

.main-content {
  margin-left: 220px;
  flex: 1;
  padding: 24px 32px;
  min-height: 100vh;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--fg);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--fg);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:hover { background: var(--accent-light); border-color: var(--accent); }

.btn-primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.btn-primary:hover { background: #9a7209; }

.btn-danger { background: var(--danger); color: #fff; border-color: var(--danger); }
.btn-danger:hover { background: #a93226; }

.btn-sm { padding: 5px 10px; font-size: 12px; }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge-draft { background: #f0f0f0; color: #666; }
.badge-testing { background: var(--warning-light); color: var(--warning); }
.badge-approved { background: var(--success-light); color: var(--success); }
.badge-archived { background: #eee; color: #999; }
.badge-completed { background: var(--success-light); color: var(--success); }
.badge-pending { background: #f0f0f0; color: #666; }
.badge-producing { background: var(--info-light); color: var(--info); }
.badge-failed { background: var(--danger-light); color: var(--danger); }

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

th {
  font-weight: 600;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tr:hover { background: var(--accent-light); }

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 4px;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  background: var(--card);
  color: var(--fg);
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.form-textarea { resize: vertical; min-height: 80px; }

.alert {
  padding: 12px 16px;
  border-radius: var(--radius);
  margin-bottom: 12px;
  font-size: 13px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.alert-danger { background: var(--danger-light); color: var(--danger); border: 1px solid #e6b0aa; }
.alert-warning { background: var(--warning-light); color: #935e0c; border: 1px solid #f0c89b; }
.alert-info { background: var(--info-light); color: var(--info); border: 1px solid #a9cce3; }
.alert-success { background: var(--success-light); color: #1a7a42; border: 1px solid #a3d9b1; }

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
}

.tab:hover { color: var(--fg); }

.tab-active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}

.score-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-track {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.score-fill-low { background: var(--danger); }
.score-fill-mid { background: var(--warning); }
.score-fill-high { background: var(--success); }

.score-value {
  font-size: 13px;
  font-weight: 600;
  min-width: 30px;
}

.note-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.note-top { background: #fff3cd; color: #856404; }
.note-middle { background: #d4edda; color: #155724; }
.note-base { background: #e2d5c4; color: #5d4e37; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }

@media (max-width: 900px) {
  .grid-3, .grid-4 { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 600px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
  .sidebar { width: 60px; }
  .sidebar .brand-text, .sidebar .nav-icon + span { display: none; }
  .main-content { margin-left: 60px; padding: 16px; }
}

.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-gap { display: flex; gap: 8px; align-items: center; }
.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
.mb-8 { margin-bottom: 8px; }
.mb-16 { margin-bottom: 16px; }
.text-muted { color: var(--muted); }
.text-danger { color: var(--danger); }
.text-accent { color: var(--accent); }
.text-sm { font-size: 12px; }
.text-right { text-align: right; }
.fw-600 { font-weight: 600; }

.material-ratio-bar {
  display: flex;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
}

.material-ratio-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  min-width: 20px;
  transition: width 0.3s;
}
</style>
