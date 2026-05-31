use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use chrono::Utc;

use crate::db::DbConn;
use crate::models::material::{Material, MaterialCategory, CreateMaterialRequest, UpdateMaterialRequest};

#[get("/materials?<category>")]
pub async fn get_materials(conn: DbConn, category: Option<String>) -> Result<Json<Vec<Material>>, Status> {
    let materials = conn.run(move |c| {
        let mut query = "SELECT id, name, category, specification, unit, stock_quantity, min_stock, unit_price, supplier, created_at, updated_at FROM materials WHERE 1=1".to_string();
        let mut params_vec: Vec<String> = Vec::new();
        
        if let Some(cat) = category {
            query.push_str(" AND category = ?");
            params_vec.push(cat);
        }
        query.push_str(" ORDER BY created_at DESC");
        
        let mut stmt = c.prepare(&query)?;
        let material_iter = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(Material {
                id: row.get(0)?,
                name: row.get(1)?,
                category: MaterialCategory::from_str(&row.get::<_, String>(2)?).unwrap_or(MaterialCategory::Other),
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
        let mut materials = Vec::new();
        for material in material_iter {
            materials.push(material?);
        }
        Ok::<Vec<Material>, rusqlite::Error>(materials)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(materials))
}

#[get("/materials/low-stock")]
pub async fn get_low_stock_materials(conn: DbConn) -> Result<Json<Vec<Material>>, Status> {
    let materials = conn.run(|c| {
        let mut stmt = c.prepare("SELECT id, name, category, specification, unit, stock_quantity, min_stock, unit_price, supplier, created_at, updated_at FROM materials WHERE stock_quantity <= min_stock ORDER BY stock_quantity ASC")?;
        let material_iter = stmt.query_map([], |row| {
            Ok(Material {
                id: row.get(0)?,
                name: row.get(1)?,
                category: MaterialCategory::from_str(&row.get::<_, String>(2)?).unwrap_or(MaterialCategory::Other),
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
        let mut materials = Vec::new();
        for material in material_iter {
            materials.push(material?);
        }
        Ok::<Vec<Material>, rusqlite::Error>(materials)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(materials))
}

#[get("/materials/<id>")]
pub async fn get_material(conn: DbConn, id: String) -> Result<Json<Material>, Status> {
    let material = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, name, category, specification, unit, stock_quantity, min_stock, unit_price, supplier, created_at, updated_at FROM materials WHERE id = ?1")?;
        let material = stmt.query_row(params![id], |row| {
            Ok(Material {
                id: row.get(0)?,
                name: row.get(1)?,
                category: MaterialCategory::from_str(&row.get::<_, String>(2)?).unwrap_or(MaterialCategory::Other),
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
        Ok::<Material, rusqlite::Error>(material)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(material))
}

#[post("/materials", data = "<req>")]
pub async fn create_material(conn: DbConn, req: Json<CreateMaterialRequest>) -> Result<Json<Material>, Status> {
    let material = Material::new(req.into_inner());
    
    conn.run(move |c| {
        c.execute(
            "INSERT INTO materials (id, name, category, specification, unit, stock_quantity, min_stock, unit_price, supplier, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                material.id,
                material.name,
                material.category.as_str(),
                material.specification,
                material.unit,
                material.stock_quantity,
                material.min_stock,
                material.unit_price,
                material.supplier,
                material.created_at,
                material.updated_at,
            ],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(material))
}

#[put("/materials/<id>", data = "<req>")]
pub async fn update_material(conn: DbConn, id: String, req: Json<UpdateMaterialRequest>) -> Result<Json<Material>, Status> {
    conn.run(move |c| {
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(ref name) = req.name {
            updates.push("name = ?");
            params_vec.push(Box::new(name.clone()));
        }
        if let Some(ref cat) = req.category {
            updates.push("category = ?");
            params_vec.push(Box::new(cat.as_str().to_string()));
        }
        if let Some(ref spec) = req.specification {
            updates.push("specification = ?");
            params_vec.push(Box::new(spec.clone()));
        }
        if let Some(ref unit) = req.unit {
            updates.push("unit = ?");
            params_vec.push(Box::new(unit.clone()));
        }
        if let Some(ref stock) = req.stock_quantity {
            updates.push("stock_quantity = ?");
            params_vec.push(Box::new(*stock));
        }
        if let Some(ref min) = req.min_stock {
            updates.push("min_stock = ?");
            params_vec.push(Box::new(*min));
        }
        if let Some(ref price) = req.unit_price {
            updates.push("unit_price = ?");
            params_vec.push(Box::new(*price));
        }
        if let Some(ref supplier) = req.supplier {
            updates.push("supplier = ?");
            params_vec.push(Box::new(supplier.clone()));
        }
        
        if updates.is_empty() {
            return Err(rusqlite::Error::InvalidQuery);
        }
        
        updates.push("updated_at = ?");
        params_vec.push(Box::new(Utc::now()));
        
        params_vec.push(Box::new(id.clone()));
        
        let query = format!("UPDATE materials SET {} WHERE id = ?", updates.join(", "));
        c.execute(&query, rusqlite::params_from_iter(params_vec))
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_material(conn, id).await
}

#[delete("/materials/<id>")]
pub async fn delete_material(conn: DbConn, id: String) -> Status {
    let result = conn.run(move |c| {
        c.execute("DELETE FROM materials WHERE id = ?1", params![id])
    }).await;
    
    match result {
        Ok(1) => Status::NoContent,
        Ok(_) => Status::NotFound,
        Err(_) => Status::InternalServerError,
    }
}
