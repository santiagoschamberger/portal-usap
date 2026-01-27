import { supabase, supabaseAdmin } from '../config/database';
import { canSendTransactionalEmail, sendTransactionalEmail } from './emailService';
import { renderPasswordResetEmail } from '../emails/passwordResetEmail';

type SendPasswordResetArgs = {
  email: string;
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
 * Sends a password reset email.
 *
 * - If SendGrid is configured, we generate a Supabase recovery link and send a branded email (logo + professional copy).
 * - Otherwise, we fall back to Supabase's built-in reset email template.
 *
 * Security: always returns success semantics upstream; do not leak whether an email exists.
 */
export async function sendPasswordResetEmail(args: SendPasswordResetArgs): Promise<void> {
  const email = args.email.toLowerCase();

  if (!canSendTransactionalEmail()) {
    // Fallback: Supabase hosted email (template controlled in Supabase dashboard).
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: args.redirectTo });
    if (error) {
      throw error;
    }
    return;
  }

  // Custom email path: generate recovery link and send via SendGrid.
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
  const rendered = renderPasswordResetEmail({
    resetUrl,
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

