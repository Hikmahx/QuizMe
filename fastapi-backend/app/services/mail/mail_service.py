"""
Mail service for QuizMe.
"""
from pathlib import Path

import httpx
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import get_settings

settings = get_settings()

TEMPLATES_DIR = Path(__file__).parent / "templates"
VIEWS_DIR = TEMPLATES_DIR / "views"

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


async def send_mail(*, to: str, subject: str, template: str, context: dict) -> None:
    """
    Render `templates/views/{template}.html` with `context` and send it via Brevo.

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

    payload = {
        "sender": {
            "name": settings.MAIL_FROM_NAME,
            "email": settings.MAIL_FROM,
        },
        "to": [{"email": to}],
        "subject": subject,
        "htmlContent": html,
    }

    if settings.MAIL_REPLY_TO:
        payload["replyTo"] = {"email": settings.MAIL_REPLY_TO}

    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(BREVO_API_URL, json=payload, headers=headers)
        response.raise_for_status()