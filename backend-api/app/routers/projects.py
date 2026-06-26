import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.core.database import get_db
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.core.config import get_settings
from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse

router = APIRouter(prefix="/projects", tags=["projects"])
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


@router.get("", response_model=list[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    cached = await cache_get("projects:all")
    if cached:
        return cached

    result = await db.execute(
        select(
            Project,
            func.count(Task.id).label("task_count"),
            func.sum(
                case((Task.status == TaskStatus.done, 1), else_=0)
            ).label("completed_tasks"),
        )
        .outerjoin(Task, Task.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
    )
    rows = result.all()

    projects = []
    for row in rows:
        project, task_count, completed_tasks = row
        data = ProjectResponse.model_validate(
            {**project.__dict__, "task_count": task_count or 0, "completed_tasks": completed_tasks or 0}
        )
        projects.append(data.model_dump())

    await cache_set("projects:all", projects, ttl=30)
    return projects


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**payload.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)

    response = ProjectResponse.model_validate(project)
    await cache_delete_pattern("projects:*")
    await _emit_event("project_created", {"id": project.id, "name": project.name})
    return response


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    cached = await cache_get(f"projects:{project_id}")
    if cached:
        return cached

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task_count = await db.scalar(
        select(func.count(Task.id)).where(Task.project_id == project_id)
    )
    completed = await db.scalar(
        select(func.count(Task.id)).where(
            Task.project_id == project_id, Task.status == TaskStatus.done
        )
    )

    data = ProjectDetailResponse.model_validate(
        {
            **project.__dict__,
            "task_count": task_count or 0,
            "completed_tasks": completed or 0,
            "tasks": [
                {"id": t.id, "title": t.title, "status": t.status, "priority": t.priority}
                for t in project.tasks
            ],
        }
    )

    dumped = data.model_dump()
    await cache_set(f"projects:{project_id}", dumped, ttl=30)
    return dumped


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int, payload: ProjectUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(project, field, value)

    await db.flush()
    await db.refresh(project)
    await cache_delete_pattern("projects:*")
    await _emit_event("project_updated", {"id": project_id})
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)
    await cache_delete_pattern("projects:*")
    await _emit_event("project_deleted", {"id": project_id})
