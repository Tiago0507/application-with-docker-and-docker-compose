import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.redis_client import cache_delete_pattern
from app.core.config import get_settings
from app.models.project import Project
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(tags=["tasks"])
settings = get_settings()


async def _emit_event(event_type: str, payload: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.post(
                f"{settings.metrics_service_url}/events",
                json={"type": event_type, "payload": payload},
            )
    except Exception:
        pass


async def _get_project_or_404(project_id: int, db: AsyncSession) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/projects/{project_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(project_id: int, db: AsyncSession = Depends(get_db)):
    await _get_project_or_404(project_id, db)
    result = await db.execute(
        select(Task).where(Task.project_id == project_id).order_by(Task.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/projects/{project_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    project_id: int, payload: TaskCreate, db: AsyncSession = Depends(get_db)
):
    await _get_project_or_404(project_id, db)
    task = Task(project_id=project_id, **payload.model_dump())
    db.add(task)
    await db.flush()
    await db.refresh(task)
    await cache_delete_pattern("projects:*")
    await _emit_event("task_created", {"id": task.id, "title": task.title, "project_id": project_id})
    return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, payload: TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(task, field, value)

    await db.flush()
    await db.refresh(task)
    await cache_delete_pattern("projects:*")

    if payload.status and payload.status != old_status:
        await _emit_event(
            "task_completed" if task.status == "done" else "task_updated",
            {"id": task_id, "status": task.status, "project_id": task.project_id},
        )
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await cache_delete_pattern("projects:*")
    await _emit_event("task_deleted", {"id": task_id})
