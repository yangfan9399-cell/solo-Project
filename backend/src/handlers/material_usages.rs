use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use chrono::Utc;

use crate::db::DbConn;
use crate::models::material_usage::{MaterialUsage, CreateMaterialUsageRequest};
use crate::models::material::Material;

#[get("/material-usages?<material_id>&<process_id>")]
pub async fn get_material_usages(conn: DbConn, material_id: Option<String>, process_id: Option<String>) -> Result<Json<Vec<MaterialUsage>>, Status> {
    let usages = conn.run(move |c| {
        let mut query = "SELECT id, process_id, material_id, quantity, used_by, used_at FROM material_usages WHERE 1=1".to_string();
        let mut params_vec: Vec<String> = Vec::new();
        
        if let Some(m) = material_id {
            query.push_str(" AND material_id = ?");
            params_vec.push(m);
        }
        if let Some(p) = process_id {
            query.push_str(" AND process_id = ?");
            params_vec.push(p);
        }
        query.push_str(" ORDER BY used_at DESC");
        
        let mut stmt = c.prepare(&query)?;
        let usage_iter = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(MaterialUsage {
                id: row.get(0)?,
                process_id: row.get(1)?,
                material_id: row.get(2)?,
                quantity: row.get(3)?,
                used_by: row.get(4)?,
                used_at: row.get(5)?,
            })
        })?;
        let mut usages = Vec::new();
        for usage in usage_iter {
            usages.push(usage?);
        }
        Ok::<Vec<MaterialUsage>, rusqlite::Error>(usages)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(usages))
}

#[get("/material-usages/<id>")]
pub async fn get_material_usage(conn: DbConn, id: String) -> Result<Json<MaterialUsage>, Status> {
    let usage = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, process_id, material_id, quantity, used_by, used_at FROM material_usages WHERE id = ?1")?;
        let usage = stmt.query_row(params![id], |row| {
            Ok(MaterialUsage {
                id: row.get(0)?,
                process_id: row.get(1)?,
                material_id: row.get(2)?,
                quantity: row.get(3)?,
                used_by: row.get(4)?,
                used_at: row.get(5)?,
            })
        })?;
        Ok::<MaterialUsage, rusqlite::Error>(usage)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(usage))
}

#[post("/material-usages", data = "<req>")]
pub async fn create_material_usage(conn: DbConn, req: Json<CreateMaterialUsageRequest>) -> Result<(Status, Json<MaterialUsage>), (Status, Json<serde_json::Value>)> {
    let request = req.into_inner();
    
    if request.quantity <= 0.0 {
        return Err((
            Status::BadRequest,
            Json(serde_json::json!({
                "error": "领用数量必须大于0",
                "code": 400
            }))
        ));
    }

    let result = conn.run(move |c| {
        c.transaction::<(MaterialUsage, Material), rusqlite::Error, _>(|tx| {
            // 1. 获取当前材料库存
            let mut stmt = tx.prepare("SELECT id, name, category, specification, unit, stock_quantity, min_stock, unit_price, supplier, created_at, updated_at FROM materials WHERE id = ?1")?;
            let material: Material = stmt.query_row(params![request.material_id], |row| {
                Ok(Material {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    category: crate::models::material::MaterialCategory::from_str(&row.get::<_, String>(2)?).unwrap_or(crate::models::material::MaterialCategory::Other),
                    specification: row.get(3)?,
                    unit: row.get(4)?,
                    stock_quantity: row.get(5)?,
                    min_stock: row.get(6)?,
                    unit_price: row.get(7)?,
                    supplier: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            })?;

            // 2. 校验库存
            if material.stock_quantity < request.quantity {
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }

            // 3. 创建领用记录
            let usage = MaterialUsage::new(request);
            tx.execute(
                "INSERT INTO material_usages (id, process_id, material_id, quantity, used_by, used_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    usage.id,
                    usage.process_id,
                    usage.material_id,
                    usage.quantity,
                    usage.used_by,
                    usage.used_at,
                ],
            )?;

            // 4. 扣减库存
            let new_stock = material.stock_quantity - usage.quantity;
            tx.execute(
                "UPDATE materials SET stock_quantity = ?1, updated_at = ?2 WHERE id = ?3",
                params![new_stock, Utc::now(), material.id],
            )?;

            // 5. 返回更新后的材料
            let mut stmt = tx.prepare("SELECT id, name, category, specification, unit, stock_quantity, min_stock, unit_price, supplier, created_at, updated_at FROM materials WHERE id = ?1")?;
            let updated_material: Material = stmt.query_row(params![material.id], |row| {
                Ok(Material {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    category: crate::models::material::MaterialCategory::from_str(&row.get::<_, String>(2)?).unwrap_or(crate::models::material::MaterialCategory::Other),
                    specification: row.get(3)?,
                    unit: row.get(4)?,
                    stock_quantity: row.get(5)?,
                    min_stock: row.get(6)?,
                    unit_price: row.get(7)?,
                    supplier: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            })?;

            Ok((usage, updated_material))
        })
    }).await;

    match result {
        Ok((usage, _material)) => Ok((Status::Created, Json(usage))),
        Err(rusqlite::Error::QueryReturnedNoRows) => Err((
            Status::BadRequest,
            Json(serde_json::json!({
                "error": "库存不足，无法完成领用",
                "code": 400
            }))
        )),
        Err(_) => Err((
            Status::InternalServerError,
            Json(serde_json::json!({
                "error": "领用失败，请重试",
                "code": 500
            }))
        )),
    }
}

#[delete("/material-usages/<id>")]
pub async fn delete_material_usage(conn: DbConn, id: String) -> Status {
    let result = conn.run(move |c| {
        c.execute("DELETE FROM material_usages WHERE id = ?1", params![id])
    }).await;
    
    match result {
        Ok(1) => Status::NoContent,
        Ok(_) => Status::NotFound,
        Err(_) => Status::InternalServerError,
    }
}
