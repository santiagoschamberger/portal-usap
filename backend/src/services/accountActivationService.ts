import { supabaseAdmin } from '../config/database';
import { canSendTransactionalEmail, sendTransactionalEmail } from './emailService';
import { renderAccountActivationEmail } from '../emails/accountActivationEmail';

type SendAccountActivationArgs = {
  email: string;
  firstName: string;
  lastName: string;
  redirectTo: string;
};

function getLogoUrl(): string | undefined {
  // Prefer explicit env override; fallback to serving from the frontend.
  const explicit = process.env.EMAIL_LOGO_URL;
  if (explicit) return explicit;

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) return undefined;

  // Note: frontend serves this from /public
  return `${frontendUrl.replace(/\/$/, '')}/usa-payments-logo.png`;
}

/**
 * Sends an account activation email with account details and password setup link.
 *
 * - If Resend is configured, we generate a Supabase recovery link and send a branded email with account info.
 * - Otherwise, we fall back to Supabase's built-in reset email template.
 *
 * Security: always returns success semantics upstream; do not leak whether an email exists.
 */
export async function sendAccountActivationEmail(args: SendAccountActivationArgs): Promise<void> {
  const email = args.email.toLowerCase();

  if (!canSendTransactionalEmail()) {
    // Fallback: Supabase hosted email (template controlled in Supabase dashboard).
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo: args.redirectTo });
    if (error) {
      throw error;
    }
    return;
  }

  // Custom email path: generate recovery link and send via Resend.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: args.redirectTo },
  });

  // If user doesn't exist (or any other error), do not reveal it; just log upstream.
  if (error || !data?.properties?.action_link) {
    if (error) {
      throw error;
    }
    throw new Error('Failed to generate recovery link');
  }

  const resetUrl = data.properties.action_link;
  const rendered = renderAccountActivationEmail({
    resetUrl,
    firstName: args.firstName,
    lastName: args.lastName,
    email: args.email,
    logoUrl: getLogoUrl(),
    productName: 'USA Payments Partner Portal',
  });

  await sendTransactionalEmail({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}
