import * as nodemailer from 'nodemailer';

export async function sendEmail(to: string, type: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to,
      subject: `Notification: ${type}`,
      text: `This is a notification of type: ${type}`,
    });

    return {
      status: true,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      status: false,
      error: error.message,
    };
  }
}
