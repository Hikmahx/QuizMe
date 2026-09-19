"""
Mail service for QuizMe.
"""
from pathlib import Path

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import get_settings

settings = get_settings()

TEMPLATES_DIR = Path(__file__).parent / "templates"
VIEWS_DIR = TEMPLATES_DIR / "views"

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)

_mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

_fast_mail = FastMail(_mail_config)


async def send_mail(*, to: str, subject: str, template: str, context: dict) -> None:
    """
    Render `templates/views/{template}.html` with `context` and send it.

    Usage:
        await send_mail(
            to="user@example.com",
            subject="Your QuizMe summary",
            template="summary_share",   # .html file inside templates/views
            context={"summary": "...", "sender_name": "Kimo"},
        )
    """
    view_path = VIEWS_DIR / f"{template}.html"
    if not view_path.exists():
        raise FileNotFoundError(f"Email template not found: {view_path}")

    jinja_template = _jinja_env.get_template(f"views/{template}.html")
    html = jinja_template.render(**context)

    message = MessageSchema(
        subject=subject,
        recipients=[to],
        body=html,
        subtype=MessageType.html,
    )

    await _fast_mail.send_message(message)
