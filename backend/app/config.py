from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DBNAME>"
    FINMIND_TOKEN: str = ""
    DISCORD_WEBHOOK_URL: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
