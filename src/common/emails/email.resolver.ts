/* import {
  generalTemplate,
  consultantWelcomeTemplate,
  clientWelcomeTemplate,
  consultantInterviewNdaTemplate,
  clientInterviewNdaTemplate,
  interviewConfirmedTemplate,
  consultantHiredTemplate,
  consultantRejectedTemplate,
  paymentReceivedTemplate,
  payoutReleasedTemplate,
} from './email.template';

import { EmailType } from 'constant/enums';

export interface SendEmailPayload {
  to: string;
  type: EmailType;
  receiverName: string;
  dashboardUrl?: string;
  browseUrl?: string;
  ndaUrl?: string;
  date?: string;
  time?: string;
  meetUrl?: string;
  amount?: string;
  message?: string;
}

export function resolveEmail(payload: SendEmailPayload) {
  const { type } = payload;

  switch (type) {
    case EmailType.WELCOME_CONSULTANT:
      return {
        subject: 'Welcome to P9 – Consultant Account Ready',
        html: consultantWelcomeTemplate(
          payload.receiverName,
          payload.dashboardUrl!
        ),
      };

    case EmailType.WELCOME_CLIENT:
      return {
        subject: 'Welcome to P9 – Start Hiring',
        html: clientWelcomeTemplate(
          payload.receiverName,
          payload.browseUrl!
        ),
      };

    case EmailType.INTERVIEW_NDA_CONSULTANT:
      return {
        subject: 'Action Required: Sign NDA for Interview',
        html: consultantInterviewNdaTemplate(
          payload.receiverName,
          payload.ndaUrl!,
        ),
      };

    case EmailType.INTERVIEW_NDA_CLIENT:
      return {
        subject: 'Action Required: NDA Signature Pending',
        html: clientInterviewNdaTemplate(
          payload.receiverName,
          payload.ndaUrl!,
        ),
      };

    case EmailType.INTERVIEW_CONFIRMED:
      return {
        subject: 'Interview Confirmed',
        html: interviewConfirmedTemplate(
          payload.receiverName,
          payload.date!,
          payload.time!,
          payload.meetUrl!
        ),
      };

    case EmailType.CONSULTANT_HIRED:
      return {
        subject: 'Congratulations! You Have Been Hired',
        html: consultantHiredTemplate(
          payload.receiverName,
          payload.dashboardUrl!
        ),
      };

    case EmailType.CONSULTANT_REJECTED:
      return {
        subject: 'Interview Update',
        html: consultantRejectedTemplate(payload.receiverName),
      };

    case EmailType.PAYMENT_RECEIVED:
      return {
        subject: 'Payment Confirmed & Escrow Funded',
        html: paymentReceivedTemplate(
          payload.receiverName,
          payload.amount!
        ),
      };

    case EmailType.PAYOUT_RELEASED:
      return {
        subject: 'Payout Released',
        html: payoutReleasedTemplate(
          payload.receiverName,
          payload.amount!
        ),
      };

    default:
      return {
        subject: 'P9 Notification',
        html: generalTemplate(
          payload.receiverName,
          payload.message || 'System notification',
          'The P9 Team'
        ),
      };
  }
}
 */