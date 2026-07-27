export const getResetPasswordEmail = (firstName: string, resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password - Ruh Musafir</title>
</head>
<body style="margin: 0; padding: 0; background: #F7F5F0; font-family: Arial, Helvetica, sans-serif; color: #2A2C26;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="640" style="width: 100%; max-width: 640px; background: #ffffff;">
          <tr>
            <td style="background: linear-gradient(180deg, #5C6E58 0%, #4A5A46 100%); padding: 50px 40px; text-align: center;">
              <div style="font-size: 44px; line-height: 1; margin-bottom: 18px;">⛰</div>
              <div style="font-size: 34px; font-weight: 700; letter-spacing: 1px; color: white;">Ruh Musafir</div>
              <div style="margin-top: 8px; color: #E8E1D9; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Homestay & Cafe</div>
              <div style="margin-top: 20px; font-size: 16px; line-height: 28px; color: white; opacity: .95;">Arrive as a Guest • Stay as a Local</div>
              <div style="margin-top: 10px; font-size: 14px; line-height: 24px; color: #E8E1D9;">Experience the Slow Life in the heart of the Himalayas</div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 50px 38px;">
              <h1 style="margin: 0 0 22px; font-size: 34px; color: #2A2C26;">Reset Your Password</h1>
              <p style="line-height: 34px; font-size: 17px; color: #555;">Hello ${firstName},<br><br>We received a request to reset the password for your <b>Ruh Musafir</b> account. Your sanctuary is protected, and for your security, this link is temporary.</p>
              
              <div style="margin: 40px 0; padding: 30px; background: #F7F5F0; border-left: 5px solid #A07A63;">
                <div style="font-size: 18px; font-weight: 700; color: #5C6E58; margin-bottom: 12px;">Secure Access Window</div>
                <div style="line-height: 30px; color: #555;">This reset link will remain active for: <b>15 minutes</b> and can only be used once.</div>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 18px 40px; background: #5C6E58; color: white; text-decoration: none; border-radius: 999px; font-size: 14px; font-weight: 700; letter-spacing: 1px;">RESET PASSWORD</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin-top: 40px; line-height: 32px; color: #555;">If the button above doesn't work, copy and paste this link:</p>
              <p style="word-break: break-word; font-size: 13px; color: #777;">${resetUrl}</p>
              
              <hr style="border: none; border-top: 1px solid #E8E1D9; margin: 42px 0;" />
              
              <h2 style="color: #5C6E58;">Meanwhile, Dream of the Mountains</h2>
              <p style="line-height: 32px; color: #555;">While you're here, remember—the quiet mornings, warm café moments, and mountain experiences of Shangarh are waiting.</p>
              <p style="line-height: 32px; color: #555;">If you didn't request this, you can safely ignore this email.</p>
              
              <div style="margin-top: 40px; font-weight: 700; color: #5C6E58;">— Team Ruh Musafir</div>
            </td>
          </tr>

          <tr>
            <td style="background: #2A2C26; padding: 45px 30px; text-align: center;">
              <div style="color: #ffffff; font-size: 20px; font-weight: 600;">Ruh Musafir Homestay & Cafe</div>
              <div style="margin-top: 18px; color: #E8E1D9; line-height: 28px; font-size: 14px;">Shangarh, Sainj Valley, Kullu<br/>Himachal Pradesh 175134, India</div>
              <div style="margin-top: 30px">
                <a href="https://www.instagram.com/ruhmusafirhomestay/" style="color: #A07A63; text-decoration: none; margin-right: 18px; font-weight: 600;">Instagram</a>
                <a href="https://www.facebook.com/ruhmusafirhomestay/" style="color: #A07A63; text-decoration: none; font-weight: 600;">Facebook</a>
              </div>
              <div style="margin-top: 30px; color: #999; font-size: 12px;">© ${new Date().getFullYear()} Ruh Musafir. All rights reserved.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;