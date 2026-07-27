export const getWelcomeEmail = (firstName: string, frontendUrl: string = process.env.FRONTEND_URL || 'https://ruhmusafir.com') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Ruh Musafir</title>
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
              <h1 style="font-size: 34px; margin: 0 0 24px; color: #2A2C26;">Welcome to your mountain sanctuary, ${firstName}</h1>
              <p style="font-size: 17px; line-height: 34px; color: #444; margin: 0;">Your journey with <b>Ruh Musafir</b> has officially begun. Nestled in the quiet rhythm of Shangarh, our homestay was created for travelers who seek more than accommodation. A slower morning. A warmer cup of coffee. A deeper connection with mountains, people, and silence.</p>
              
              <div style="height: 1px; background: #E8E1D9; margin: 36px 0;"></div>
              
              <h2 style="color: #5C6E58;">Beyond the Walls</h2>
              <p style="line-height: 32px; color: #555;">As part of the Ruh Musafir experience, you'll discover:</p>
              <ul style="padding-left: 22px; line-height: 34px; color: #555;">
                <li>Mountain mornings with breathtaking views</li>
                <li>Freshly prepared cafe experiences</li>
                <li>Curated local moments and hidden gems</li>
                <li>Comfort designed for true rest</li>
                <li>Peaceful evenings beneath Himalayan skies</li>
              </ul>
              
              <div style="background: #F7F5F0; padding: 28px; border-left: 5px solid #A07A63; margin: 40px 0; line-height: 32px; color: #444;">
                Whether you're planning a peaceful retreat, a creative escape, or meaningful moments with loved ones—we're excited to host your story.
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}" style="display: inline-block; padding: 18px 42px; background: #5C6E58; color: white; text-decoration: none; border-radius: 999px; font-size: 14px; font-weight: 700; letter-spacing: 1px;">EXPLORE YOUR SANCTUARY</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin-top: 40px; line-height: 32px; color: #555;">Ready to experience the slow life? Your mountain escape awaits.</p>
              <div style="margin-top: 34px; color: #5C6E58; font-weight: 700;">— Team Ruh Musafir</div>
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