import { Resend } from "resend";
import {
  generalTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "./email.template";
import { EmailType } from "constant/enums";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  type: EmailType,
  receiverName: string,
  senderName: string,
  verifyLink?: string
) {
  try {
    console.log(`[EmailUtil] sendEmail via Resend -> to=${to} type=${type}`);

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

    let subject = `Notification: ${type}`;
    let html = generalTemplate(receiverName, message, senderName);

    if (type === EmailType.SIGNUP_VERIFICATION && verifyLink) {
      subject = "P9 System: Verify your Email";
      html = verifyEmailTemplate(receiverName, verifyLink);
    }

    if (type === EmailType.RESET_PASSWORD && verifyLink) {
      subject = "P9 System: Password Reset Request";
      html = resetPasswordTemplate(verifyLink);
    }

    const { data, error } = await resend.emails.send({
      from: `P9 System <onboarding@resend.dev>`, 
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
}