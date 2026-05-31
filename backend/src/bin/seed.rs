use rusqlite::{params, Connection};
use uuid::Uuid;
use chrono::{Utc, DateTime, Duration};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    std::fs::create_dir_all("db")?;
    let conn = Connection::open("db/ancient_book.db")?;
    
    conn.execute_batch(include_str!("../schema.sql"))?;
    println!("Database schema created successfully!");
    
    seed_users(&conn)?;
    seed_books(&conn)?;
    seed_diseases(&conn)?;
    seed_processes(&conn)?;
    seed_materials(&conn)?;
    seed_reviews(&conn)?;
    seed_archives(&conn)?;
    seed_schedules(&conn)?;
    
    println!("Seed data inserted successfully!");
    Ok(())
}

fn seed_users(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let users = vec![
        ("张修复", "zhanggxf", "123456", "restorer", "13800138001", "zhang@restoration.com"),
        ("李修复", "lixf", "123456", "restorer", "13800138002", "li@restoration.com"),
        ("王管理员", "wanggly", "123456", "librarian", "13800138003", "wang@library.com"),
        ("陈专家", "chenzj", "123456", "expert", "13800138004", "chen@expert.com"),
        ("刘专家", "liuzj", "123456", "expert", "13800138005", "liu@expert.com"),
    ];
    
    for (name, username, password, role, phone, email) in users {
        let id = Uuid::new_v4().to_string();
        let now: DateTime<Utc> = Utc::now();
        conn.execute(
            "INSERT INTO users (id, username, password, name, role, phone, email, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, username, password, name, role, phone, email, now, now],
        )?;
    }
    println!("Users seeded!");
    Ok(())
}

fn seed_books(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let librarian_id: String = conn.query_row("SELECT id FROM users WHERE role = 'librarian' LIMIT 1", [], |row| row.get(0))?;
    
    let books = vec![
        ("《永乐大典》卷之九千一百一十三", Some("解缙"), Some("明代"), Some("1408年"), Some("皮纸"), Some("52x32cm"), Some(45), Some("A区-01-03"), "diagnosing"),
        ("《本草纲目》残本", Some("李时珍"), Some("明代"), Some("1596年"), Some("竹纸"), Some("48x28cm"), Some(120), Some("B区-02-15"), "scheduled"),
        ("《史记》钞本", None, Some("宋代"), None, Some("楮纸"), Some("45x30cm"), Some(89), Some("A区-03-08"), "repairing"),
        ("《全唐诗》", Some("彭定求"), Some("清代"), Some("1706年"), Some("开化纸"), Some("50x30cm"), Some(560), Some("C区-01-22"), "reviewing"),
        ("《金石录》", Some("赵明诚"), Some("宋代"), Some("1117年"), Some("桑皮纸"), Some("42x26cm"), Some(78), Some("A区-02-11"), "pending"),
        ("《宣和画谱》", None, Some("元代"), None, Some("麻纸"), Some("46x32cm"), Some(34), Some("B区-04-05"), "completed"),
        ("《梦溪笔谈》", Some("沈括"), Some("北宋"), Some("1086年"), Some("楮纸"), Some("44x28cm"), Some(156), Some("C区-02-18"), "archived"),
        ("《营造法式》", Some("李诫"), Some("宋代"), Some("1103年"), Some("竹纸"), Some("54x34cm"), Some(234), Some("D区-01-07"), "pending"),
    ];
    
    for (title, author, dynasty, year, material, dimensions, page_count, location, status) in books {
        let id = Uuid::new_v4().to_string();
        let now: DateTime<Utc> = Utc::now();
        conn.execute(
            "INSERT INTO books (id, title, author, dynasty, year, material, dimensions, page_count, location, status, entered_by, entered_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![id, title, author, dynasty, year, material, dimensions, page_count, location, status, librarian_id, now, now],
        )?;
    }
    println!("Books seeded!");
    Ok(())
}

fn seed_diseases(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let restorer_id: String = conn.query_row("SELECT id FROM users WHERE role = 'restorer' LIMIT 1", [], |row| row.get(0))?;
    
    let mut stmt = conn.prepare("SELECT id FROM books LIMIT 6")?;
    let book_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    let diseases = vec![
        (0, "acidification", "critical", "全书纸张", "纸张严重酸化，pH值约4.0，脆化严重"),
        (0, "moth_damage", "severe", "第12-18页", "虫蛀孔洞密集，约200处"),
        (1, "mold", "moderate", "封面及前10页", "霉斑面积约30%，有异味"),
        (1, "acidification", "severe", "全书", "纸张酸化，pH值约5.2"),
        (2, "tear", "severe", "书脊及边缘", "书脊断裂，边缘多处撕裂"),
        (2, "stain", "moderate", "第35-42页", "水渍污染严重"),
        (3, "brittleness", "severe", "全书", "纸张脆化，翻阅易碎"),
        (4, "mold", "critical", "第1-50页", "霉斑严重，有菌丝生长"),
        (4, "acidification", "severe", "全书纸张", "高危酸化，未完成专家复核"),
    ];
    
    for (book_idx, dtype, severity, location, description) in diseases {
        let id = Uuid::new_v4().to_string();
        let now: DateTime<Utc> = Utc::now();
        conn.execute(
            "INSERT INTO diseases (id, book_id, type, severity, location, description, diagnosed_by, diagnosed_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, book_ids[book_idx], dtype, severity, location, description, restorer_id, now, now],
        )?;
    }
    println!("Diseases seeded!");
    Ok(())
}

fn seed_processes(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare("SELECT id FROM users WHERE role = 'restorer'")?;
    let restorer_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    let mut stmt = conn.prepare("SELECT id FROM books LIMIT 5")?;
    let book_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    let processes = vec![
        (0, "表面除尘", "使用软毛刷和吸尘器进行表面清洁", Some(60), 0, "pending", 0),
        (0, "脱酸处理", "使用氢氧化钙溶液进行脱酸", Some(180), 0, "in_progress", 1),
        (0, "除霉灭菌", "采用低温等离子灭菌技术", Some(120), 1, "pending", 2),
        (1, "虫洞修补", "使用补纸和浆糊修复虫蛀孔洞", Some(240), 0, "pending", 0),
        (1, "纸张加固", "使用绫绢托裱加固", Some(180), 1, "pending", 1),
        (2, "书脊修复", "重新装订书脊", Some(300), 0, "completed", 0),
        (2, "水渍清除", "使用溶剂清洗水渍", Some(150), 1, "in_progress", 1),
        (3, "脆化纸张修复", "使用高分子材料加固", Some(360), 0, "pending", 0),
    ];
    
    for (book_idx, name, desc, duration, restorer_idx, status, order) in processes {
        let id = Uuid::new_v4().to_string();
        let now: DateTime<Utc> = Utc::now();
        conn.execute(
            "INSERT INTO processes (id, book_id, name, description, estimated_duration, assignee, status, order_index, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![id, book_ids[book_idx], name, Some(desc), duration, restorer_ids[restorer_idx], status, order, now, now],
        )?;
    }
    println!("Processes seeded!");
    Ok(())
}

fn seed_materials(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let materials = vec![
        ("手工宣纸", "paper", "四尺", "张", 500.0, 200.0, Some(2.5), Some("安徽泾县宣纸厂")),
        ("蝉翼毛边纸", "paper", "三尺", "张", 15.0, 100.0, Some(1.8), Some("福建连城宣纸厂")),
        ("淀粉浆糊", "adhesive", "食用级", "kg", 5.5, 10.0, Some(35.0), Some("自制")),
        ("小麦淀粉", "adhesive", "精制", "kg", 8.0, 5.0, Some(28.0), Some("粮食加工厂")),
        ("软毛刷", "tool", "2寸", "把", 12.0, 5.0, Some(45.0), Some("文房四宝店")),
        ("排笔", "tool", "16管", "把", 2.0, 3.0, Some(68.0), Some("湖州笔庄")),
        ("氢氧化钙", "chemical", "分析纯", "kg", 3.2, 5.0, Some(120.0), Some("化学试剂公司")),
        ("乙醇", "chemical", "75%", "L", 2.5, 10.0, Some(15.0), Some("医药公司")),
        ("绫绢", "paper", "真丝", "米", 28.0, 50.0, Some(85.0), Some("苏州丝绸厂")),
        ("补书纸", "paper", "古籍专用", "张", 80.0, 100.0, Some(3.2), Some("古籍修复材料厂")),
    ];
    
    for (name, category, spec, unit, stock, min_stock, price, supplier) in materials {
        let id = Uuid::new_v4().to_string();
        let now: DateTime<Utc> = Utc::now();
        conn.execute(
            "INSERT INTO materials (id, name, category, specification, unit, stock_quantity, min_stock, unit_price, supplier, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![id, name, category, spec, unit, stock, min_stock, price, supplier, now, now],
        )?;
    }
    println!("Materials seeded!");
    Ok(())
}

fn seed_reviews(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare("SELECT id FROM users WHERE role = 'expert'")?;
    let expert_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    let mut stmt = conn.prepare("SELECT id FROM books LIMIT 5")?;
    let book_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    let reviews = vec![
        (0, 0, "disease_diagnosis", "pending", None),
        (1, 0, "repair_process", "approved", Some("修复方案合理，材料选择适当")),
        (2, 1, "final_archive", "need_revision", Some("需补充修复前后对比照片")),
        (3, 0, "disease_diagnosis", "rejected", Some("病害诊断不准确，需重新检测")),
        (4, 1, "repair_process", "pending", None),
    ];
    
    for (book_idx, expert_idx, rtype, status, comments) in reviews {
        let id = Uuid::new_v4().to_string();
        let now: DateTime<Utc> = Utc::now();
        let reviewed_at = if status != "pending" { Some(now) } else { None };
        conn.execute(
            "INSERT INTO reviews (id, book_id, reviewer_id, type, status, comments, submitted_at, reviewed_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, book_ids[book_idx], expert_ids[expert_idx], rtype, status, comments, now, reviewed_at],
        )?;
    }
    println!("Reviews seeded!");
    Ok(())
}

fn seed_archives(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let librarian_id: String = conn.query_row("SELECT id FROM users WHERE role = 'librarian' LIMIT 1", [], |row| row.get(0))?;
    
    let mut stmt = conn.prepare("SELECT id FROM books LIMIT 5")?;
    let book_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    let archives = vec![
        (0, "修复前全景照片", "image", Some("/images/book0_before.jpg"), Some(2048000), "修复前整体外观"),
        (0, "病害细节照片", "image", Some("/images/book0_disease.jpg"), Some(1536000), "虫蛀细节特写"),
        (0, "修复记录表", "record", Some("/docs/book0_record.pdf"), Some(512000), "详细修复过程记录"),
        (1, "修复前照片", "image", Some("/images/book1_before.jpg"), Some(1800000), "修复前外观"),
        (2, "修复前后对比", "image", Some("/images/book2_compare.jpg"), Some(2500000), "修复前后对比照片"),
        (3, "修复方案文档", "document", Some("/docs/book3_plan.pdf"), Some(384000), "修复方案审批文档"),
    ];
    
    for (book_idx, title, atype, path, size, desc) in archives {
        let id = Uuid::new_v4().to_string();
        let now: DateTime<Utc> = Utc::now();
        conn.execute(
            "INSERT INTO archives (id, book_id, title, type, file_path, file_size, description, uploaded_by, uploaded_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, book_ids[book_idx], title, atype, path, size, desc, librarian_id, now],
        )?;
    }
    println!("Archives seeded!");
    Ok(())
}

fn seed_schedules(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare("SELECT id FROM users WHERE role = 'restorer'")?;
    let restorer_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    let mut stmt = conn.prepare("SELECT id FROM books LIMIT 4")?;
    let book_ids: Vec<String> = stmt.query_map([], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    
    let now: DateTime<Utc> = Utc::now();
    let schedules = vec![
        (0, 0, now + Duration::hours(24), now + Duration::hours(27), "《永乐大典》脱酸处理"),
        (0, 0, now + Duration::hours(48), now + Duration::hours(50), "排期冲突测试"),
        (1, 1, now + Duration::hours(26), now + Duration::hours(29), "《本草纲目》虫洞修补"),
        (0, 2, now + Duration::hours(72), now + Duration::hours(77), "《史记》书脊修复"),
        (1, 3, now + Duration::hours(96), now + Duration::hours(100), "《全唐诗》脆化修复"),
    ];
    
    for (restorer_idx, book_idx, start, end, desc) in schedules {
        let id = Uuid::new_v4().to_string();
        let created: DateTime<Utc> = Utc::now();
        conn.execute(
            "INSERT INTO schedules (id, book_id, restorer_id, start_time, end_time, description, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, book_ids[book_idx], restorer_ids[restorer_idx], start, end, Some(desc), created],
        )?;
    }
    println!("Schedules seeded!");
    Ok(())
}
