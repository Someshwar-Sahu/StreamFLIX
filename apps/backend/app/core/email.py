import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from app.core.config import settings

def send_otp_email(to_email: str, otp_code: str):
    host = "smtp.gmail.com"
    port = 465
    user = "a93767093@gmail.com"
    pwd = "bmezkdvylxzrurau"

    subject = f"StreamFlix Verification Code: {otp_code}"
    
    plain_text = (
        f"Welcome to StreamFlix!\n\n"
        f"Your 6-digit account security verification code is: {otp_code}\n\n"
        f"This code will expire in 15 minutes. If you did not request this code, please ignore this email.\n\n"
        f"— StreamFlix Security Team"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>StreamFlix Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0B0E14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0E14; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background: #131722; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.12); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                <tr>
                  <td style="padding: 32px 24px; background: linear-gradient(180deg, #1A1F2C 0%, #131722 100%); text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="font-size: 26px; font-weight: 800; color: #F5F5F0; letter-spacing: 2px; text-transform: uppercase;">
                      STREAM<span style="color: #F2A93B;">FLIX</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 28px; text-align: center;">
                    <h1 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin-top: 0; margin-bottom: 12px;">Verify Your Account</h1>
                    <p style="font-size: 15px; color: #8A8F98; line-height: 1.5; margin: 0 0 28px 0;">Welcome to StreamFlix! Please enter the 6-digit security code below to complete your sign up.</p>
                    
                    <div style="background-color: rgba(242, 169, 59, 0.08); border: 2px dashed #F2A93B; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #F2A93B; letter-spacing: 8px; display: block;">{otp_code}</span>
                    </div>
                    
                    <p style="font-size: 13px; color: #8A8F98; margin: 0;">This code expires in 15 minutes. If you did not request this code, please ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px; background-color: #0D1017; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 12px; color: #5B606B;">
                    &copy; 2026 StreamFlix Inc. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"StreamFlix Security <{user}>"
        msg["To"] = to_email
        msg["Reply-To"] = user
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="gmail.com")
        msg["X-Priority"] = "1"
        msg["X-MSMail-Priority"] = "High"
        msg["Importance"] = "High"

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        with smtplib.SMTP_SSL(host, port, timeout=10) as server:
            server.login(user, pwd)
            server.sendmail(user, to_email, msg.as_string())
        print(f"[OTP MAIL] Anti-Spam compliant OTP email successfully delivered to {to_email}")
    except Exception as e:
        print(f"\n=======================================================")
        print(f"[SMTP WARNING] Connection Warning: {e}")
        print(f"[STREAMFLIX MAIL SIMULATOR] OTP Code for {to_email}: {otp_code}")
        print(f"=======================================================\n")
