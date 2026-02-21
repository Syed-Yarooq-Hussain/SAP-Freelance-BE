import * as nodemailer from 'nodemailer';
import { generalTemplate, resetPasswordTemplate, verifyEmailTemplate } from './email.template';
import { EmailType } from 'constant/enums';
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  type: EmailType,
  receiverName: string,
  senderName: string,
  verifyLink?: string
) {
  try {
    console.log(`[EmailUtil][DEBUG] sendEmail called -> to=${to} type=${type} receiver=${receiverName}`);
    let message = "";

    switch (type) {
      case EmailType.SHORTLIST:
        message = "Your candidate has been shortlisted.";
        break;

      case EmailType.INVITE:
        message = "You have received the portal invite.";
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
        message = "Welcome to our portal!";
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
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      debug: true,
      logger: true,
    });

    console.log(`[EmailUtil][DEBUG] email transporter configured host=${process.env.MAIL_HOST} port=${process.env.MAIL_PORT}`);
    let info = null;
    // 🔹 Email Send
    try {
    console.log(`[EmailUtil] Sending email via Resend -> ${to}`);

    let subject = `Notification: ${type}`;
    let html = generalTemplate(
      receiverName,
      "This is a system notification.",
      senderName
    );

    // ✅ Preserve Your Template Logic
    if (type === EmailType.SIGNUP_VERIFICATION && verifyLink) {
      subject = "P9 System: Verify your Email";
      html = verifyEmailTemplate(receiverName, verifyLink);
    }

    if (type === EmailType.RESET_PASSWORD && verifyLink) {
      subject = "P9 System: Password Reset Request";
      html = resetPasswordTemplate(verifyLink);
    }

    const { data, error } = await resend.emails.send({
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[EmailUtil] Resend Error:", error);
      return {
        status: false,
        error,
      };
    }

    console.log("[EmailUtil] Email sent successfully:", data?.id);

    return {
      status: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error("[EmailUtil] Unexpected Error:", error);
    return {
      status: false,
      error: error.message,
    };
  }
    
   

    console.log(`[EmailUtil][DEBUG] email sent result messageId=${info?.messageId}`);
    return {
      status: true,
      messageId: info?.messageId,
    };
  } catch (error: any) {
    console.log(`[EmailUtil][ERROR] Error sending email`, error?.stack || error?.message || String(error));
    return {
      status: false,
      error: error.message,
    };
  }
}
