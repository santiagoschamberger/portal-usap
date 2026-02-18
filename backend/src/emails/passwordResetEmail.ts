type PasswordResetEmailArgs = {
  resetUrl: string;
  logoUrl?: string;
  productName?: string;
  supportUrl?: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

const DEFAULT_PRODUCT_NAME = 'USA Payments Partner Portal';
const DEFAULT_SUPPORT_URL = 'https://bookings.usapayments.com/#/usapaymentsstrategicpartnership';

const BRAND_COLOR = '#9a132d';
const BG_COLOR = '#f3f4f6';
const CARD_BG = '#ffffff';
const TEXT_COLOR = '#111827';
const MUTED_TEXT = '#6b7280';
const BORDER_COLOR = '#e5e7eb';

export function renderPasswordResetEmail(args: PasswordResetEmailArgs): RenderedEmail {
  const productName = args.productName || DEFAULT_PRODUCT_NAME;
  const supportUrl = args.supportUrl || DEFAULT_SUPPORT_URL;
  const logoUrl = args.logoUrl;

  const subject = `Reset your password — ${productName}`;

  const text = [
    `Reset your password`,
    ``,
    `We received a request to reset the password for your ${productName} account.`,
    `Use the link below to choose a new password:`,
    `${args.resetUrl}`,
    ``,
    `If you didn't request this, you can safely ignore this email.`,
    ``,
    `Need help? ${supportUrl}`,
  ].join('\n');

  // Email HTML: table-based + inline styles for broad client support.
  const logoHtml = logoUrl
    ? `
      <tr>
        <td align="left" style="padding: 0 0 16px 0;">
          <img src="${escapeHtml(logoUrl)}" width="140" height="auto" alt="USA Payments" style="display: block; border: 0; outline: none; text-decoration: none; max-width: 140px; height: auto;" />
        </td>
      </tr>
    `
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${TEXT_COLOR};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Reset your password for ${escapeHtml(productName)}.
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
                        ${logoHtml}
                        <tr>
                          <td style="padding: 0 0 8px 0;">
                            <div style="font-size: 20px; font-weight: 700; line-height: 1.25;">
                              Reset your password
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 0 16px 0;">
                            <div style="font-size: 14px; line-height: 1.6; color: ${MUTED_TEXT};">
                              We received a request to reset the password for your ${escapeHtml(productName)} account.
                              If you made this request, click the button below to choose a new password.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td align="left" style="padding: 0 0 18px 0;">
                            <a href="${escapeHtml(args.resetUrl)}"
                               style="display: inline-block; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 600;">
                              Reset password
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 0 16px 0;">
                            <div style="font-size: 12px; line-height: 1.6; color: ${MUTED_TEXT};">
                              If the button doesn’t work, copy and paste this link into your browser:
                              <br />
                              <a href="${escapeHtml(args.resetUrl)}" style="color: ${BRAND_COLOR}; word-break: break-all;">
                                ${escapeHtml(args.resetUrl)}
                              </a>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 0 8px 0;">
                            <div style="font-size: 12px; line-height: 1.6; color: ${MUTED_TEXT};">
                              If you didn’t request a password reset, you can safely ignore this email.
                              For your security, this link expires after a short time.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 16px 0 0 0; border-top: 1px solid ${BORDER_COLOR};">
                            <div style="font-size: 12px; line-height: 1.6; color: ${MUTED_TEXT};">
                              Need help? <a href="${escapeHtml(supportUrl)}" style="color: ${BRAND_COLOR};">Contact us</a>.
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

  return { subject, html, text };
}

function escapeHtml(input: string): string {
  // ES2020-safe (no String.prototype.replaceAll)
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

