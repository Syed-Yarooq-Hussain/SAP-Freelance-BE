import { ForbiddenException } from '@nestjs/common';
import { resetPasswordTemplate, verifyEmailTemplate } from './email.template';
import { EmailType } from '../../../constant/enums';
import { Resend } from 'resend';

export function assertEmailEnabled(type?: EmailType): void {
  if (type !== EmailType.SIGNUP_VERIFICATION && type !== EmailType.RESET_PASSWORD) {
    throw new ForbiddenException('Only signup verification and password-reset emails are enabled');
  }
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(apiKey);
}

function getSender() {
  return process.env.EMAIL_FROM?.trim() || 'The Consult Crew <no-reply@theconsultcrew.com>';
}

export async function sendConsultantInvitationEmail(_to: string): Promise<string | null> {
  assertEmailEnabled(EmailType.INVITE);
  return null;
}

export async function sendEmail(
  to: string,
  type: EmailType,
  receiverName: string,
  _senderName: string,
  verifyLink?: string,
) {
  try {
    // Unknown and future notification types stay disabled as well.
    assertEmailEnabled(type);
    if (!verifyLink?.trim()) throw new Error('Verification or reset link is required');
    const verification = type === EmailType.SIGNUP_VERIFICATION;
    const result = await getResendClient().emails.send({
      from: getSender(),
      to,
      subject: verification ? 'Consultcrew: Verify your Email' : 'Consultcrew: Password Reset Request',
      html: verification
        ? verifyEmailTemplate(receiverName, verifyLink)
        : resetPasswordTemplate(verifyLink),
    });
    if (result.error) throw new Error(result.error.message);
    return { status: true, messageId: result.data?.id };
  } catch (error: any) {
    return { status: false, error: error.message };
  }
}
