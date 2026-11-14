"""
Gmail Email Service for Flame in Freefall.
Handles:
  - Email verification OTP emails (to new users)
  - Admin login notification emails (to the admin/owner)
"""

import os
import smtplib
import threading
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ── Config ─────────────────────────────────────────────────────────────────────
GMAIL_SENDER       = os.getenv("GMAIL_SENDER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
ADMIN_EMAIL        = os.getenv("ADMIN_EMAIL", "")


def _send_email(to_email: str, subject: str, html_body: str, plain_body: str = "") -> bool:
    """Internal: send an HTML email via Gmail SMTP."""
    if not GMAIL_SENDER or not GMAIL_APP_PASSWORD:
        print("[EmailService] WARNING: GMAIL_SENDER or GMAIL_APP_PASSWORD not configured. Skipping email.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"NASA Flame in Freefall <{GMAIL_SENDER}>"
        msg["To"]      = to_email

        if plain_body:
            msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_SENDER, to_email, msg.as_string())

        print(f"[EmailService] ✅ Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        print(f"[EmailService] ❌ Failed to send email to {to_email}: {e}")
        return False


def _send_async(to_email: str, subject: str, html_body: str, plain_body: str = ""):
    """Send email in a background thread to avoid blocking the API response."""
    t = threading.Thread(
        target=_send_email,
        args=(to_email, subject, html_body, plain_body),
        daemon=True
    )
    t.start()


# ── Email Templates ────────────────────────────────────────────────────────────

def send_verification_email(to_email: str, otp: str):
    """Send email verification OTP to a newly registered user."""
    subject = "🔐 Verify your Flame in Freefall account"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#111827;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0f3460,#1a6fbf);padding:30px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">
                    🚀 FLAME IN FREEFALL
                  </h1>
                  <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;letter-spacing:2px;">
                    NASA MICROGRAVITY RESEARCH WORKSTATION
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <h2 style="margin:0 0 16px;color:#e2e8f0;font-size:20px;">Verify Your Email</h2>
                  <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
                    Welcome to the Flame in Freefall research workstation. 
                    Use the verification code below to complete your registration.
                  </p>

                  <!-- OTP Box -->
                  <div style="text-align:center;margin:0 0 32px;">
                    <div style="display:inline-block;background:#0f3460;border:2px solid #1a6fbf;
                                border-radius:10px;padding:20px 48px;">
                      <p style="margin:0 0 6px;color:#93c5fd;font-size:12px;letter-spacing:3px;text-transform:uppercase;">
                        Your Verification Code
                      </p>
                      <p style="margin:0;color:#ffffff;font-size:42px;font-weight:700;letter-spacing:12px;">
                        {otp}
                      </p>
                    </div>
                  </div>

                  <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;text-align:center;">
                    ⏳ This code expires in <strong style="color:#f59e0b;">15 minutes</strong>.<br>
                    If you did not request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#0a0f1e;padding:20px 40px;text-align:center;
                           border-top:1px solid #1e293b;">
                  <p style="margin:0;color:#475569;font-size:12px;">
                    NASA Physical Sciences Informatics (PSI) &amp; NTRS Analysis Suite
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    plain_body = f"Your Flame in Freefall verification code is: {otp}\nExpires in 15 minutes."
    _send_async(to_email, subject, html_body, plain_body)


def send_admin_login_notification(user_email: str, ip_address: str, user_agent: str):
    """Send an admin notification email when a user successfully logs in."""
    if not ADMIN_EMAIL:
        print("[EmailService] ADMIN_EMAIL not set — skipping admin login notification.")
        return

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subject  = f"🔐 [NASA Workstation] Login Alert — {user_email}"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#111827;border-radius:12px;border:1px solid #dc2626;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:30px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">
                    🛡️ SECURITY ALERT
                  </h1>
                  <p style="margin:6px 0 0;color:#fca5a5;font-size:13px;letter-spacing:2px;">
                    FLAME IN FREEFALL — LOGIN NOTIFICATION
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="color:#94a3b8;font-size:15px;margin:0 0 28px;">
                    A user just signed in to your NASA Workstation. 
                    Review the details below.
                  </p>

                  <!-- Details Table -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="border-radius:8px;overflow:hidden;border:1px solid #1e293b;">
                    <tr style="background:#0f172a;">
                      <td style="padding:14px 20px;color:#64748b;font-size:13px;width:140px;">👤 User</td>
                      <td style="padding:14px 20px;color:#e2e8f0;font-size:14px;font-weight:600;">
                        {user_email}
                      </td>
                    </tr>
                    <tr style="background:#111827;">
                      <td style="padding:14px 20px;color:#64748b;font-size:13px;">🕐 Time</td>
                      <td style="padding:14px 20px;color:#e2e8f0;font-size:14px;">{now_str}</td>
                    </tr>
                    <tr style="background:#0f172a;">
                      <td style="padding:14px 20px;color:#64748b;font-size:13px;">🌐 IP Address</td>
                      <td style="padding:14px 20px;color:#fbbf24;font-size:14px;font-family:monospace;">
                        {ip_address or "Unknown"}
                      </td>
                    </tr>
                    <tr style="background:#111827;">
                      <td style="padding:14px 20px;color:#64748b;font-size:13px;">💻 Browser</td>
                      <td style="padding:14px 20px;color:#e2e8f0;font-size:13px;">
                        {(user_agent or "Unknown")[:80]}
                      </td>
                    </tr>
                  </table>

                  <div style="margin:24px 0 0;padding:16px 20px;background:#1c1917;
                              border-left:4px solid #f59e0b;border-radius:4px;">
                    <p style="margin:0;color:#fbbf24;font-size:13px;">
                      ⚠️ If this was not you or looks suspicious, secure your workstation immediately.
                    </p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#0a0f1e;padding:20px 40px;text-align:center;
                           border-top:1px solid #1e293b;">
                  <p style="margin:0;color:#475569;font-size:12px;">
                    Flame in Freefall · NASA Microgravity Combustion Research Workstation
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    plain_body = (
        f"Login Alert — Flame in Freefall\n"
        f"User: {user_email}\n"
        f"Time: {now_str}\n"
        f"IP: {ip_address}\n"
        f"Browser: {user_agent}\n"
    )
    _send_async(ADMIN_EMAIL, subject, html_body, plain_body)


def send_admin_registration_notification(user_email: str, ip_address: str):
    """Send an admin notification email when a new user registers."""
    if not ADMIN_EMAIL:
        return

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subject  = f"🆕 [NASA Workstation] New Registration — {user_email}"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#111827;border-radius:12px;border:1px solid #0891b2;overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#164e63,#0891b2);padding:30px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">
                    🆕 NEW USER REGISTERED
                  </h1>
                  <p style="margin:6px 0 0;color:#a5f3fc;font-size:13px;letter-spacing:2px;">
                    FLAME IN FREEFALL — REGISTRATION ALERT
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="border-radius:8px;overflow:hidden;border:1px solid #1e293b;">
                    <tr style="background:#0f172a;">
                      <td style="padding:14px 20px;color:#64748b;font-size:13px;width:140px;">📧 Email</td>
                      <td style="padding:14px 20px;color:#e2e8f0;font-size:14px;font-weight:600;">
                        {user_email}
                      </td>
                    </tr>
                    <tr style="background:#111827;">
                      <td style="padding:14px 20px;color:#64748b;font-size:13px;">🕐 Time</td>
                      <td style="padding:14px 20px;color:#e2e8f0;font-size:14px;">{now_str}</td>
                    </tr>
                    <tr style="background:#0f172a;">
                      <td style="padding:14px 20px;color:#64748b;font-size:13px;">🌐 IP Address</td>
                      <td style="padding:14px 20px;color:#fbbf24;font-size:14px;font-family:monospace;">
                        {ip_address or "Unknown"}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background:#0a0f1e;padding:20px 40px;text-align:center;
                           border-top:1px solid #1e293b;">
                  <p style="margin:0;color:#475569;font-size:12px;">
                    Flame in Freefall · NASA Microgravity Combustion Research Workstation
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    _send_async(ADMIN_EMAIL, subject, html_body)
