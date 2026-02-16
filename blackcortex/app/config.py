from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017/rgk"
    database_name: str = "rgk"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth0
    auth0_domain: str = "dev-ygidkes0jet8f5yu.us.auth0.com"
    auth0_audience: str = ""
    auth0_algorithms: list[str] = ["RS256"]

    # App
    app_name: str = "RGK API"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:8081", "https://rentgrandkids.org"]

    # Rate limiting
    rate_limit_default: str = "100/minute"

    # Root users (auto-assigned root role on registration)
    rgk_root_users: list[str] = []

    # Internal API key for cron jobs
    internal_api_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
