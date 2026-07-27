import logging
import os

import resend

import config  # noqa: F401  ensures .env is loaded

logger = logging.getLogger(__name__)

resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


def send_reset_code(email: str, code: str, name: str):
    """Sends the 6-digit password reset code. Runs as a background task."""
    first = (name or "").split()[0] if name else "Sportsfreund"
    html = f"""
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#DA291C">TuS Oberhausen II</h2>
      <p>Hallo {first},</p>
      <p>du hast angefordert, dein Passwort zurückzusetzen. Dein Code lautet:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#DA291C;
                background:#FEECEB;padding:16px 24px;border-radius:12px;text-align:center">
        {code}
      </p>
      <p>Gib diesen Code in der App ein, um ein neues Passwort zu vergeben.
         Der Code ist 15 Minuten gültig.</p>
      <p style="color:#8A8A8E;font-size:13px">
         Falls du das nicht warst, kannst du diese E-Mail ignorieren.</p>
    </div>
    """
    try:
        resend.Emails.send({
            "from": f"TuS Oberhausen II <{SENDER_EMAIL}>",
            "to": [email],
            "subject": "Passwort zurücksetzen – Dein Code",
            "html": html,
        })
        logger.info("Reset code email sent to %s", email)
    except Exception as e:
        logger.warning("Failed to send reset email to %s: %s", email, e)
