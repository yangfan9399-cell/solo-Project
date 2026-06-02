import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';

const seedData = () => {
  const hashPassword = (password) => bcrypt.hashSync(password, 10);

  const users = [
    { username: 'admin', password: hashPassword('admin123'), name: '系统管理员', role: 'admin', email: 'admin@bookstore.com', phone: '13800000000' },
    { username: 'clerk', password: hashPassword('clerk123'), name: '张三', role: 'clerk', email: 'clerk@bookstore.com', phone: '13800000001' },
    { username: 'purchaser', password: hashPassword('purchaser123'), name: '李四', role: 'purchaser', email: 'purchaser@bookstore.com', phone: '13800000002' },
    { username: 'manager', password: hashPassword('manager123'), name: '王五', role: 'manager', email: 'manager@bookstore.com', phone: '13800000003' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, name, role, email, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  users.forEach(user => {
    insertUser.run(user.username, user.password, user.name, user.role, user.email, user.phone);
  });
  console.log('Users seeded.');

  const members = [
    { member_no: 'M00001', name: '陈晓明', phone: '13900000001', email: 'chen@email.com', level: 'gold', balance: 500, total_deposit: 1000 },
    { member_no: 'M00002', name: '李雪梅', phone: '13900000002', email: 'li@email.com', level: 'silver', balance: 200, total_deposit: 500 },
    { member_no: 'M00003', name: '王大伟', phone: '13900000003', email: 'wang@email.com', level: 'normal', balance: 0, total_deposit: 200 },
    { member_no: 'M00004', name: '张小红', phone: '13900000004', email: 'zhang@email.com', level: 'platinum', balance: 2000, total_deposit: 5000 },
    { member_no: 'M00005', name: '刘建国', phone: '13900000005', email: 'liu@email.com', level: 'normal', balance: 50, total_deposit: 100 },
    { member_no: 'M00006', name: '赵丽华', phone: '13900000006', email: 'zhao@email.com', level: 'silver', balance: 300, total_deposit: 800 },
    { member_no: 'M00007', name: '孙志强', phone: '13900000007', email: 'sun@email.com', level: 'gold', balance: 800, total_deposit: 2000 },
    { member_no: 'M00008', name: '周美玲', phone: '13900000008', email: 'zhou@email.com', level: 'normal', balance: 100, total_deposit: 300 },
  ];

  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO members (member_no, name, phone, email, level, balance, total_deposit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  members.forEach(member => {
    insertMember.run(member.member_no, member.name, member.phone, member.email, member.level, member.balance, member.total_deposit);
  });
  console.log('Members seeded.');

  const books = [
    { isbn: '9787020002207', title: '百年孤独', author: '加西亚·马尔克斯', publisher: '人民文学出版社', publish_date: '2017-08-01', category: '外国文学', price: 49.80, preorder_price: 45.00, deposit_amount: 10.00, description: '魔幻现实主义文学代表作' },
    { isbn: '9787544291163', title: '挪威的森林', author: '村上春树', publisher: '南海出版公司', publish_date: '2018-07-01', category: '日本文学', price: 36.00, preorder_price: 32.00, deposit_amount: 10.00, description: '青春恋爱小说经典' },
    { isbn: '9787506393034', title: '活着', author: '余华', publisher: '作家出版社', publish_date: '2012-08-01', category: '中国文学', price: 39.00, preorder_price: 35.00, deposit_amount: 10.00, description: '讲述一个人和他命运之间的友情' },
    { isbn: '9787544280907', title: '解忧杂货店', author: '东野圭吾', publisher: '南海出版公司', publish_date: '2014-05-01', category: '日本文学', price: 39.50, preorder_price: 35.00, deposit_amount: 10.00, description: '一个关于救赎与温暖的故事' },
    { isbn: '9787020135110', title: '三体', author: '刘慈欣', publisher: '人民文学出版社', publish_date: '2018-05-01', category: '科幻小说', price: 93.00, preorder_price: 85.00, deposit_amount: 20.00, description: '中国科幻里程碑之作' },
    { isbn: '9787544277204', title: '白夜行', author: '东野圭吾', publisher: '南海出版公司', publish_date: '2013-01-01', category: '推理小说', price: 39.50, preorder_price: 35.00, deposit_amount: 10.00, description: '东野圭吾推理小说代表作' },
    { isbn: '9787532752828', title: '追风筝的人', author: '卡勒德·胡赛尼', publisher: '上海译文出版社', publish_date: '2006-05-01', category: '外国文学', price: 29.00, preorder_price: 26.00, deposit_amount: 10.00, description: '一个关于友谊与背叛的故事' },
    { isbn: '9787544291347', title: '嫌疑人X的献身', author: '东野圭吾', publisher: '南海出版公司', publish_date: '2019-01-01', category: '推理小说', price: 39.50, preorder_price: 35.00, deposit_amount: 10.00, description: '逻辑与爱情的完美结合' },
    { isbn: '9787559623960', title: '云边有个小卖部', author: '张嘉佳', publisher: '北京联合出版公司', publish_date: '2018-07-01', category: '中国文学', price: 42.00, preorder_price: 38.00, deposit_amount: 10.00, description: '一个关于成长与离别的故事' },
    { isbn: '9787540484700', title: '人间失格', author: '太宰治', publisher: '湖南文艺出版社', publish_date: '2018-03-01', category: '日本文学', price: 39.80, preorder_price: 35.00, deposit_amount: 10.00, description: '太宰治半自传体小说' },
  ];

  const insertBook = db.prepare(`
    INSERT OR IGNORE INTO books (isbn, title, author, publisher, publish_date, category, price, preorder_price, deposit_amount, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  books.forEach(book => {
    insertBook.run(book.isbn, book.title, book.author, book.publisher, book.publish_date, book.category, book.price, book.preorder_price, book.deposit_amount, book.description);
  });
  console.log('Books seeded.');

  const preorders = [
    { preorder_no: 'PO202401001', book_id: 1, member_id: 1, deposit_amount: 10.00, quantity: 1, status: 'pending', expected_arrival: '2024-02-15', created_by: 2 },
    { preorder_no: 'PO202401002', book_id: 2, member_id: 2, deposit_amount: 10.00, quantity: 1, status: 'confirmed', expected_arrival: '2024-02-10', created_by: 2 },
    { preorder_no: 'PO202401003', book_id: 3, member_id: 3, deposit_amount: 10.00, quantity: 1, status: 'arrived', expected_arrival: '2024-01-20', actual_arrival_date: '2024-01-18', created_by: 2 },
    { preorder_no: 'PO202401004', book_id: 4, member_id: 4, deposit_amount: 10.00, quantity: 2, status: 'reserved', expected_arrival: '2024-01-15', actual_arrival_date: '2024-01-10', created_by: 2 },
    { preorder_no: 'PO202401005', book_id: 5, member_id: 1, deposit_amount: 20.00, quantity: 1, status: 'picked', expected_arrival: '2024-01-10', actual_arrival_date: '2024-01-05', picked_at: '2024-01-12', created_by: 2 },
    { preorder_no: 'PO202401006', book_id: 6, member_id: 5, deposit_amount: 10.00, quantity: 1, status: 'cancelled', expected_arrival: '2024-01-25', cancelled_at: '2024-01-08', created_by: 2 },
    { preorder_no: 'PO202401007', book_id: 7, member_id: 6, deposit_amount: 10.00, quantity: 1, status: 'expired', expected_arrival: '2023-12-20', actual_arrival_date: '2023-12-15', created_by: 2 },
    { preorder_no: 'PO202401008', book_id: 1, member_id: 7, deposit_amount: 10.00, quantity: 1, status: 'confirmed', expected_arrival: '2024-02-20', created_by: 2 },
  ];

  const insertPreorder = db.prepare(`
    INSERT OR IGNORE INTO preorders (preorder_no, book_id, member_id, deposit_amount, quantity, status, expected_arrival, actual_arrival_date, picked_at, cancelled_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  preorders.forEach(po => {
    insertPreorder.run(po.preorder_no, po.book_id, po.member_id, po.deposit_amount, po.quantity, po.status, po.expected_arrival, po.actual_arrival_date, po.picked_at, po.cancelled_at, po.created_by);
  });
  console.log('Preorders seeded.');

  const purchaseOrders = [
    { po_no: 'PUR202401001', supplier: '新华书店总店', total_amount: 5000.00, status: 'received', expected_date: '2024-01-10', received_date: '2024-01-08', created_by: 3 },
    { po_no: 'PUR202401002', supplier: '当当图书批发', total_amount: 3200.00, status: 'partial', expected_date: '2024-01-20', created_by: 3 },
    { po_no: 'PUR202401003', supplier: '京东图书', total_amount: 2800.00, status: 'submitted', expected_date: '2024-02-05', created_by: 3 },
    { po_no: 'PUR202401004', supplier: '新华书店总店', total_amount: 4500.00, status: 'draft', expected_date: '2024-02-15', created_by: 3 },
  ];

  const insertPO = db.prepare(`
    INSERT OR IGNORE INTO purchase_orders (po_no, supplier, total_amount, status, expected_date, received_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  purchaseOrders.forEach(po => {
    insertPO.run(po.po_no, po.supplier, po.total_amount, po.status, po.expected_date, po.received_date, po.created_by);
  });
  console.log('Purchase orders seeded.');

  const purchaseItems = [
    { po_id: 1, book_id: 1, quantity_ordered: 50, quantity_received: 50, unit_price: 30.00, status: 'received' },
    { po_id: 1, book_id: 2, quantity_ordered: 40, quantity_received: 40, unit_price: 22.00, status: 'received' },
    { po_id: 1, book_id: 3, quantity_ordered: 30, quantity_received: 30, unit_price: 25.00, status: 'received' },
    { po_id: 2, book_id: 4, quantity_ordered: 60, quantity_received: 30, unit_price: 24.00, status: 'partial' },
    { po_id: 2, book_id: 5, quantity_ordered: 20, quantity_received: 20, unit_price: 55.00, status: 'received' },
    { po_id: 3, book_id: 6, quantity_ordered: 50, quantity_received: 0, unit_price: 25.00, status: 'pending' },
    { po_id: 3, book_id: 7, quantity_ordered: 40, quantity_received: 0, unit_price: 18.00, status: 'pending' },
    { po_id: 4, book_id: 8, quantity_ordered: 30, quantity_received: 0, unit_price: 25.00, status: 'pending' },
  ];

  const insertPOItem = db.prepare(`
    INSERT OR IGNORE INTO purchase_items (po_id, book_id, quantity_ordered, quantity_received, unit_price, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  purchaseItems.forEach(item => {
    insertPOItem.run(item.po_id, item.book_id, item.quantity_ordered, item.quantity_received, item.unit_price, item.status);
  });
  console.log('Purchase items seeded.');

  const stocks = [
    { book_id: 1, location: 'A-01-01', quantity_available: 45, quantity_reserved: 5 },
    { book_id: 2, location: 'A-01-02', quantity_available: 38, quantity_reserved: 2 },
    { book_id: 3, location: 'A-01-03', quantity_available: 28, quantity_reserved: 2 },
    { book_id: 4, location: 'A-02-01', quantity_available: 25, quantity_reserved: 5 },
    { book_id: 5, location: 'B-01-01', quantity_available: 15, quantity_reserved: 5 },
    { book_id: 6, location: 'B-01-02', quantity_available: 0, quantity_reserved: 0 },
    { book_id: 7, location: 'B-02-01', quantity_available: 0, quantity_reserved: 0 },
  ];

  const insertStock = db.prepare(`
    INSERT OR IGNORE INTO stock (book_id, location, quantity_available, quantity_reserved)
    VALUES (?, ?, ?, ?)
  `);

  stocks.forEach(stock => {
    insertStock.run(stock.book_id, stock.location, stock.quantity_available, stock.quantity_reserved);
  });
  console.log('Stock seeded.');

  const sortingTasks = [
    { task_no: 'ST202401001', po_item_id: 1, preorder_id: 1, book_id: 1, member_id: 1, quantity: 1, status: 'pending' },
    { task_no: 'ST202401002', po_item_id: 1, preorder_id: 8, book_id: 1, member_id: 7, quantity: 1, status: 'sorting', sorted_by: 2 },
    { task_no: 'ST202401003', po_item_id: 2, preorder_id: 2, book_id: 2, member_id: 2, quantity: 1, status: 'sorted', sorted_by: 2, sorted_at: '2024-01-18 10:30:00', shelf_location: 'A-01-02-01' },
    { task_no: 'ST202401004', po_item_id: 3, preorder_id: 3, book_id: 3, member_id: 3, quantity: 1, status: 'sorted', sorted_by: 2, sorted_at: '2024-01-18 11:00:00', shelf_location: 'A-01-03-01' },
    { task_no: 'ST202401005', po_item_id: 4, preorder_id: 4, book_id: 4, member_id: 4, quantity: 2, status: 'delivered', sorted_by: 2, sorted_at: '2024-01-15 14:00:00', shelf_location: 'A-02-01-01' },
  ];

  const insertSorting = db.prepare(`
    INSERT OR IGNORE INTO sorting_tasks (task_no, po_item_id, preorder_id, book_id, member_id, quantity, status, sorted_by, sorted_at, shelf_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sortingTasks.forEach(task => {
    insertSorting.run(task.task_no, task.po_item_id, task.preorder_id, task.book_id, task.member_id, task.quantity, task.status, task.sorted_by, task.sorted_at, task.shelf_location);
  });
  console.log('Sorting tasks seeded.');

  const notifications = [
    { notification_no: 'N202401001', member_id: 1, preorder_id: 1, type: 'arrival', title: '您预订的《百年孤独》已到货', content: '尊敬的陈晓明会员，您预订的《百年孤独》已到货，请于14天内前来取书。', channel: 'sms', status: 'sent', sent_at: '2024-01-18 09:00:00' },
    { notification_no: 'N202401002', member_id: 2, preorder_id: 2, type: 'reminder', title: '取书提醒', content: '尊敬的李雪梅会员，您预订的《挪威的森林》等待您的取书。', channel: 'wechat', status: 'sent', sent_at: '2024-01-18 09:05:00' },
    { notification_no: 'N202401003', member_id: 3, preorder_id: 3, type: 'arrival', title: '您预订的《活着》已到货', content: '尊敬的王大伟会员，您预订的《活着》已到货。', channel: 'sms', status: 'sent', sent_at: '2024-01-18 09:10:00' },
    { notification_no: 'N202401004', member_id: 4, preorder_id: 5, type: 'system', title: '感谢您的取书', content: '尊敬的张小红会员，感谢您前来取书，欢迎下次光临。', channel: 'app', status: 'read', sent_at: '2024-01-12 15:00:00', read_at: '2024-01-12 15:30:00' },
    { notification_no: 'N202401005', member_id: 7, preorder_id: 7, type: 'overdue', title: '取书逾期通知', content: '尊敬的赵丽华会员，您预订的《追风筝的人》已逾期未取，订单已自动取消。', channel: 'sms', status: 'sent', sent_at: '2024-01-05 09:00:00' },
  ];

  const insertNotification = db.prepare(`
    INSERT OR IGNORE INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status, sent_at, read_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  notifications.forEach(n => {
    insertNotification.run(n.notification_no, n.member_id, n.preorder_id, n.type, n.title, n.content, n.channel, n.status, n.sent_at, n.read_at);
  });
  console.log('Notifications seeded.');

  const transactions = [
    { tx_no: 'TX202401001', member_id: 1, type: 'deposit', amount: 10.00, status: 'completed', preorder_id: 1, payment_method: 'wechat', processed_by: 2 },
    { tx_no: 'TX202401002', member_id: 2, type: 'deposit', amount: 10.00, status: 'completed', preorder_id: 2, payment_method: 'alipay', processed_by: 2 },
    { tx_no: 'TX202401003', member_id: 3, type: 'deposit', amount: 10.00, status: 'completed', preorder_id: 3, payment_method: 'cash', processed_by: 2 },
    { tx_no: 'TX202401004', member_id: 4, type: 'deposit', amount: 20.00, status: 'completed', preorder_id: 4, payment_method: 'card', processed_by: 2 },
    { tx_no: 'TX202401005', member_id: 5, type: 'refund', amount: 10.00, status: 'completed', preorder_id: 6, payment_method: 'balance', processed_by: 4 },
    { tx_no: 'TX202401006', member_id: 1, type: 'payment', amount: 35.00, status: 'completed', preorder_id: 5, payment_method: 'wechat', processed_by: 2 },
  ];

  const insertTx = db.prepare(`
    INSERT OR IGNORE INTO transactions (tx_no, member_id, type, amount, status, preorder_id, payment_method, processed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  transactions.forEach(tx => {
    insertTx.run(tx.tx_no, tx.member_id, tx.type, tx.amount, tx.status, tx.preorder_id, tx.payment_method, tx.processed_by);
  });
  console.log('Transactions seeded.');

  const exceptions = [
    { exception_no: 'EX202401001', type: 'damage', preorder_id: 1, po_item_id: 1, book_id: 1, member_id: 1, description: '书籍封面有轻微折痕', status: 'open', priority: 'normal', reported_by: 2 },
    { exception_no: 'EX202401002', type: 'missing', book_id: 5, description: '采购到货物料缺少2本', status: 'processing', priority: 'high', reported_by: 3, handled_by: 4 },
    { exception_no: 'EX202401003', type: 'wrong_book', po_item_id: 4, book_id: 4, description: '收到的图书ISBN与订购不符', status: 'resolved', priority: 'urgent', resolution: '已联系供应商调换，预计3天内完成', reported_by: 3, handled_by: 4, resolved_at: '2024-01-19 10:00:00' },
  ];

  const insertException = db.prepare(`
    INSERT OR IGNORE INTO exceptions (exception_no, type, preorder_id, po_item_id, book_id, member_id, description, status, priority, resolution, reported_by, handled_by, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  exceptions.forEach(ex => {
    insertException.run(ex.exception_no, ex.type, ex.preorder_id, ex.po_item_id, ex.book_id, ex.member_id, ex.description, ex.status, ex.priority, ex.resolution, ex.reported_by, ex.handled_by, ex.resolved_at);
  });
  console.log('Exceptions seeded.');

  console.log('All sample data seeded successfully!');
};

seedData();
db.close();
