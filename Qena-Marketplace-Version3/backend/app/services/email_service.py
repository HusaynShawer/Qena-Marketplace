import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, body: str, html: str = None):
    """Send email via SMTP asynchronously."""
    try:
        message = MIMEMultipart("alternative")
        message["From"] = settings.SMTP_FROM
        message["To"] = to_email
        message["Subject"] = subject

        # Plain text version
        message.attach(MIMEText(body, "plain"))

        # HTML version (optional)
        if html:
            message.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=settings.SMTP_TLS,
        )
        logger.info("Email sent successfully to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, str(e))
        raise

async def send_otp_email(to_email: str, otp: str, purpose: str = "verification"):
    """Send OTP email for registration or password reset."""
    subject = f"Your Qena Marketplace {purpose.title()} Code"
    
    body = f"""
    Hello,

    Your OTP code is: {otp}

    This code will expire in 15 minutes.
    
    If you didn't request this, please ignore this email.

    Best regards,
    Qena Marketplace Team
    """
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Qena Marketplace</h2>
          <p>Hello,</p>
          <p>Your <strong>{purpose.title()}</strong> code is:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; 
                      letter-spacing: 5px; font-weight: bold; border-radius: 5px;">
            {otp}
          </div>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
    """
    
    await send_email(to_email, subject, body, html)