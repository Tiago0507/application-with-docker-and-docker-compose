from datetime import datetime
from pydantic import BaseModel, Field
from app.models.project import ProjectStatus


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")
    status: ProjectStatus = ProjectStatus.active


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    status: ProjectStatus | None = None


class TaskSummary(BaseModel):
    id: int
    title: str
    status: str
    priority: str

    model_config = {"from_attributes": True}


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    completed_tasks: int = 0

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    tasks: list[TaskSummary] = []
