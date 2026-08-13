import * as nodemailer from 'nodemailer';
import { consultantInvitationTemplate, generalTemplate, resetPasswordTemplate, verifyEmailTemplate } from './email.template';
import { EmailType } from 'constant/enums';
import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(apiKey);
}

export async function sendConsultantInvitationEmail(to: string) {
  const result = await getResendClient().emails.send({
    from: 'The Consult Crew <no-reply@safeedposhkarachi.xyz>',
    to,
    subject: 'You’re Invited to Join The Consult Crew',
    html: consultantInvitationTemplate(),
  });

  if (result.error) throw new Error(result.error.message);
  return result.data?.id || null;
}

export async function sendEmail(
  to: string,
  type: EmailType,
  receiverName: string,
  senderName: string,
  verifyLink?: string
) {
  try {
    let message = "";

    switch (type) {
      case EmailType.SHORTLIST:
        message = "Your candidate has been shortlisted.";
        break;

      case EmailType.INVITE:
        message = "You have received the Consultcrew invite.";
        break;

      case EmailType.NDA:
        message = "Your NDA has been generated.";
        break;

      case EmailType.INVOICE:
        message = "Your invoice has been generated.";
        break;

      case EmailType.BILL:
        message = "Your bill has been generated.";
        break;
      case EmailType.WELCOME:
        message = "Welcome to Consultcrew portal!";
        break;
      case EmailType.SIGNUP:
        message = "Your signup has been confirmed.";
        break;
      case EmailType.CUSTOMER_SIGNED:
        message = "Customer has signed the contract and NDA.";
        break;
      case EmailType.CONSULTANT_REJECTED:
        message = "Consultant has been rejected by the client.";
        break;
      case EmailType.CLIENT_REJECTED:
        message = "Client has rejected the NDA.";
        break;


      default:
        message = "This is a system notification.";
    }

    // 🔹 Transporter
    /* const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    }); */

    let info = null;
    // 🔹 Email Send
    try {
      if (type === EmailType.SIGNUP_VERIFICATION && verifyLink) {
        info = await getResendClient().emails.send({
          from: `Consultcrew <no-reply@safeedposhkarachi.xyz>`,
          to,
          subject: `Consultcrew: Verify your Email`,
          html: verifyEmailTemplate(receiverName, verifyLink),
        });

      } else if (type === EmailType.RESET_PASSWORD && verifyLink) {
        console.log("Sending reset password email to:", to);
        info = await getResendClient().emails.send({
          from: `Consultcrew <no-reply@safeedposhkarachi.xyz>`,
          to,
          subject: `Consultcrew: Password Reset Request`,
          html: resetPasswordTemplate(verifyLink),
        });
      } else {
        info = await getResendClient().emails.send({
          from: `Consultcrew <no-reply@safeedposhkarachi.xyz>`,
          to,
          subject: `Consultcrew: Notification`,
          html: generalTemplate(receiverName, message, senderName),
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }



    return {
      status: true,
      messageId: info?.messageId,
    };
  } catch (error: any) {
    return {
      status: false,
      error: error.message,
    };
  }
}
