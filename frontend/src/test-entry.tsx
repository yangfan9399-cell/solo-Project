import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <div style={{ padding: '40px', background: 'linear-gradient(135deg,#ff6b9d,#c44569)', color: '#fff', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
    <h1 style={{ fontSize: 32, margin: 0 }}>✅ React 基础渲染 OK</h1>
    <h2 style={{ fontSize: 20, margin: 0 }}>正在加载组件...</h2>
    <div id="status">初始状态</div>
  </div>
);
