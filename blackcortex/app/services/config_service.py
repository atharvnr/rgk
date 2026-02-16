from datetime import UTC, datetime

from app.models.app_config import AppConfig
from app.schemas.app_config import AppConfigCreate, AppConfigUpdate
from app.utils.exceptions import ConflictError, NotFoundError


async def create_config(data: AppConfigCreate, actor_id: str) -> AppConfig:
    existing = await AppConfig.find_one(AppConfig.key == data.key)
    if existing:
        raise ConflictError(f"Config key '{data.key}' already exists")

    config = AppConfig(
        key=data.key,
        value=data.value,
        description=data.description,
        updated_by=actor_id,
    )
    await config.insert()
    return config


async def get_config_by_key(key: str) -> AppConfig:
    config = await AppConfig.find_one(AppConfig.key == key)
    if config is None:
        raise NotFoundError(f"Config key '{key}' not found")
    return config


async def list_configs() -> list[AppConfig]:
    return await AppConfig.find().to_list()


async def update_config(key: str, data: AppConfigUpdate, actor_id: str) -> AppConfig:
    config = await get_config_by_key(key)
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_by"] = actor_id
        update_data["updated_at"] = datetime.now(UTC)
        await config.set(update_data)
    return config


async def delete_config(key: str) -> None:
    config = await get_config_by_key(key)
    await config.delete()
