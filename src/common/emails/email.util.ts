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

    console.log("📧 ENV CHECK");
    console.log("MAIL_HOST:", process.env.MAIL_HOST);
    console.log("MAIL_PORT:", process.env.MAIL_PORT);
    console.log("MAIL_USER exists:", process.env.MAIL_USER);
    console.log("MAIL_PASS exists:", process.env.MAIL_PASS);

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587,
      secure: false, // 587 ke liye false (STARTTLS use hota hai)
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },

      // Railway fixes
      family: 4,
      requireTLS: true,
      tls: {
        rejectUnauthorized: false,
      },
      logger: true,
      debug: true,
    });

    console.log("📧 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP CONNECTION SUCCESSFUL");

    let message = "This is a system notification.";

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

    console.log("📧 Sending email...");

    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to,
      subject,
      html,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 SMTP Response:", info.response);

    return {
      status: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("❌ EMAIL ERROR OCCURRED");
    console.error("Error message:", error?.message);
    console.error("Full error:", error);

    return {
      status: false,
      error: error?.message,
    };
  }
}
