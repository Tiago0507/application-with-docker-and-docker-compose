from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "DevBoard API"
    app_version: str = "1.0.0"
    debug: bool = False

    database_url: str
    redis_url: str = "redis://redis:6379/0"

    metrics_service_url: str = "http://backend-metrics:3001"

    cors_origins: list[str] = ["http://localhost:5173", "http://frontend:80", "http://nginx:80", "http://localhost"]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
