'use strict';
const nodemailer = require('nodemailer');

/**
 * Gmail SMTP transporter using app password from .env
 * EMAIL_USER = stsmail2025@gmail.com
 * EMAIL_PASS = Gmail App Password (16-char)
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Sends a 6-digit OTP email for password reset.
 */
const sendOtpEmail = async (toEmail, name, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Billu Bazaar" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your Billu Bazaar password reset OTP`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Password Reset OTP</title>
      </head>
      <body style="margin:0;padding:0;background:#FDFDFB;font-family:Georgia,serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFDFB;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #F0EEE8;border-radius:4px;overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="background:#1A1A1A;padding:24px 40px;">
                    <p style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.08em;">
                      BILLU <span style="color:#C9A24B;">BAZAAR</span>
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#1A1A1A;">
                      Password Reset OTP
                    </h1>
                    <p style="margin:0 0 12px;font-size:14px;color:#6B6B6B;line-height:1.6;">
                      Hi <strong style="color:#1A1A1A;">${name}</strong>,
                    </p>
                    <p style="margin:0 0 28px;font-size:14px;color:#6B6B6B;line-height:1.6;">
                      We received a request to reset your Billu Bazaar account password. Use the OTP below to proceed. This code expires in <strong style="color:#1A1A1A;">10 minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <div style="background:#F8F6F0;border:2px dashed #C9A24B;border-radius:8px;padding:24px 40px;display:inline-block;">
                            <p style="margin:0 0 6px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;font-family:Arial,sans-serif;">Your OTP</p>
                            <p style="margin:0;font-family:Arial,sans-serif;font-size:40px;font-weight:bold;color:#1A1A1A;letter-spacing:0.3em;">${otp}</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 12px;font-size:14px;color:#6B6B6B;line-height:1.6;">
                      Enter this OTP on the password reset screen. Do <strong>not</strong> share it with anyone.
                    </p>
                    <p style="margin:0 0 0;font-size:13px;color:#999;line-height:1.6;">
                      If you didn't request a password reset, you can safely ignore this email — your account is secure.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#F8F6F0;padding:20px 40px;border-top:1px solid #F0EEE8;">
                    <p style="margin:0;font-size:11px;color:#999;text-align:center;">
                      © ${new Date().getFullYear()} Billu Bazaar. All rights reserved.<br/>
                      This is an automated email — please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Reset OTP email sent to ${toEmail} — MessageID: ${info.messageId}`);
  return info;
};

/**
 * Sends a 6-digit OTP email for Order Security Verification (high value / COD fraud check).
 */
const sendFraudOtpEmail = async (toEmail, name, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Billu Bazaar Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your Billu Bazaar Order Verification Code`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Order Security Verification</title>
      </head>
      <body style="margin:0;padding:0;background:#FDFDFB;font-family:Georgia,serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFDFB;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #F0EEE8;border-radius:4px;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#1A1A1A;padding:24px 40px;">
                    <p style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.08em;">
                      BILLU <span style="color:#C9A24B;">BAZAAR</span>
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#1A1A1A;">
                      🔒 Order Security Verification
                    </h1>
                    <p style="margin:0 0 12px;font-size:14px;color:#6B6B6B;line-height:1.6;">
                      Hi <strong style="color:#1A1A1A;">${name || 'Valued Customer'}</strong>,
                    </p>
                    <p style="margin:0 0 28px;font-size:14px;color:#6B6B6B;line-height:1.6;">
                      For your protection, high-value orders and Cash on Delivery purchases require a quick verification code. Use the 6-digit OTP below on your checkout screen to authorize and complete your order. This code expires in <strong style="color:#1A1A1A;">10 minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <div style="background:#F8F6F0;border:2px dashed #C9A24B;border-radius:8px;padding:24px 40px;display:inline-block;">
                            <p style="margin:0 0 6px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;font-family:Arial,sans-serif;">Verification OTP</p>
                            <p style="margin:0;font-family:Arial,sans-serif;font-size:40px;font-weight:bold;color:#1A1A1A;letter-spacing:0.3em;">${otp}</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 12px;font-size:14px;color:#6B6B6B;line-height:1.6;">
                      Enter this code on your checkout screen. If you did not initiate this order, please contact our support team immediately.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#F8F6F0;padding:20px 40px;border-top:1px solid #F0EEE8;">
                    <p style="margin:0;font-size:11px;color:#999;text-align:center;">
                      © ${new Date().getFullYear()} Billu Bazaar Security Concierge. All rights reserved.<br/>
                      This is an automated security email — please do not reply.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Order verification OTP email sent to ${toEmail} — MessageID: ${info.messageId}`);
  return info;
};

module.exports = { sendOtpEmail, sendFraudOtpEmail };
