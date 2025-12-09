import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "p9@vertex9systems.com",
        pass: "wqtdiicxqntygkwz",
      },
    });
  }

  async sendEmail(to: string, type: string) {
    try {
      const subject = `Notification: ${type}`;
      const message = `This is a dynamic email of type: ${type}`;

      const info = await this.transporter.sendMail({
        from: `"My App" <your_email@gmail.com>`,
        to,
        subject,
        text: message,
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
}
