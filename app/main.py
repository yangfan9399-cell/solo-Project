from fastapi import FastAPI, Request, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import engine, Base, get_db
from app.models import User, ReworkOrder, ProcessGuide, ExceptionFeedback
from app.schemas import (
    UserCreate, ReworkOrderCreate, ReworkOrderUpdate, ProcessGuideCreate,
    InspectionCreate, ExceptionFeedbackCreate, QualityStats
)
from app.crud import (
    get_user, get_user_by_username, get_users, create_user,
    create_rework_order, get_rework_order, get_rework_orders, update_rework_order,
    update_rework_status, complete_rework_step,
    create_process_guide, get_process_guides, get_process_guide,
    create_inspection, get_inspections_by_rework, get_status_logs_by_rework,
    create_exception_feedback, get_exception_feedbacks, get_exception_feedback, resolve_exception_feedback,
    get_quality_statistics
)
from app.constants import ReworkStatus, DefectCategory, UserRole

Base.metadata.create_all(bind=engine)

app = FastAPI(title="制造车间返工单流转与质检复判系统")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


def get_current_user(db: Session = Depends(get_db)):
    user = get_user_by_username(db, "demo_leader")
    if not user:
        users = get_users(db)
        if users:
            user = users[0]
    return user


@app.get("/", response_class=HTMLResponse)
async def root(request: Request, db: Session = Depends(get_db)):
    stats = get_quality_statistics(db)
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "stats": stats, "active_menu": "dashboard"}
    )


@app.get("/reworks", response_class=HTMLResponse)
async def reworks_list(
    request: Request,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    reworks = get_rework_orders(db, status=status)
    return templates.TemplateResponse(
        "reworks/list.html",
        {
            "request": request,
            "reworks": reworks,
            "active_menu": "reworks",
            "current_status": status,
            "statuses": ReworkStatus
        }
    )


@app.get("/reworks/new", response_class=HTMLResponse)
async def new_rework_form(request: Request, db: Session = Depends(get_db)):
    users = get_users(db)
    guides = get_process_guides(db)
    return templates.TemplateResponse(
        "reworks/form.html",
        {
            "request": request,
            "active_menu": "reworks",
            "defect_categories": DefectCategory,
            "users": users,
            "guides": guides,
            "rework": None
        }
    )


@app.post("/reworks", response_class=HTMLResponse)
async def create_rework(
    request: Request,
    product_name: str = Form(...),
    product_code: str = Form(...),
    batch_no: str = Form(...),
    quantity: int = Form(...),
    defect_category: DefectCategory = Form(...),
    defect_description: str = Form(...),
    step_names: List[str] = Form([]),
    step_descriptions: List[str] = Form([]),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(db)
    
    steps = []
    for i, (name, desc) in enumerate(zip(step_names, step_descriptions)):
        if name and desc:
            steps.append({
                "step_order": i + 1,
                "step_name": name,
                "step_description": desc
            })
    
    rework_data = ReworkOrderCreate(
        product_name=product_name,
        product_code=product_code,
        batch_no=batch_no,
        quantity=quantity,
        defect_category=defect_category,
        defect_description=defect_description,
        steps=steps
    )
    
    create_rework_order(db, rework_data, creator_id=current_user.id)
    return RedirectResponse("/reworks", status_code=303)


@app.get("/reworks/{rework_id}", response_class=HTMLResponse)
async def rework_detail(request: Request, rework_id: int, db: Session = Depends(get_db)):
    rework = get_rework_order(db, rework_id)
    if not rework:
        return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
    
    inspections = get_inspections_by_rework(db, rework_id)
    status_logs = get_status_logs_by_rework(db, rework_id)
    users = get_users(db)
    guides = get_process_guides(db)
    
    return templates.TemplateResponse(
        "reworks/detail.html",
        {
            "request": request,
            "rework": rework,
            "inspections": inspections,
            "status_logs": status_logs,
            "active_menu": "reworks",
            "statuses": ReworkStatus,
            "users": users,
            "guides": guides
        }
    )


@app.post("/reworks/{rework_id}/assign", response_class=HTMLResponse)
async def assign_rework(
    rework_id: int,
    assignee_id: int = Form(...),
    process_guide_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(db)
    update_rework_order(db, rework_id, ReworkOrderUpdate(
        assignee_id=assignee_id,
        process_guide_id=process_guide_id
    ))
    update_rework_status(db, rework_id, ReworkStatus.ASSIGNED, operator_id=current_user.id, remarks="派工完成")
    return RedirectResponse(f"/reworks/{rework_id}", status_code=303)


@app.post("/reworks/{rework_id}/start", response_class=HTMLResponse)
async def start_rework(rework_id: int, db: Session = Depends(get_db)):
    current_user = get_current_user(db)
    update_rework_status(db, rework_id, ReworkStatus.IN_PROGRESS, operator_id=current_user.id, remarks="开始返工")
    return RedirectResponse(f"/reworks/{rework_id}", status_code=303)


@app.post("/reworks/{rework_id}/steps/{step_id}/complete", response_class=HTMLResponse)
async def complete_step(rework_id: int, step_id: int, db: Session = Depends(get_db)):
    complete_rework_step(db, step_id)
    return RedirectResponse(f"/reworks/{rework_id}", status_code=303)


@app.post("/reworks/{rework_id}/submit-inspection", response_class=HTMLResponse)
async def submit_for_inspection(rework_id: int, db: Session = Depends(get_db)):
    current_user = get_current_user(db)
    update_rework_status(db, rework_id, ReworkStatus.REINSPECTION, operator_id=current_user.id, remarks="提交复检")
    return RedirectResponse(f"/reworks/{rework_id}", status_code=303)


@app.post("/reworks/{rework_id}/inspect", response_class=HTMLResponse)
async def inspect_rework(
    rework_id: int,
    result: str = Form(...),
    quantity_passed: int = Form(...),
    quantity_failed: int = Form(...),
    remarks: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(db)
    
    inspection = InspectionCreate(
        result=result,
        quantity_passed=quantity_passed,
        quantity_failed=quantity_failed,
        remarks=remarks
    )
    create_inspection(db, inspection, rework_id, inspector_id=current_user.id)
    
    if result == "pass":
        update_rework_status(db, rework_id, ReworkStatus.APPROVED, operator_id=current_user.id, remarks=remarks)
    elif result == "rework":
        update_rework_status(db, rework_id, ReworkStatus.IN_PROGRESS, operator_id=current_user.id, remarks=remarks or "需继续返工")
    
    return RedirectResponse(f"/reworks/{rework_id}", status_code=303)


@app.post("/reworks/{rework_id}/scrap-request", response_class=HTMLResponse)
async def scrap_request(rework_id: int, db: Session = Depends(get_db)):
    current_user = get_current_user(db)
    update_rework_status(db, rework_id, ReworkStatus.SCRAP, operator_id=current_user.id, remarks="申请报废")
    return RedirectResponse(f"/reworks/{rework_id}", status_code=303)


@app.post("/reworks/{rework_id}/scrap-approve", response_class=HTMLResponse)
async def scrap_approve(rework_id: int, db: Session = Depends(get_db)):
    current_user = get_current_user(db)
    update_rework_status(db, rework_id, ReworkStatus.SCRAP_APPROVED, operator_id=current_user.id, remarks="报废审批通过")
    return RedirectResponse(f"/reworks/{rework_id}", status_code=303)


@app.get("/kanban", response_class=HTMLResponse)
async def kanban(request: Request, db: Session = Depends(get_db)):
    pending = get_rework_orders(db, status=ReworkStatus.PENDING)
    assigned = get_rework_orders(db, status=ReworkStatus.ASSIGNED)
    in_progress = get_rework_orders(db, status=ReworkStatus.IN_PROGRESS)
    reinspection = get_rework_orders(db, status=ReworkStatus.REINSPECTION)
    scrap = get_rework_orders(db, status=ReworkStatus.SCRAP)
    
    return templates.TemplateResponse(
        "kanban.html",
        {
            "request": request,
            "active_menu": "kanban",
            "pending": pending,
            "assigned": assigned,
            "in_progress": in_progress,
            "reinspection": reinspection,
            "scrap": scrap
        }
    )


@app.get("/process-guides", response_class=HTMLResponse)
async def process_guides_list(
    request: Request,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    guides = get_process_guides(db, category=category)
    return templates.TemplateResponse(
        "process_guides/list.html",
        {
            "request": request,
            "guides": guides,
            "active_menu": "process_guides",
            "categories": DefectCategory,
            "current_category": category
        }
    )


@app.get("/process-guides/new", response_class=HTMLResponse)
async def new_process_guide_form(request: Request):
    return templates.TemplateResponse(
        "process_guides/form.html",
        {
            "request": request,
            "active_menu": "process_guides",
            "defect_categories": DefectCategory,
            "guide": None
        }
    )


@app.post("/process-guides", response_class=HTMLResponse)
async def create_guide(
    request: Request,
    title: str = Form(...),
    defect_category: DefectCategory = Form(...),
    content: str = Form(...),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(db)
    guide_data = ProcessGuideCreate(title=title, defect_category=defect_category, content=content)
    create_process_guide(db, guide_data, author_id=current_user.id)
    return RedirectResponse("/process-guides", status_code=303)


@app.get("/process-guides/{guide_id}", response_class=HTMLResponse)
async def process_guide_detail(request: Request, guide_id: int, db: Session = Depends(get_db)):
    guide = get_process_guide(db, guide_id)
    if not guide:
        return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
    return templates.TemplateResponse(
        "process_guides/detail.html",
        {"request": request, "guide": guide, "active_menu": "process_guides"}
    )


@app.get("/exceptions", response_class=HTMLResponse)
async def exceptions_list(
    request: Request,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    feedbacks = get_exception_feedbacks(db, status=status)
    return templates.TemplateResponse(
        "exceptions/list.html",
        {
            "request": request,
            "feedbacks": feedbacks,
            "active_menu": "exceptions",
            "current_status": status
        }
    )


@app.get("/exceptions/new", response_class=HTMLResponse)
async def new_exception_form(request: Request, rework_id: Optional[int] = None, db: Session = Depends(get_db)):
    reworks = get_rework_orders(db)
    return templates.TemplateResponse(
        "exceptions/form.html",
        {
            "request": request,
            "active_menu": "exceptions",
            "reworks": reworks,
            "selected_rework_id": rework_id
        }
    )


@app.post("/exceptions", response_class=HTMLResponse)
async def create_exception(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    priority: str = Form("normal"),
    rework_order_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(db)
    feedback_data = ExceptionFeedbackCreate(
        title=title,
        description=description,
        priority=priority,
        rework_order_id=rework_order_id
    )
    create_exception_feedback(db, feedback_data, reporter_id=current_user.id)
    return RedirectResponse("/exceptions", status_code=303)


@app.post("/exceptions/{feedback_id}/resolve", response_class=HTMLResponse)
async def resolve_exception(feedback_id: int, db: Session = Depends(get_db)):
    resolve_exception_feedback(db, feedback_id)
    return RedirectResponse("/exceptions", status_code=303)


@app.get("/statistics", response_class=HTMLResponse)
async def statistics(request: Request, db: Session = Depends(get_db)):
    stats = get_quality_statistics(db)
    return templates.TemplateResponse(
        "statistics.html",
        {"request": request, "stats": stats, "active_menu": "statistics"}
    )


@app.get("/api/stats")
async def api_stats(db: Session = Depends(get_db)):
    return get_quality_statistics(db)


@app.get("/api/reworks")
async def api_reworks(status: Optional[str] = None, db: Session = Depends(get_db)):
    return get_rework_orders(db, status=status)


@app.get("/api/reworks/{rework_id}")
async def api_rework_detail(rework_id: int, db: Session = Depends(get_db)):
    rework = get_rework_order(db, rework_id)
    if not rework:
        raise HTTPException(status_code=404, detail="Rework order not found")
    return rework
