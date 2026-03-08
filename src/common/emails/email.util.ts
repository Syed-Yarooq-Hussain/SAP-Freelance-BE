import * as nodemailer from "nodemailer";
import {
  generalTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "./email.template";
import { EmailType } from "constant/enums";

export async function sendEmail(
  to: string,
  type: EmailType,
  receiverName: string,
  senderName: string,
  verifyLink?: string
) {
  try {
    console.log("--------------------------------------------------");
    console.log("📧 EMAIL SERVICE STARTED");
    console.log("📧 To:", to);
    console.log("📧 Type:", type);
    console.log("📧 Receiver:", receiverName);
    console.log("📧 Sender:", senderName);
    console.log("📧 VerifyLink:", verifyLink || "N/A");

    console.log("📧 ENV CHECK");
    console.log("MAIL_HOST:", process.env.MAIL_HOST);
    console.log("MAIL_PORT:", process.env.MAIL_PORT);
    console.log("MAIL_USER exists:", !!process.env.MAIL_USER);
    console.log("MAIL_PASS exists:", !!process.env.MAIL_PASS);

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
      default:
        message = "This is a system notification.";
    }

    console.log("📧 Message Selected:", message);

    console.log("📧 Creating SMTP transporter...");

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: Number(process.env.MAIL_PORT) === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      logger: true,
      debug: true,
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log("📧 Verifying SMTP connection...");

    await transporter.verify();
    console.log("✅ SMTP CONNECTION SUCCESSFUL");

    let subject = `Notification: ${type}`;
    let html = generalTemplate(receiverName, message, senderName);

    if (type === EmailType.SIGNUP_VERIFICATION && verifyLink) {
      console.log("📧 Using VERIFY EMAIL template");
      subject = "P9 System: Verify your Email";
      html = verifyEmailTemplate(receiverName, verifyLink);
    }

    if (type === EmailType.RESET_PASSWORD && verifyLink) {
      console.log("📧 Using RESET PASSWORD template");
      subject = "P9 System: Password Reset Request";
      html = resetPasswordTemplate(verifyLink);
    }

    console.log("📧 Sending email now...");

    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to,
      subject,
      html,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);
    console.log("--------------------------------------------------");

    return {
      status: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("❌ EMAIL ERROR OCCURRED");
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("Full error:", error);

    return {
      status: false,
      error: error?.message,
    };
  }
}
