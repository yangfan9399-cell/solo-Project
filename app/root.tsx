import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            min-height: 100vh;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
            color: white;
            padding: 1rem 2rem;
            margin-bottom: 20px;
            border-radius: 8px;
          }
          .header h1 {
            font-size: 1.8rem;
            font-weight: 600;
          }
          .nav {
            display: flex;
            gap: 1rem;
            margin-top: 10px;
          }
          .nav a {
            color: rgba(255, 255, 255, 0.9);
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 4px;
            transition: background 0.2s;
          }
          .nav a:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          .nav a.active {
            background: rgba(255, 255, 255, 0.3);
          }
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
          }
          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
          }
          .btn-primary {
            background: #2d5a87;
            color: white;
          }
          .btn-primary:hover {
            background: #1e3a5f;
          }
          .btn-success {
            background: #28a745;
            color: white;
          }
          .btn-success:hover {
            background: #218838;
          }
          .btn-danger {
            background: #dc3545;
            color: white;
          }
          .btn-danger:hover {
            background: #c82333;
          }
          .btn-warning {
            background: #ffc107;
            color: #212529;
          }
          .btn-warning:hover {
            background: #e0a800;
          }
          .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          .form-group {
            margin-bottom: 15px;
          }
          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
          }
          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }
          .form-group textarea {
            resize: vertical;
            min-height: 80px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #f8f9fa;
            font-weight: 600;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          .badge-found {
            background: #17a2b8;
            color: white;
          }
          .badge-claimed {
            background: #ffc107;
            color: #212529;
          }
          .badge-verified {
            background: #28a745;
            color: white;
          }
          .badge-returned {
            background: #007bff;
            color: white;
          }
          .badge-expired {
            background: #dc3545;
            color: white;
          }
          .badge-transferred {
            background: #6c757d;
            color: white;
          }
          .status-bar {
            display: flex;
            gap: 1rem;
            margin-bottom: 20px;
          }
          .status-item {
            flex: 1;
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .status-item .count {
            font-size: 2rem;
            font-weight: bold;
            color: #2d5a87;
          }
          .status-item .label {
            font-size: 0.9rem;
            color: #666;
          }
          .timeline {
            position: relative;
            padding-left: 30px;
          }
          .timeline::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #ddd;
          }
          .timeline-item {
            position: relative;
            margin-bottom: 20px;
          }
          .timeline-item::before {
            content: '';
            position: absolute;
            left: -24px;
            top: 4px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #2d5a87;
            border: 2px solid white;
            box-shadow: 0 0 0 2px #2d5a87;
          }
          .timeline-item .time {
            font-size: 0.85rem;
            color: #666;
          }
          .timeline-item .action {
            font-weight: 600;
            color: #2d5a87;
          }
          .timeline-item .operator {
            font-size: 0.9rem;
            color: #888;
          }
          .timeline-item .notes {
            margin-top: 5px;
            font-size: 0.9rem;
            color: #555;
          }
          .filter-bar {
            display: flex;
            gap: 1rem;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .filter-bar select {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .summary-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #2d5a87;
          }
          .summary-card .label {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <header className="header">
            <h1>地铁车站遗失物登记招领与超期处置系统</h1>
            <nav className="nav">
              <a href="/" className="active">物品列表</a>
              <a href="/register">登记物品</a>
              <a href="/claims">认领管理</a>
              <a href="/review">复盘分析</a>
            </nav>
          </header>
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
