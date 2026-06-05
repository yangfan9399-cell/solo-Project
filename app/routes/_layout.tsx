import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_layout")({
  component: Layout,
});

type Role = "editor" | "chief" | "scheduler" | "reviewer";

const roles: { id: Role; label: string }[] = [
  { id: "editor", label: "编辑" },
  { id: "chief", label: "主编" },
  { id: "scheduler", label: "排期人员" },
  { id: "reviewer", label: "复核人" },
];

function Layout() {
  const [currentRole, setCurrentRole] = useState<Role>("editor");

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <Link to="/">选题审核与发布排期系统</Link>
          </h1>
          <nav className="app-nav">
            <Link to="/" className="nav-link">[ 选题列表 ]</Link>
            <Link to="/topics/new" className="nav-link">[ 提交选题 ]</Link>
            <Link to="/review" className="nav-link">[ 复盘统计 ]</Link>
          </nav>
          <div className="role-switcher">
            <span className="role-label">当前角色：</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as Role)}
              className="role-select"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>媒体内容选题审核与发布排期系统 © 2026</p>
      </footer>
      <style>{globalStyles}</style>
    </div>
  );
}

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: #f0f2f5;
    color: #1a1a2e;
    line-height: 1.6;
  }
  a { color: inherit; text-decoration: none; }
  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .app-header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    padding: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .app-title {
    font-size: 1.2rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .app-title a:hover { color: #4fc3f7; }
  .app-nav {
    display: flex;
    gap: 16px;
    flex: 1;
  }
  .nav-link {
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.2s;
    font-size: 0.95rem;
  }
  .nav-link:hover {
    background: rgba(255,255,255,0.1);
    color: #4fc3f7;
  }
  .role-switcher {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }
  .role-select {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.1);
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .role-select option { color: #1a1a2e; }
  .app-main {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 24px;
  }
  .app-footer {
    background: #1a1a2e;
    color: rgba(255,255,255,0.6);
    text-align: center;
    padding: 16px;
    font-size: 0.85rem;
  }
  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    padding: 24px;
    margin-bottom: 20px;
  }
  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1a1a2e;
    border-bottom: 2px solid #f0f2f5;
    padding-bottom: 10px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.2s;
    text-decoration: none;
  }
  .btn-primary { background: #1976d2; color: white; }
  .btn-primary:hover { background: #1565c0; }
  .btn-success { background: #2e7d32; color: white; }
  .btn-success:hover { background: #1b5e20; }
  .btn-warning { background: #ed6c02; color: white; }
  .btn-warning:hover { background: #e65100; }
  .btn-danger { background: #d32f2f; color: white; }
  .btn-danger:hover { background: #b71c1c; }
  .btn-default { background: #f5f5f5; color: #333; border: 1px solid #ddd; }
  .btn-default:hover { background: #e0e0e0; }
  .btn-sm { padding: 6px 12px; font-size: 0.85rem; }
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  .status-draft { background: #e3f2fd; color: #1565c0; }
  .status-pending_review { background: #fff3e0; color: #e65100; }
  .status-approved { background: #e8f5e9; color: #2e7d32; }
  .status-rejected { background: #ffebee; color: #c62828; }
  .status-copyright_missing { background: #fce4ec; color: #ad1457; }
  .status-title_revision { background: #f3e5f5; color: #6a1b9a; }
  .status-scheduled { background: #e0f7fa; color: #00695c; }
  .status-conflict { background: #ffe0b2; color: #bf360c; }
  .status-published { background: #c8e6c9; color: #2e7d32; }
  .status-archived { background: #f5f5f5; color: #616161; }
  .form-group { margin-bottom: 16px; }
  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
  }
  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
    font-family: inherit;
  }
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25,118,210,0.1);
  }
  .form-textarea { min-height: 120px; resize: vertical; }
  .table {
    width: 100%;
    border-collapse: collapse;
  }
  .table th, .table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #f0f2f5;
  }
  .table th {
    background: #fafafa;
    font-weight: 600;
    color: #555;
    font-size: 0.9rem;
  }
  .table tr:hover { background: #fafafa; }
  .timeline {
    position: relative;
    padding-left: 24px;
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: #e0e0e0;
  }
  .timeline-item {
    position: relative;
    margin-bottom: 16px;
  }
  .timeline-item::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #1976d2;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #1976d2;
  }
  .timeline-time {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 4px;
  }
  .timeline-content {
    background: #f5f5f5;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.9rem;
  }
  .grid {
    display: grid;
    gap: 20px;
  }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-4 { grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 768px) {
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    .header-content { flex-wrap: wrap; }
    .app-nav { order: 3; width: 100%; justify-content: center; }
  }
  .stats-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    text-align: center;
  }
  .stats-number {
    font-size: 2rem;
    font-weight: 700;
    color: #1976d2;
    margin-bottom: 4px;
  }
  .stats-label {
    font-size: 0.9rem;
    color: #666;
  }
  .tag {
    display: inline-block;
    padding: 2px 8px;
    background: #e3f2fd;
    color: #1565c0;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-right: 4px;
  }
  .conflict-banner {
    background: #fff3e0;
    border: 1px solid #ff9800;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    color: #e65100;
  }
  .conflict-banner h4 { margin-bottom: 8px; }
  .conflict-list {
    margin-left: 20px;
    margin-bottom: 12px;
  }
  .conflict-list li { margin-bottom: 4px; }
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #888;
  }
  .empty-state-icon { font-size: 3rem; margin-bottom: 12px; }
`;

export default globalStyles;
