from fastapi import APIRouter, HTTPException

from app.schemas.share import EmailShareRequest, EmailShareResponse
from app.services.mail.mail_service import send_mail

router = APIRouter()


@router.post("/email", response_model=EmailShareResponse)
async def share_summary_by_email(body: EmailShareRequest):
    try:
        await send_mail(
            to=body.to,
            subject=(
                f"Summary: {body.doc_name}" if body.doc_name else "A summary from QuizMe"
            ),
            template="summary_share",  # app/services/mail/templates/views/summary_share.html
            context={
                "summary": body.summary,
                "doc_name": body.doc_name,
                "sender_name": body.sender_name or "Someone",
                "recipient_name": body.recipient_name,
            },
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return EmailShareResponse(success=True, message="Email sent")
