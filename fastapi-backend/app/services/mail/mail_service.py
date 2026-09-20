"""
Mail service for QuizMe.
"""
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import get_settings

settings = get_settings()

TEMPLATES_DIR = Path(__file__).parent / "templates"
VIEWS_DIR = TEMPLATES_DIR / "views"

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


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

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    message["To"] = to
    message["Reply-To"] = settings.MAIL_REPLY_TO or settings.MAIL_FROM
    message.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        message,
        sender=settings.MAIL_FROM,
        recipients=[to],
        hostname=settings.MAIL_SERVER,
        port=settings.MAIL_PORT,
        username=settings.MAIL_USERNAME,
        password=settings.MAIL_PASSWORD,
        start_tls=settings.MAIL_STARTTLS,
        use_tls=settings.MAIL_SSL_TLS,
        timeout=10,          # fail fast if the network is unreachable
    )