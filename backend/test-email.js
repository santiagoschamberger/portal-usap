// Test script to send activation email
require('dotenv').config();
const { Resend } = require('resend');

async function sendTestEmail() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  const BRAND_COLOR = '#9a132d';
  const BG_COLOR = '#f3f4f6';
  const CARD_BG = '#ffffff';
  const TEXT_COLOR = '#111827';
  const MUTED_TEXT = '#6b7280';
  const BORDER_COLOR = '#e5e7eb';
  
  const resetUrl = 'https://partnerportal.usapayments.com/auth/reset-password?token=test_token_12345';
  const logoUrl = 'https://partnerportal.usapayments.com/usa-payments-logo.png';
  
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>Welcome to USA Payments Partner Portal</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${TEXT_COLOR};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Welcome to USA Payments Partner Portal! Set your password to get started.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${BG_COLOR}; padding: 24px 0;">
      <tr>
        <td align="center" style="padding: 0 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 8px 0 16px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 12px;">
                  <tr>
                    <td style="padding: 24px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td align="left" style="padding: 0 0 16px 0;">
                            <img src="${logoUrl}" width="140" height="auto" alt="USA Payments" style="display: block; border: 0; outline: none; text-decoration: none; max-width: 140px; height: auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 0 8px 0;">
                            <div style="font-size: 20px; font-weight: 700; line-height: 1.25;">
                              Welcome to USA Payments Partner Portal!
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 0 16px 0;">
                            <div style="font-size: 14px; line-height: 1.6; color: ${MUTED_TEXT};">
                              Your account has been activated. Click the button below to set your password and access your portal.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 0 16px 0;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${BG_COLOR}; border-radius: 8px; padding: 12px;">
                              <tr>
                                <td style="font-size: 13px; line-height: 1.6; color: ${TEXT_COLOR};">
                                  <strong>Account Details:</strong><br />
                                  <span style="color: ${MUTED_TEXT};">Name:</span> Santiago Schamberger<br />
                                  <span style="color: ${MUTED_TEXT};">Email:</span> santiago@mediahubster.com
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td align="left" style="padding: 0 0 18px 0;">
                            <a href="${resetUrl}"
                               style="display: inline-block; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 600;">
                              Set Your Password
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 0 16px 0;">
                            <div style="font-size: 12px; line-height: 1.6; color: ${MUTED_TEXT};">
                              If the button doesn't work, copy and paste this link into your browser:
                              <br />
                              <a href="${resetUrl}" style="color: ${BRAND_COLOR}; word-break: break-all;">
                                ${resetUrl}
                              </a>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 0 8px 0;">
                            <div style="font-size: 12px; line-height: 1.6; color: ${MUTED_TEXT};">
                              If you didn't request this account, please contact us immediately.
                              For your security, this link expires after a short time.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 16px 0 0 0; border-top: 1px solid ${BORDER_COLOR};">
                            <div style="font-size: 12px; line-height: 1.6; color: ${MUTED_TEXT};">
                              Need help? <a href="https://bookings.usapayments.com/#/usapaymentsstrategicpartnership" style="color: ${BRAND_COLOR};">Contact us</a>.
                              <br />
                              © ${new Date().getFullYear()} USA Payments. All rights reserved.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'USA Payments <noreply@usapayments.co>',
      to: 'santiago@mediahubster.com',
      subject: 'Welcome to USA Payments Partner Portal — Set Your Password',
      html: html,
      text: `Welcome to USA Payments Partner Portal!

Your account has been activated:
Name: Santiago Schamberger
Email: santiago@mediahubster.com

Click the link below to set your password and access your account:
${resetUrl}

If you didn't request this account, please contact us immediately.

Need help? https://bookings.usapayments.com/#/usapaymentsstrategicpartnership`
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Test email sent successfully!');
    console.log('Email ID:', data.id);
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
}

sendTestEmail();
