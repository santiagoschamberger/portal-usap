import { Resend } from 'resend';

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function hasResendConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function canSendTransactionalEmail(): boolean {
  return hasResendConfig();
}

export async function sendTransactionalEmail(args: SendEmailArgs): Promise<void> {
  if (!hasResendConfig()) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL)');
  }

  const resend = new Resend(process.env.RESEND_API_KEY as string);

  const fromEmail = process.env.RESEND_FROM_EMAIL as string;
  const fromName = process.env.RESEND_FROM_NAME || 'USA Payments';
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const { error } = await resend.emails.send({
    to: args.to,
    from,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });

  if (error) {
    throw new Error(error.message);
  }
}

