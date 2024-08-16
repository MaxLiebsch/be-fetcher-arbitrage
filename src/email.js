import { createTransport } from "nodemailer";
import "dotenv/config";
import { LoggerService } from "@dipmaxtech/clr-pkg"

import { config } from "dotenv";

config({
  path: [`.env`],
});

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async (mail) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER, // sender address
      to: [process.env.MAIL_RECIPIENT_1, process.env.MAIL_RECIPIENT_2], // list of receivers
      ...mail,
    });
  } catch (error) {
    LoggerService.getSingleton().logger.info(`SendMail: ${error}`)
  }
};
