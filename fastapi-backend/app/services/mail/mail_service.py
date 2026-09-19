"""
Mail service for QuizMe.

fastapi-mail changed to smtplib due to compatibility errors: fastapi-mail 1.6.8
requires pydantic>=2.12.5, which conflicts with crewai's pydantic~=2.11.9
pin already in requirements.txt. smtplib has zero dependencies, so it
can't collide with anything else in this project.
"""
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import get_settings

settings = get_settings()

TEMPLATES_DIR = Path(__file__).parent / "templates"
VIEWS_DIR = TEMPLATES_DIR / "views"

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


def _send_sync(to: str, subject: str, html: str) -> None:
    """The actual blocking SMTP call — runs off the event loop via to_thread."""
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    message["To"] = to
    message["Reply-To"] = settings.MAIL_REPLY_TO or settings.MAIL_FROM
    message.attach(MIMEText(html, "html"))

    if settings.MAIL_SSL_TLS:
        # Implicit TLS from the start of the connection (typically port 465)
        smtp = smtplib.SMTP_SSL(settings.MAIL_SERVER, settings.MAIL_PORT)
    else:
        # Plain connection upgraded via STARTTLS (typically port 587)
        smtp = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)

    try:
        if settings.MAIL_STARTTLS and not settings.MAIL_SSL_TLS:
            smtp.starttls()
        smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        smtp.sendmail(settings.MAIL_FROM, [to], message.as_string())
    finally:
        smtp.quit()


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

    # smtplib is blocking — offload it, same pattern as the TTL cleanup
    # loop in main.py (asyncio.to_thread(cleanup_stale_collections)).
    await asyncio.to_thread(_send_sync, to, subject, html)
