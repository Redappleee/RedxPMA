import nodemailer from "nodemailer";

import { serverEnv } from "@/server/config/env";

const hasSmtpConfig = Boolean(
  serverEnv.SMTP_HOST &&
    serverEnv.SMTP_PORT &&
    serverEnv.SMTP_USER &&
    serverEnv.SMTP_PASS &&
    serverEnv.SMTP_FROM
);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: serverEnv.SMTP_HOST,
      port: serverEnv.SMTP_PORT,
      secure: serverEnv.SMTP_SECURE,
      auth: {
        user: serverEnv.SMTP_USER,
        pass: serverEnv.SMTP_PASS
      }
    })
  : null;

export const isMailerConfigured = () => Boolean(transporter);

export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl
}: {
  to: string;
  name: string;
  resetUrl: string;
}) => {
  if (!transporter || !serverEnv.SMTP_FROM) {
    throw new Error("SMTP mailer is not configured");
  }

  await transporter.sendMail({
    from: serverEnv.SMTP_FROM,
    to,
    subject: "Reset your Nexus Labs password",
    text: `Hi ${name},\n\nReset your password using this link: ${resetUrl}\n\nThis link expires in 30 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Reset your password</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to reset your Nexus Labs password. This link expires in 30 minutes.</p>
        <p style="margin: 24px 0;">
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #2563eb; color: #ffffff; text-decoration: none;"
          >
            Reset password
          </a>
        </p>
        <p>If the button does not work, copy and paste this URL into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      </div>
    `
  });
};
