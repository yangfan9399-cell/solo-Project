#!/usr/bin/env python3
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
from datetime import date, datetime, timedelta
import re

conn = sqlite3.connect('donation.db')
cursor = conn.cursor()

def init_db():
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Donor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT,
            phone TEXT,
            address TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS MaterialCategory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Material (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category_id INTEGER,
            unit TEXT DEFAULT '件',
            specification TEXT,
            FOREIGN KEY (category_id) REFERENCES MaterialCategory(id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Batch (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donor_id INTEGER,
            material_id INTEGER,
            quantity INTEGER NOT NULL,
            received_quantity INTEGER DEFAULT 0,
            distributed_quantity INTEGER DEFAULT 0,
            expire_date TEXT NOT NULL,
            batch_number TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'pending',
            storage_location TEXT,
            received_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            operator TEXT,
            FOREIGN KEY (donor_id) REFERENCES Donor(id),
            FOREIGN KEY (material_id) REFERENCES Material(id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Recipient (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT,
            phone TEXT,
            address TEXT,
            is_valid INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Project (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS DistributionPlan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER,
            project_id INTEGER,
            recipient_id INTEGER,
            quantity INTEGER NOT NULL,
            planned_date TEXT NOT NULL,
            actual_distributed_date TEXT,
            status TEXT DEFAULT 'draft',
            operator TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES Batch(id),
            FOREIGN KEY (project_id) REFERENCES Project(id),
            FOREIGN KEY (recipient_id) REFERENCES Recipient(id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Receipt (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            distribution_id INTEGER UNIQUE,
            quantity_received INTEGER NOT NULL,
            signed_by TEXT NOT NULL,
            signed_at TEXT DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (distribution_id) REFERENCES DistributionPlan(id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS AuditRecord (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            distribution_id INTEGER,
            action TEXT NOT NULL,
            auditor TEXT,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (distribution_id) REFERENCES DistributionPlan(id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS HistoryNode (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER,
            distribution_id INTEGER,
            node_type TEXT NOT NULL,
            operator TEXT,
            description TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES Batch(id),
            FOREIGN KEY (distribution_id) REFERENCES DistributionPlan(id)
        )
    ''')
    conn.commit()

def insert_sample_data():
    cursor.execute('SELECT COUNT(*) FROM Donor')
    if cursor.fetchone()[0] > 0:
        return
    
    today = date.today().isoformat()
    thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
    sixty_days_ago = (date.today() - timedelta(days=60)).isoformat()
    one_month_later = (date.today() + timedelta(days=30)).isoformat()
    two_months_later = (date.today() + timedelta(days=60)).isoformat()
    expired_date = (date.today() - timedelta(days=1)).isoformat()

    cursor.execute('INSERT INTO Donor (name, contact, phone, address) VALUES (?, ?, ?, ?)',
                  ('爱心企业A', '张经理', '13800138001', '北京市朝阳区xxx路'))
    cursor.execute('INSERT INTO Donor (name, contact, phone, address) VALUES (?, ?, ?, ?)',
                  ('公益基金会B', '李主任', '13800138002', '上海市浦东新区xxx号'))
    cursor.execute('INSERT INTO Donor (name, contact, phone, address) VALUES (?, ?, ?, ?)',
                  ('个人捐赠者C', '王先生', '13800138003', '广州市天河区xxx街'))

    cursor.execute('INSERT INTO MaterialCategory (name) VALUES (?)', ('食品',))
    cursor.execute('INSERT INTO MaterialCategory (name) VALUES (?)', ('日用品',))
    cursor.execute('INSERT INTO MaterialCategory (name) VALUES (?)', ('医疗用品',))

    cursor.execute('INSERT INTO Material (name, category_id, unit, specification) VALUES (?, ?, ?, ?)',
                  ('大米', 1, '袋', '25kg/袋'))
    cursor.execute('INSERT INTO Material (name, category_id, unit, specification) VALUES (?, ?, ?, ?)',
                  ('食用油', 1, '桶', '5L/桶'))
    cursor.execute('INSERT INTO Material (name, category_id, unit, specification) VALUES (?, ?, ?, ?)',
                  ('口罩', 3, '盒', '50只/盒'))
    cursor.execute('INSERT INTO Material (name, category_id, unit, specification) VALUES (?, ?, ?, ?)',
                  ('消毒液', 3, '瓶', '500ml/瓶'))
    cursor.execute('INSERT INTO Material (name, category_id, unit) VALUES (?, ?, ?)',
                  ('毛巾', 2, '条'))
    cursor.execute('INSERT INTO Material (name, category_id, unit) VALUES (?, ?, ?)',
                  ('棉被', 2, '床'))

    cursor.execute('INSERT INTO Project (name, description, start_date, status) VALUES (?, ?, ?, ?)',
                  ('灾区援助项目', '为地震灾区提供物资援助', '2024-01-01', 'active'))
    cursor.execute('INSERT INTO Project (name, description, start_date, status) VALUES (?, ?, ?, ?)',
                  ('贫困地区帮扶', '为贫困地区学校提供物资', '2024-03-01', 'active'))
    cursor.execute('INSERT INTO Project (name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
                  ('疫情防控支援', '为疫情防控提供医疗物资', '2024-01-01', '2024-06-30', 'completed'))

    cursor.execute('INSERT INTO Recipient (name, contact, phone, address) VALUES (?, ?, ?, ?)',
                  ('XX镇政府', '刘书记', '13900139001', 'XX省XX市XX镇'))
    cursor.execute('INSERT INTO Recipient (name, contact, phone, address) VALUES (?, ?, ?, ?)',
                  ('XX小学', '王校长', '13900139002', 'XX省XX县XX乡'))
    cursor.execute('INSERT INTO Recipient (name, contact, phone, address) VALUES (?, ?, ?, ?)',
                  ('XX医院', '陈院长', '13900139003', 'XX市XX区XX路'))
    cursor.execute('INSERT INTO Recipient (name, contact, phone, address) VALUES (?, ?, ?, ?)',
                  ('XX社区居委会', '', '', ''))

    cursor.execute('INSERT INTO Batch (donor_id, material_id, quantity, received_quantity, expire_date, batch_number, status, storage_location, received_at, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  (1, 1, 100, 100, two_months_later, 'B202401001', 'in_stock', 'A区-1号仓库', sixty_days_ago, 'admin'))
    cursor.execute('INSERT INTO Batch (donor_id, material_id, quantity, received_quantity, expire_date, batch_number, status, storage_location, received_at, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  (2, 2, 50, 50, one_month_later, 'B202401002', 'in_stock', 'A区-2号仓库', thirty_days_ago, 'admin'))
    cursor.execute('INSERT INTO Batch (donor_id, material_id, quantity, received_quantity, expire_date, batch_number, status, storage_location, received_at, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  (3, 3, 200, 200, sixty_days_ago, 'B202401003', 'in_stock', 'B区-1号仓库', '2024-01-15', 'admin'))
    cursor.execute('INSERT INTO Batch (donor_id, material_id, quantity, received_quantity, expire_date, batch_number, status, storage_location, received_at, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  (1, 4, 150, 150, two_months_later, 'B202401004', 'in_stock', 'B区-2号仓库', thirty_days_ago, 'admin'))
    cursor.execute('INSERT INTO Batch (donor_id, material_id, quantity, received_quantity, expire_date, batch_number, status, storage_location, received_at, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  (2, 5, 300, 300, one_month_later, 'B202401005', 'in_stock', 'C区-1号仓库', '2024-02-01', 'admin'))
    cursor.execute('INSERT INTO Batch (donor_id, material_id, quantity, received_quantity, expire_date, batch_number, status, storage_location, received_at, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  (3, 6, 50, 50, expired_date, 'B202401006', 'in_stock', 'C区-2号仓库', '2024-01-01', 'admin'))

    cursor.execute('INSERT INTO DistributionPlan (batch_id, project_id, recipient_id, quantity, planned_date, status, actual_distributed_date, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  (1, 1, 1, 50, '2024-03-01', 'archived', '2024-03-02', 'admin'))
    cursor.execute('INSERT INTO DistributionPlan (batch_id, project_id, recipient_id, quantity, planned_date, status, actual_distributed_date, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  (1, 2, 2, 30, '2024-03-15', 'received', '2024-03-16', 'admin'))
    cursor.execute('INSERT INTO DistributionPlan (batch_id, project_id, recipient_id, quantity, planned_date, status, actual_distributed_date, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  (2, 1, 1, 20, '2024-03-20', 'distributed', '2024-03-21', 'admin'))
    cursor.execute('INSERT INTO DistributionPlan (batch_id, project_id, recipient_id, quantity, planned_date, status, operator) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  (4, 3, 4, 100, '2024-04-01', 'approved', 'admin'))
    cursor.execute('INSERT INTO DistributionPlan (batch_id, project_id, recipient_id, quantity, planned_date, status, operator) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  (5, 2, 2, 100, '2024-04-10', 'draft', 'admin'))

    cursor.execute('INSERT INTO Receipt (distribution_id, quantity_received, signed_by, notes) VALUES (?, ?, ?, ?)',
                  (1, 50, '刘书记', '正常签收'))
    cursor.execute('INSERT INTO Receipt (distribution_id, quantity_received, signed_by, notes) VALUES (?, ?, ?, ?)',
                  (2, 28, '王校长', '收到28袋，2袋破损'))

    cursor.execute('UPDATE Batch SET distributed_quantity = 80 WHERE id = 1')
    cursor.execute('UPDATE Batch SET distributed_quantity = 20 WHERE id = 2')
    cursor.execute('UPDATE Batch SET distributed_quantity = 100 WHERE id = 4')
    cursor.execute('UPDATE Batch SET distributed_quantity = 100 WHERE id = 5')

    cursor.execute('INSERT INTO HistoryNode (batch_id, node_type, operator, description) VALUES (?, ?, ?, ?)',
                  (1, 'receive', 'admin', '入库 100 袋大米'))
    cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                  (1, 1, 'distribute', 'admin', '分配50袋大米到灾区援助项目'))
    cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                  (1, 2, 'distribute', 'admin', '分配30袋大米到贫困地区帮扶项目'))
    cursor.execute('INSERT INTO HistoryNode (batch_id, node_type, operator, description) VALUES (?, ?, ?, ?)',
                  (2, 'receive', 'admin', '入库 50 桶食用油'))
    cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                  (2, 3, 'distribute', 'admin', '分配20桶食用油到灾区援助项目'))

    conn.commit()
    print("样本数据创建完成！")

init_db()
insert_sample_data()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

class RequestHandler(BaseHTTPRequestHandler):
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def send_html(self, content, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(content.encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        if path == '/' or path == '/index':
            self.handle_index()
        elif path.startswith('/batch/list'):
            self.handle_batch_list(params)
        elif path.startswith('/batch/'):
            match = re.match(r'/batch/(\d+)/?', path)
            if match:
                self.handle_batch_detail(int(match.group(1)))
            elif path == '/batch/create':
                self.handle_batch_create_form()
        elif path.startswith('/distribution/list'):
            self.handle_distribution_list(params)
        elif path.startswith('/distribution/'):
            match = re.match(r'/distribution/(\d+)/?', path)
            if match:
                self.handle_distribution_detail(int(match.group(1)))
            elif path == '/distribution/create':
                self.handle_distribution_create_form()
        elif path.startswith('/recipient/list'):
            self.handle_recipient_list()
        elif path == '/recipient/create':
            self.handle_recipient_create_form()
        elif path.startswith('/recipient/'):
            match = re.match(r'/recipient/(\d+)/edit/?', path)
            if match:
                self.handle_recipient_edit_form(int(match.group(1)))
        elif path == '/review':
            self.handle_review()
        elif path == '/login':
            self.handle_login()
        else:
            self.send_html(self.render_404(), 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length).decode('utf-8')
        params = parse_qs(body)

        if path == '/batch/create':
            self.handle_batch_create(params)
        elif path == '/batch/receive':
            self.handle_batch_receive(params)
        elif path == '/distribution/create':
            self.handle_distribution_create(params)
        elif path == '/distribution/approve':
            self.handle_distribution_approve(params)
        elif path == '/distribution/distribute':
            self.handle_distribution_distribute(params)
        elif path == '/distribution/sign':
            self.handle_distribution_sign(params)
        elif path == '/distribution/audit':
            self.handle_distribution_audit(params)
        elif path == '/recipient/create':
            self.handle_recipient_create(params)
        elif path == '/recipient/edit':
            self.handle_recipient_edit(params)
        else:
            self.send_html(self.render_404(), 404)

    def render_header(self, active=''):
        return f'''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>公益捐赠物资管理平台</title>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; }}
        header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 2rem; }}
        header h1 {{ font-size: 1.5rem; }}
        nav {{ background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 0.5rem 2rem; }}
        nav a {{ margin-right: 1.5rem; text-decoration: none; color: #333; padding: 0.5rem; border-radius: 4px; }}
        nav a:hover {{ background: #f0f0f0; }}
        nav a.active {{ background: #667eea; color: white; }}
        .container {{ max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }}
        .card {{ background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 1.5rem; margin-bottom: 1.5rem; }}
        .card h2 {{ margin-bottom: 1rem; color: #333; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }}
        .stat-card {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 8px; text-align: center; }}
        .stat-card .number {{ font-size: 2rem; font-weight: bold; }}
        .stat-card .label {{ font-size: 0.9rem; opacity: 0.9; }}
        .btn {{ display: inline-block; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 0.9rem; transition: opacity 0.2s; }}
        .btn-primary {{ background: #667eea; color: white; }}
        .btn-success {{ background: #28a745; color: white; }}
        .btn-warning {{ background: #ffc107; color: #333; }}
        .btn-danger {{ background: #dc3545; color: white; }}
        .btn-secondary {{ background: #6c757d; color: white; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; }}
        th, td {{ padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }}
        th {{ background: #f8f9fa; font-weight: 600; }}
        tr:hover {{ background: #f8f9fa; }}
        .form-group {{ margin-bottom: 1rem; }}
        .form-group label {{ display: block; margin-bottom: 0.5rem; font-weight: 500; }}
        .form-group input, .form-group select, .form-group textarea {{ width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }}
        .form-group textarea {{ resize: vertical; }}
        .alert {{ padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }}
        .alert-success {{ background: #d4edda; color: #155724; }}
        .alert-danger {{ background: #f8d7da; color: #721c24; }}
        .alert-warning {{ background: #fff3cd; color: #856404; }}
        .badge {{ display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }}
        .badge-pending {{ background: #ffc107; color: #333; }}
        .badge-in_stock {{ background: #28a745; color: white; }}
        .badge-distributed {{ background: #17a2b8; color: white; }}
        .badge-expired {{ background: #dc3545; color: white; }}
        .badge-draft {{ background: #6c757d; color: white; }}
        .badge-approved {{ background: #17a2b8; color: white; }}
        .badge-received {{ background: #28a745; color: white; }}
        .badge-archived {{ background: #667eea; color: white; }}
        .history-item {{ padding: 0.75rem; border-left: 3px solid #667eea; background: #f8f9fa; margin-bottom: 0.5rem; }}
        .history-item .type {{ font-weight: 600; color: #667eea; }}
        .history-item .time {{ color: #666; font-size: 0.8rem; }}
        .expired {{ color: #dc3545; font-weight: bold; }}
        .discrepancy {{ background: #fff3cd; border-radius: 4px; padding: 0.5rem; }}
    </style>
</head>
<body>
    <header>
        <h1>公益捐赠物资管理平台</h1>
    </header>
    <nav>
        <a href="/" {'class="active"' if active == '' else ''}>首页</a>
        <a href="/batch/list" {'class="active"' if active == 'batch' else ''}>物资批次</a>
        <a href="/distribution/list" {'class="active"' if active == 'distribution' else ''}>分配计划</a>
        <a href="/recipient/list" {'class="active"' if active == 'recipient' else ''}>受赠方管理</a>
        <a href="/review" {'class="active"' if active == 'review' else ''}>复盘分析</a>
    </nav>
    <div class="container">
'''

    def render_footer(self):
        return '''
    </div>
</body>
</html>
'''

    def render_404(self):
        return self.render_header() + '<h2>404 页面未找到</h2>' + self.render_footer()

    def handle_index(self):
        today = date.today().isoformat()
        cursor.execute('SELECT COUNT(*) FROM Batch WHERE status = ?', ('pending',))
        pending_batches = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM Batch WHERE status = ?', ('in_stock',))
        in_stock_batches = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM Batch WHERE expire_date < ? AND status != ?', (today, 'expired'))
        expired_batches = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM DistributionPlan WHERE status = ?', ('draft',))
        pending_distributions = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM DistributionPlan WHERE status = ?', ('distributed',))
        pending_signatures = cursor.fetchone()[0]

        html = self.render_header() + f'''
        <div class="stats-grid">
            <div class="stat-card">
                <div class="number">{pending_batches}</div>
                <div class="label">待入库批次</div>
            </div>
            <div class="stat-card">
                <div class="number">{in_stock_batches}</div>
                <div class="label">库存中批次</div>
            </div>
            <div class="stat-card">
                <div class="number">{expired_batches}</div>
                <div class="label">已过期批次</div>
            </div>
            <div class="stat-card">
                <div class="number">{pending_distributions}</div>
                <div class="label">待审批分配</div>
            </div>
            <div class="stat-card">
                <div class="number">{pending_signatures}</div>
                <div class="label">待签收</div>
            </div>
        </div>
        <div class="card">
            <h2>快速操作</h2>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <a href="/batch/create" class="btn btn-primary">登记入库</a>
                <a href="/distribution/create" class="btn btn-success">创建分配</a>
                <a href="/recipient/create" class="btn btn-secondary">添加受赠方</a>
            </div>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_batch_list(self, params):
        status = params.get('status', [''])[0]
        if status:
            cursor.execute('''
                SELECT b.*, d.name as donor_name, m.name as material_name, m.unit as material_unit, mc.name as category_name
                FROM Batch b
                JOIN Donor d ON b.donor_id = d.id
                JOIN Material m ON b.material_id = m.id
                JOIN MaterialCategory mc ON m.category_id = mc.id
                WHERE b.status = ?
                ORDER BY b.created_at DESC
            ''', (status,))
        else:
            cursor.execute('''
                SELECT b.*, d.name as donor_name, m.name as material_name, m.unit as material_unit, mc.name as category_name
                FROM Batch b
                JOIN Donor d ON b.donor_id = d.id
                JOIN Material m ON b.material_id = m.id
                JOIN MaterialCategory mc ON m.category_id = mc.id
                ORDER BY b.created_at DESC
            ''')
        
        batches = cursor.fetchall()
        batch_list = []
        for b in batches:
            batch_list.append({
                'id': b[0], 'donor_id': b[1], 'material_id': b[2], 'quantity': b[3],
                'received_quantity': b[4], 'distributed_quantity': b[5], 'expire_date': b[6],
                'batch_number': b[7], 'status': b[8], 'storage_location': b[9],
                'received_at': b[10], 'created_at': b[11], 'operator': b[12],
                'donor_name': b[13], 'material_name': b[14], 'material_unit': b[15],
                'category_name': b[16],
                'available_quantity': b[4] - b[5],
                'is_expired': b[6] < date.today().isoformat()
            })

        html = self.render_header('batch') + f'''
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>物资批次列表</h2>
                <a href="/batch/create" class="btn btn-primary">新建批次</a>
            </div>
            <div style="margin-bottom: 1rem;">
                <a href="/batch/list" class="btn btn-secondary {'active' if not status else ''}">全部</a>
                <a href="/batch/list?status=pending" class="btn btn-secondary {'active' if status == 'pending' else ''}">待入库</a>
                <a href="/batch/list?status=in_stock" class="btn btn-secondary {'active' if status == 'in_stock' else ''}">库存中</a>
                <a href="/batch/list?status=expired" class="btn btn-secondary {'active' if status == 'expired' else ''}">已过期</a>
            </div>
            <table>
                <thead>
                    <tr><th>批次号</th><th>捐赠方</th><th>物资</th><th>数量</th><th>可用</th><th>有效期</th><th>状态</th><th>操作</th></tr>
                </thead>
                <tbody>
        '''
        
        for b in batch_list:
            expired_class = 'class="expired"' if b['is_expired'] else ''
            html += f'''
                    <tr>
                        <td><a href="/batch/{b['id']}">{b['batch_number']}</a></td>
                        <td>{b['donor_name']}</td>
                        <td>{b['material_name']}</td>
                        <td>{b['quantity']} {b['material_unit']}</td>
                        <td>{b['available_quantity']} {b['material_unit']}</td>
                        <td {expired_class}>{b['expire_date']}</td>
                        <td><span class="badge badge-{b['status']}">
                            {'待入库' if b['status'] == 'pending' else '已入库' if b['status'] == 'in_stock' else '已分配' if b['status'] == 'distributed' else '已过期'}
                        </span></td>
                        <td>
                            {'' if b['status'] != 'pending' else f'<button class="btn btn-success" style="font-size: 0.8rem;" hx-post="/batch/receive" hx-vals=\'{{"batch_id": {b["id"]}, "received_quantity": {b["quantity"]}}}\' hx-target="#batch-list">入库</button>'}
                        </td>
                    </tr>
            '''
        
        html += '''
                </tbody>
            </table>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_batch_detail(self, batch_id):
        cursor.execute('''
            SELECT b.*, d.name as donor_name, d.contact as donor_contact, d.phone as donor_phone, d.address as donor_address,
                   m.name as material_name, m.unit as material_unit, m.specification as material_spec,
                   mc.name as category_name
            FROM Batch b
            JOIN Donor d ON b.donor_id = d.id
            JOIN Material m ON b.material_id = m.id
            JOIN MaterialCategory mc ON m.category_id = mc.id
            WHERE b.id = ?
        ''', (batch_id,))
        b = cursor.fetchone()
        if not b:
            self.send_html(self.render_404(), 404)
            return

        batch = {
            'id': b[0], 'donor_id': b[1], 'material_id': b[2], 'quantity': b[3],
            'received_quantity': b[4], 'distributed_quantity': b[5], 'expire_date': b[6],
            'batch_number': b[7], 'status': b[8], 'storage_location': b[9],
            'received_at': b[10], 'created_at': b[11], 'operator': b[12],
            'donor_name': b[13], 'donor_contact': b[14], 'donor_phone': b[15], 'donor_address': b[16],
            'material_name': b[17], 'material_unit': b[18], 'material_spec': b[19],
            'category_name': b[20],
            'available_quantity': b[4] - b[5],
            'is_expired': b[6] < date.today().isoformat()
        }

        cursor.execute('''
            SELECT dp.*, p.name as project_name, r.name as recipient_name
            FROM DistributionPlan dp
            JOIN Project p ON dp.project_id = p.id
            JOIN Recipient r ON dp.recipient_id = r.id
            WHERE dp.batch_id = ?
        ''', (batch_id,))
        distributions = cursor.fetchall()

        cursor.execute('''
            SELECT * FROM HistoryNode WHERE batch_id = ? ORDER BY created_at DESC
        ''', (batch_id,))
        history = cursor.fetchall()

        status_display = {'pending': '待入库', 'in_stock': '已入库', 'distributed': '已分配', 'expired': '已过期'}

        html = self.render_header('batch') + f'''
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>批次详情: {batch['batch_number']}</h2>
                <span class="badge badge-{batch['status']}">{status_display.get(batch['status'], batch['status'])}</span>
            </div>
            <div style="margin-top: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <h3>捐赠方信息</h3>
                        <p><strong>名称:</strong> {batch['donor_name']}</p>
                        <p><strong>联系人:</strong> {batch['donor_contact'] or ''}</p>
                        <p><strong>电话:</strong> {batch['donor_phone'] or ''}</p>
                        <p><strong>地址:</strong> {batch['donor_address'] or ''}</p>
                    </div>
                    <div>
                        <h3>物资信息</h3>
                        <p><strong>名称:</strong> {batch['material_name']}</p>
                        <p><strong>类别:</strong> {batch['category_name']}</p>
                        <p><strong>规格:</strong> {batch['material_spec'] or ''}</p>
                        <p><strong>单位:</strong> {batch['material_unit']}</p>
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <h3>批次详情</h3>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                        <div><strong>总数量:</strong> {batch['quantity']} {batch['material_unit']}</div>
                        <div><strong>已入库:</strong> {batch['received_quantity']} {batch['material_unit']}</div>
                        <div><strong>已分配:</strong> {batch['distributed_quantity']} {batch['material_unit']}</div>
                        <div><strong>可用:</strong> {batch['available_quantity']} {batch['material_unit']}</div>
                    </div>
                    <p><strong>有效期:</strong> {'<span class="expired">' + batch['expire_date'] + ' (已过期)</span>' if batch['is_expired'] else batch['expire_date']}</p>
                    <p><strong>存放位置:</strong> {batch['storage_location'] or ''}</p>
                    <p><strong>创建时间:</strong> {batch['created_at']}</p>
                </div>
            </div>
        </div>
        <div class="card">
            <h3>分配记录</h3>
            {'<table><thead><tr><th>ID</th><th>项目</th><th>受赠方</th><th>数量</th><th>状态</th><th>操作</th></tr></thead><tbody>' if distributions else '<p>暂无分配记录</p>'}
            {''.join([f'''
                <tr>
                    <td><a href="/distribution/{d[0]}">{d[0]}</a></td>
                    <td>{d[14]}</td>
                    <td>{d[15]}</td>
                    <td>{d[4]} {batch['material_unit']}</td>
                    <td><span class="badge badge-{d[8]}">
                        {'草稿' if d[8] == 'draft' else '已批准' if d[8] == 'approved' else '已发放' if d[8] == 'distributed' else '已签收' if d[8] == 'received' else '已归档'}
                    </span></td>
                    <td><a href="/distribution/{d[0]}" class="btn btn-secondary" style="font-size: 0.8rem;">详情</a></td>
                </tr>
            ''' for d in distributions])}
            {'</tbody></table>' if distributions else ''}
        </div>
        <div class="card">
            <h3>历史节点</h3>
            {''.join([f'''
                <div class="history-item">
                    <span class="type">{'入库' if h[3] == 'receive' else '分配' if h[3] == 'distribute' else '签收' if h[3] == 'sign' else '审计' if h[3] == 'audit' else '归档'}</span>
                    <p>{h[5]}</p>
                    <span class="time">{h[6]}</span>
                </div>
            ''' for h in history])}
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_batch_create_form(self):
        cursor.execute('SELECT * FROM Donor')
        donors = cursor.fetchall()
        cursor.execute('SELECT * FROM MaterialCategory')
        categories = cursor.fetchall()

        html = self.render_header('batch') + '''
        <div class="card">
            <h2>新建捐赠批次</h2>
            <form hx-post="/batch/create" hx-target="body">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label>捐赠方名称</label>
                        <input type="text" name="donor_name" required>
                    </div>
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batch_number" required>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label>物资类别</label>
                        <input type="text" name="category_name" required>
                    </div>
                    <div class="form-group">
                        <label>物资名称</label>
                        <input type="text" name="material_name" required>
                    </div>
                    <div class="form-group">
                        <label>规格</label>
                        <input type="text" name="specification">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label>数量</label>
                        <input type="number" name="quantity" required min="1">
                    </div>
                    <div class="form-group">
                        <label>有效期</label>
                        <input type="date" name="expire_date" required>
                    </div>
                    <div class="form-group">
                        <label>存放位置</label>
                        <input type="text" name="storage_location">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">创建批次</button>
                <a href="/batch/list" class="btn btn-secondary">取消</a>
            </form>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_batch_create(self, params):
        donor_name = params.get('donor_name', [''])[0]
        batch_number = params.get('batch_number', [''])[0]
        category_name = params.get('category_name', [''])[0]
        material_name = params.get('material_name', [''])[0]
        specification = params.get('specification', [''])[0]
        quantity = int(params.get('quantity', ['0'])[0])
        expire_date = params.get('expire_date', [''])[0]
        storage_location = params.get('storage_location', [''])[0]

        cursor.execute('SELECT id FROM Donor WHERE name = ?', (donor_name,))
        donor = cursor.fetchone()
        if donor:
            donor_id = donor[0]
        else:
            cursor.execute('INSERT INTO Donor (name) VALUES (?)', (donor_name,))
            donor_id = cursor.lastrowid

        cursor.execute('SELECT id FROM MaterialCategory WHERE name = ?', (category_name,))
        category = cursor.fetchone()
        if category:
            category_id = category[0]
        else:
            cursor.execute('INSERT INTO MaterialCategory (name) VALUES (?)', (category_name,))
            category_id = cursor.lastrowid

        cursor.execute('SELECT id FROM Material WHERE name = ? AND category_id = ?', (material_name, category_id))
        material = cursor.fetchone()
        if material:
            material_id = material[0]
        else:
            cursor.execute('INSERT INTO Material (name, category_id, specification) VALUES (?, ?, ?)',
                          (material_name, category_id, specification))
            material_id = cursor.lastrowid

        cursor.execute('''
            INSERT INTO Batch (donor_id, material_id, quantity, expire_date, batch_number, storage_location, operator)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (donor_id, material_id, quantity, expire_date, batch_number, storage_location, 'admin'))
        
        batch_id = cursor.lastrowid
        cursor.execute('INSERT INTO HistoryNode (batch_id, node_type, operator, description) VALUES (?, ?, ?, ?)',
                      (batch_id, 'receive', 'admin', f'创建批次 {batch_number}'))
        
        conn.commit()
        self.send_html(f'<script>window.location.href="/batch/{batch_id}"</script>')

    def handle_batch_receive(self, params):
        batch_id = int(params.get('batch_id', ['0'])[0])
        received_quantity = int(params.get('received_quantity', ['0'])[0])

        cursor.execute('UPDATE Batch SET received_quantity = ?, status = ?, received_at = CURRENT_TIMESTAMP WHERE id = ?',
                      (received_quantity, 'in_stock', batch_id))
        cursor.execute('INSERT INTO HistoryNode (batch_id, node_type, operator, description) VALUES (?, ?, ?, ?)',
                      (batch_id, 'receive', 'admin', f'入库 {received_quantity} 件'))
        conn.commit()
        self.send_html(f'<script>window.location.href="/batch/list"</script>')

    def handle_distribution_list(self, params):
        status = params.get('status', [''])[0]
        if status:
            cursor.execute('''
                SELECT dp.*, b.batch_number, m.name as material_name, m.unit as material_unit,
                       p.name as project_name, r.name as recipient_name
                FROM DistributionPlan dp
                JOIN Batch b ON dp.batch_id = b.id
                JOIN Material m ON b.material_id = m.id
                JOIN Project p ON dp.project_id = p.id
                JOIN Recipient r ON dp.recipient_id = r.id
                WHERE dp.status = ?
                ORDER BY dp.created_at DESC
            ''', (status,))
        else:
            cursor.execute('''
                SELECT dp.*, b.batch_number, m.name as material_name, m.unit as material_unit,
                       p.name as project_name, r.name as recipient_name
                FROM DistributionPlan dp
                JOIN Batch b ON dp.batch_id = b.id
                JOIN Material m ON b.material_id = m.id
                JOIN Project p ON dp.project_id = p.id
                JOIN Recipient r ON dp.recipient_id = r.id
                ORDER BY dp.created_at DESC
            ''')
        
        distributions = cursor.fetchall()

        html = self.render_header('distribution') + f'''
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>分配计划列表</h2>
                <a href="/distribution/create" class="btn btn-primary">新建分配</a>
            </div>
            <div style="margin-bottom: 1rem;">
                <a href="/distribution/list" class="btn btn-secondary {'active' if not status else ''}">全部</a>
                <a href="/distribution/list?status=draft" class="btn btn-secondary {'active' if status == 'draft' else ''}">草稿</a>
                <a href="/distribution/list?status=approved" class="btn btn-secondary {'active' if status == 'approved' else ''}">已批准</a>
                <a href="/distribution/list?status=distributed" class="btn btn-secondary {'active' if status == 'distributed' else ''}">已发放</a>
                <a href="/distribution/list?status=received" class="btn btn-secondary {'active' if status == 'received' else ''}">已签收</a>
            </div>
            <table>
                <thead>
                    <tr><th>ID</th><th>批次</th><th>项目</th><th>受赠方</th><th>数量</th><th>状态</th><th>操作</th></tr>
                </thead>
                <tbody>
        '''
        
        for d in distributions:
            html += f'''
                    <tr>
                        <td><a href="/distribution/{d[0]}">{d[0]}</a></td>
                        <td>{d[9]}</td>
                        <td>{d[11]}</td>
                        <td>{d[12]}</td>
                        <td>{d[4]} {d[10]}</td>
                        <td><span class="badge badge-{d[8]}">
                            {'草稿' if d[8] == 'draft' else '已批准' if d[8] == 'approved' else '已发放' if d[8] == 'distributed' else '已签收' if d[8] == 'received' else '已归档'}
                        </span></td>
                        <td><a href="/distribution/{d[0]}" class="btn btn-secondary" style="font-size: 0.8rem;">详情</a></td>
                    </tr>
            '''
        
        html += '''
                </tbody>
            </table>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_distribution_detail(self, dist_id):
        cursor.execute('''
            SELECT dp.*, b.batch_number, b.donor_id, b.material_id, b.distributed_quantity,
                   m.name as material_name, m.unit as material_unit,
                   p.name as project_name, p.description as project_desc,
                   r.name as recipient_name, r.contact as recipient_contact,
                   r.phone as recipient_phone, r.address as recipient_address,
                   d.name as donor_name
            FROM DistributionPlan dp
            JOIN Batch b ON dp.batch_id = b.id
            JOIN Material m ON b.material_id = m.id
            JOIN Project p ON dp.project_id = p.id
            JOIN Recipient r ON dp.recipient_id = r.id
            JOIN Donor d ON b.donor_id = d.id
            WHERE dp.id = ?
        ''', (dist_id,))
        d = cursor.fetchone()
        if not d:
            self.send_html(self.render_404(), 404)
            return

        dist = {
            'id': d[0], 'batch_id': d[1], 'project_id': d[2], 'recipient_id': d[3],
            'quantity': d[4], 'planned_date': d[5], 'actual_distributed_date': d[6],
            'status': d[7], 'operator': d[8], 'created_at': d[9], 'updated_at': d[10],
            'batch_number': d[11], 'donor_id': d[12], 'material_id': d[13], 'distributed_quantity': d[14],
            'material_name': d[15], 'material_unit': d[16],
            'project_name': d[17], 'project_desc': d[18],
            'recipient_name': d[19], 'recipient_contact': d[20], 'recipient_phone': d[21], 'recipient_address': d[22],
            'donor_name': d[23]
        }

        cursor.execute('SELECT * FROM Receipt WHERE distribution_id = ?', (dist_id,))
        receipt = cursor.fetchone()

        cursor.execute('SELECT * FROM AuditRecord WHERE distribution_id = ?', (dist_id,))
        audit_records = cursor.fetchall()

        cursor.execute('''
            SELECT * FROM HistoryNode WHERE batch_id = ? OR distribution_id = ? ORDER BY created_at DESC
        ''', (dist['batch_id'], dist_id))
        history = cursor.fetchall()

        status_display = {'draft': '草稿', 'approved': '已批准', 'distributed': '已发放', 'received': '已签收', 'archived': '已归档', 'rejected': '已退回'}

        html = self.render_header('distribution') + f'''
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>分配详情: #{dist['id']}</h2>
                <span class="badge badge-{dist['status']}">{status_display.get(dist['status'], dist['status'])}</span>
            </div>
            <div style="margin-top: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <h3>批次信息</h3>
                        <p><strong>批次号:</strong> <a href="/batch/{dist['batch_id']}">{dist['batch_number']}</a></p>
                        <p><strong>物资:</strong> {dist['material_name']}</p>
                        <p><strong>分配数量:</strong> {dist['quantity']} {dist['material_unit']}</p>
                    </div>
                    <div>
                        <h3>项目信息</h3>
                        <p><strong>项目名称:</strong> {dist['project_name']}</p>
                        <p><strong>计划日期:</strong> {dist['planned_date']}</p>
                        <p><strong>实际发放日期:</strong> {dist['actual_distributed_date'] or '未发放'}</p>
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <h3>受赠方信息</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <p><strong>名称:</strong> {dist['recipient_name']}</p>
                        <p><strong>联系人:</strong> {dist['recipient_contact'] or '未填写'}</p>
                        <p><strong>电话:</strong> {dist['recipient_phone'] or '未填写'}</p>
                        <p><strong>地址:</strong> {dist['recipient_address'] or '未填写'}</p>
                    </div>
                </div>
            </div>
            <div style="margin-top: 1.5rem;">
                <h3>操作</h3>
                <div style="display: flex; gap: 1rem;">
                    {'<button class="btn btn-success" hx-post="/distribution/approve" hx-vals=\'{"dist_id": ' + str(dist_id) + '}\'>批准分配</button>' if dist['status'] == 'draft' else ''}
                    {'<button class="btn btn-primary" hx-post="/distribution/distribute" hx-vals=\'{"dist_id": ' + str(dist_id) + '}\'>确认发放</button>' if dist['status'] == 'approved' else ''}
                    {'<button class="btn btn-success" hx-get="/distribution/sign_form?dist_id=' + str(dist_id) + '" hx-target="#sign-modal">签收确认</button>' if dist['status'] == 'distributed' else ''}
                    {'<button class="btn btn-warning" hx-get="/distribution/audit_form?dist_id=' + str(dist_id) + '" hx-target="#audit-modal">审计处理</button>' if dist['status'] == 'received' else ''}
                </div>
            </div>
        </div>
        '''

        if receipt:
            has_discrepancy = receipt[2] != dist['quantity']
            html += f'''
        <div class="card {'discrepancy' if has_discrepancy else ''}">
            <h3>签收凭证</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <p><strong>签收人:</strong> {receipt[3]}</p>
                <p><strong>签收数量:</strong> {receipt[2]} {dist['material_unit']}</p>
                <p><strong>签收时间:</strong> {receipt[4]}</p>
            </div>
            {'<div class="alert alert-warning"><strong>数量差异:</strong> 发放 ' + str(dist['quantity']) + '，实际签收 ' + str(receipt[2]) + '，差异 ' + str(dist['quantity'] - receipt[2]) + ' ' + dist['material_unit'] + '</div>' if has_discrepancy else ''}
            {'<p><strong>备注:</strong> ' + receipt[5] + '</p>' if receipt[5] else ''}
        </div>
            '''

        if audit_records:
            html += '''
        <div class="card">
            <h3>审计记录</h3>
            ''' + ''.join([f'''
                <div class="history-item">
                    <span class="type">{'归档' if a[2] == 'archive' else '追查' if a[2] == 'investigate' else '批准' if a[2] == 'approve' else '驳回'}</span>
                    <p>{a[4] or ''}</p>
                    <span class="time">{a[5]}</span>
                </div>
            ''' for a in audit_records]) + '''
        </div>
            '''

        html += '''
        <div class="card">
            <h3>历史节点</h3>
            ''' + ''.join([f'''
                <div class="history-item">
                    <span class="type">{'入库' if h[3] == 'receive' else '分配' if h[3] == 'distribute' else '签收' if h[3] == 'sign' else '审计' if h[3] == 'audit' else '归档'}</span>
                    <p>{h[5]}</p>
                    <span class="time">{h[6]}</span>
                </div>
            ''' for h in history]) + '''
        </div>
            ''' + self.render_footer()
        self.send_html(html)

    def handle_distribution_create_form(self):
        cursor.execute('''
            SELECT b.*, m.name as material_name, m.unit as material_unit
            FROM Batch b
            JOIN Material m ON b.material_id = m.id
            WHERE b.status = 'in_stock' AND (b.received_quantity - b.distributed_quantity) > 0
        ''')
        batches = cursor.fetchall()
        cursor.execute('SELECT * FROM Project WHERE status = ?', ('active',))
        projects = cursor.fetchall()
        cursor.execute('SELECT * FROM Recipient WHERE is_valid = 1')
        recipients = cursor.fetchall()

        html = self.render_header('distribution') + '''
        <div class="card">
            <h2>创建分配计划</h2>
            <form hx-post="/distribution/create" hx-target="body">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label>选择批次</label>
                        <select name="batch_id" required>
                            <option value="">请选择批次</option>
                            ''' + ''.join([f'<option value="{b[0]}" data-quantity="{b[4]-b[5]}">{b[7]} - {b[13]} (可用: {b[4]-b[5]} {b[14]})</option>' for b in batches]) + '''
                        </select>
                    </div>
                    <div class="form-group">
                        <label>选择项目</label>
                        <select name="project_id" required>
                            <option value="">请选择项目</option>
                            ''' + ''.join([f'<option value="{p[0]}">{p[1]}</option>' for p in projects]) + '''
                        </select>
                    </div>
                    <div class="form-group">
                        <label>选择受赠方</label>
                        <select name="recipient_id" required>
                            <option value="">请选择受赠方</option>
                            ''' + ''.join([f'<option value="{r[0]}">{r[1]}</option>' for r in recipients]) + '''
                        </select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label>分配数量</label>
                        <input type="number" name="quantity" required min="1" id="quantity-input">
                    </div>
                    <div class="form-group">
                        <label>计划日期</label>
                        <input type="date" name="planned_date" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">创建分配</button>
                <a href="/distribution/list" class="btn btn-secondary">取消</a>
            </form>
        </div>
        <script>
            document.querySelector('form').addEventListener('submit', function(e) {
                const batchSelect = document.querySelector('select[name="batch_id"]');
                const selectedOption = batchSelect.options[batchSelect.selectedIndex];
                const maxQuantity = parseInt(selectedOption.dataset.quantity);
                const quantity = parseInt(document.getElementById('quantity-input').value);
                if (quantity > maxQuantity) {
                    alert('分配数量不能超过可用库存');
                    e.preventDefault();
                }
            });
        </script>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_distribution_create(self, params):
        batch_id = int(params.get('batch_id', ['0'])[0])
        project_id = int(params.get('project_id', ['0'])[0])
        recipient_id = int(params.get('recipient_id', ['0'])[0])
        quantity = int(params.get('quantity', ['0'])[0])
        planned_date = params.get('planned_date', [''])[0]

        cursor.execute('SELECT expire_date, received_quantity, distributed_quantity FROM Batch WHERE id = ?', (batch_id,))
        batch = cursor.fetchone()
        if batch[0] < date.today().isoformat():
            self.send_html('<script>alert("物资已过期，无法分配"); window.history.back();</script>')
            return
        if (batch[1] - batch[2]) < quantity:
            self.send_html('<script>alert("库存不足"); window.history.back();</script>')
            return

        cursor.execute('''
            INSERT INTO DistributionPlan (batch_id, project_id, recipient_id, quantity, planned_date, operator)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (batch_id, project_id, recipient_id, quantity, planned_date, 'admin'))
        
        dist_id = cursor.lastrowid
        cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                      (batch_id, dist_id, 'distribute', 'admin', f'创建分配计划 {dist_id}'))
        
        conn.commit()
        self.send_html(f'<script>window.location.href="/distribution/{dist_id}"</script>')

    def handle_distribution_approve(self, params):
        dist_id = int(params.get('dist_id', ['0'])[0])
        
        cursor.execute('SELECT batch_id FROM DistributionPlan WHERE id = ?', (dist_id,))
        batch_id = cursor.fetchone()[0]
        
        cursor.execute('UPDATE DistributionPlan SET status = ? WHERE id = ?', ('approved', dist_id))
        cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                      (batch_id, dist_id, 'audit', 'admin', '分配计划已批准'))
        conn.commit()
        self.send_html(f'<script>window.location.href="/distribution/{dist_id}"</script>')

    def handle_distribution_distribute(self, params):
        dist_id = int(params.get('dist_id', ['0'])[0])
        
        cursor.execute('SELECT batch_id, quantity FROM DistributionPlan WHERE id = ?', (dist_id,))
        row = cursor.fetchone()
        batch_id, quantity = row[0], row[1]
        
        cursor.execute('UPDATE DistributionPlan SET status = ?, actual_distributed_date = CURRENT_DATE WHERE id = ?', ('distributed', dist_id))
        cursor.execute('UPDATE Batch SET distributed_quantity = distributed_quantity + ? WHERE id = ?', (quantity, batch_id))
        cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                      (batch_id, dist_id, 'distribute', 'admin', f'已发放 {quantity} 件'))
        conn.commit()
        self.send_html(f'<script>window.location.href="/distribution/{dist_id}"</script>')

    def handle_distribution_sign(self, params):
        dist_id = int(params.get('dist_id', ['0'])[0])
        signed_by = params.get('signed_by', [''])[0]
        quantity_received = int(params.get('quantity_received', ['0'])[0])
        notes = params.get('notes', [''])[0]

        cursor.execute('SELECT batch_id, quantity FROM DistributionPlan WHERE id = ?', (dist_id,))
        row = cursor.fetchone()
        batch_id, quantity = row[0], row[1]
        
        cursor.execute('INSERT INTO Receipt (distribution_id, quantity_received, signed_by, notes) VALUES (?, ?, ?, ?)',
                      (dist_id, quantity_received, signed_by, notes))
        cursor.execute('UPDATE DistributionPlan SET status = ? WHERE id = ?', ('received', dist_id))
        cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                      (batch_id, dist_id, 'sign', 'admin', f'{signed_by} 签收 {quantity_received} 件'))
        conn.commit()
        self.send_html(f'<script>window.location.href="/distribution/{dist_id}"</script>')

    def handle_distribution_audit(self, params):
        dist_id = int(params.get('dist_id', ['0'])[0])
        action = params.get('action', [''])[0]
        notes = params.get('notes', [''])[0]

        cursor.execute('SELECT batch_id FROM DistributionPlan WHERE id = ?', (dist_id,))
        batch_id = cursor.fetchone()[0]
        
        cursor.execute('INSERT INTO AuditRecord (distribution_id, action, auditor, notes) VALUES (?, ?, ?, ?)',
                      (dist_id, action, 'admin', notes))
        
        if action == 'archive':
            cursor.execute('UPDATE DistributionPlan SET status = ? WHERE id = ?', ('archived', dist_id))
            cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                          (batch_id, dist_id, 'archive', 'admin', '已归档'))
        elif action == 'investigate':
            cursor.execute('INSERT INTO HistoryNode (batch_id, distribution_id, node_type, operator, description) VALUES (?, ?, ?, ?, ?)',
                          (batch_id, dist_id, 'audit', 'admin', f'追查: {notes}'))
        
        conn.commit()
        self.send_html(f'<script>window.location.href="/distribution/{dist_id}"</script>')

    def handle_recipient_list(self):
        cursor.execute('SELECT * FROM Recipient')
        recipients = cursor.fetchall()

        html = self.render_header('recipient') + '''
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>受赠方管理</h2>
                <a href="/recipient/create" class="btn btn-primary">添加受赠方</a>
            </div>
            <table>
                <thead>
                    <tr><th>名称</th><th>联系人</th><th>电话</th><th>地址</th><th>状态</th><th>操作</th></tr>
                </thead>
                <tbody>''' + ''.join([f'''
                    <tr>
                        <td>{r[1]}</td>
                        <td>{r[2] or '-'}</td>
                        <td>{r[3] or '-'}</td>
                        <td>{r[4] or '-'}</td>
                        <td><span class="badge badge-{'in_stock' if r[5] else 'expired'}">{'有效' if r[5] else '无效'}</span></td>
                        <td><a href="/recipient/{r[0]}/edit" class="btn btn-secondary" style="font-size: 0.8rem;">编辑</a></td>
                    </tr>
                ''' for r in recipients]) + '''
                </tbody>
            </table>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_recipient_create_form(self):
        html = self.render_header('recipient') + '''
        <div class="card">
            <h2>添加受赠方</h2>
            <form hx-post="/recipient/create" hx-target="body">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label>名称</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>联系人</label>
                        <input type="text" name="contact">
                    </div>
                    <div class="form-group">
                        <label>电话</label>
                        <input type="text" name="phone">
                    </div>
                    <div class="form-group">
                        <label>地址</label>
                        <textarea name="address" rows="3"></textarea>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">添加</button>
                <a href="/recipient/list" class="btn btn-secondary">取消</a>
            </form>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_recipient_create(self, params):
        name = params.get('name', [''])[0]
        contact = params.get('contact', [''])[0]
        phone = params.get('phone', [''])[0]
        address = params.get('address', [''])[0]
        
        cursor.execute('INSERT INTO Recipient (name, contact, phone, address) VALUES (?, ?, ?, ?)',
                      (name, contact, phone, address))
        conn.commit()
        self.send_html('<script>window.location.href="/recipient/list"</script>')

    def handle_recipient_edit_form(self, recipient_id):
        cursor.execute('SELECT * FROM Recipient WHERE id = ?', (recipient_id,))
        r = cursor.fetchone()
        if not r:
            self.send_html(self.render_404(), 404)
            return

        html = self.render_header('recipient') + f'''
        <div class="card">
            <h2>编辑受赠方: {r[1]}</h2>
            <form hx-post="/recipient/edit" hx-target="body">
                <input type="hidden" name="recipient_id" value="{r[0]}">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label>名称</label>
                        <input type="text" name="name" value="{r[1]}" required>
                    </div>
                    <div class="form-group">
                        <label>联系人</label>
                        <input type="text" name="contact" value="{r[2] or ''}">
                    </div>
                    <div class="form-group">
                        <label>电话</label>
                        <input type="text" name="phone" value="{r[3] or ''}">
                    </div>
                    <div class="form-group">
                        <label>地址</label>
                        <textarea name="address" rows="3">{r[4] or ''}</textarea>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">保存</button>
                <a href="/recipient/list" class="btn btn-secondary">取消</a>
            </form>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_recipient_edit(self, params):
        recipient_id = int(params.get('recipient_id', ['0'])[0])
        name = params.get('name', [''])[0]
        contact = params.get('contact', [''])[0]
        phone = params.get('phone', [''])[0]
        address = params.get('address', [''])[0]
        
        cursor.execute('UPDATE Recipient SET name = ?, contact = ?, phone = ?, address = ? WHERE id = ?',
                      (name, contact, phone, address, recipient_id))
        conn.commit()
        self.send_html('<script>window.location.href="/recipient/list"</script>')

    def handle_review(self):
        cursor.execute('''
            SELECT p.name, COUNT(dp.id) as count, SUM(dp.quantity) as total_quantity
            FROM DistributionPlan dp
            JOIN Project p ON dp.project_id = p.id
            GROUP BY p.id
            ORDER BY count DESC
        ''')
        by_project = cursor.fetchall()

        cursor.execute('''
            SELECT mc.name, COUNT(dp.id) as count, SUM(dp.quantity) as total_quantity
            FROM DistributionPlan dp
            JOIN Batch b ON dp.batch_id = b.id
            JOIN Material m ON b.material_id = m.id
            JOIN MaterialCategory mc ON m.category_id = mc.id
            GROUP BY mc.id
            ORDER BY count DESC
        ''')
        by_category = cursor.fetchall()

        cursor.execute('''
            SELECT COUNT(*) FROM DistributionPlan dp
            JOIN Receipt r ON dp.id = r.distribution_id
            WHERE dp.quantity != r.quantity_received
        ''')
        discrepancies = cursor.fetchone()[0]

        html = self.render_header('review') + f'''
        <div class="stats-grid">
            <div class="stat-card">
                <div class="number">{discrepancies}</div>
                <div class="label">数量差异记录</div>
            </div>
        </div>
        <div class="card">
            <h2>按项目聚合</h2>
            <table>
                <thead><tr><th>项目名称</th><th>分配次数</th><th>总数量</th></tr></thead>
                <tbody>
                    {''.join([f'<tr><td>{p[0]}</td><td>{p[1]}</td><td>{p[2]}</td></tr>' for p in by_project])}
                </tbody>
            </table>
        </div>
        <div class="card">
            <h2>按物资类别聚合</h2>
            <table>
                <thead><tr><th>类别名称</th><th>分配次数</th><th>总数量</th></tr></thead>
                <tbody>
                    {''.join([f'<tr><td>{c[0]}</td><td>{c[1]}</td><td>{c[2]}</td></tr>' for c in by_category])}
                </tbody>
            </table>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

    def handle_login(self):
        html = self.render_header() + '''
        <div class="card" style="max-width: 400px; margin: 2rem auto;">
            <h2>登录</h2>
            <form method="post" action="/login">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" name="username" value="admin">
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" name="password" value="admin">
                </div>
                <button type="submit" class="btn btn-primary">登录</button>
            </form>
            <p style="margin-top: 1rem; text-align: center;">用户名: admin, 密码: admin</p>
        </div>
        ''' + self.render_footer()
        self.send_html(html)

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8000), RequestHandler)
    print('Server running on http://localhost:8000')
    server.serve_forever()