import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${process.env.APP_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Verify your Local Find email",
    html: `<p>Click to verify your email:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${process.env.APP_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Reset your Local Find password",
    html: `<p>Click to reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>`,
  });
}

export async function sendAdminInviteEmail(to: string, token: string) {
  const link = `${process.env.APP_URL}/accept-invite?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "You've been invited to Local Find Admin",
    html: `<p>You've been invited as an admin on Local Find.</p><p><a href="${link}">${link}</a></p><p>This link expires in 3 days.</p>`,
  });
}