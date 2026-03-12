import * as nodemailer from 'nodemailer';
import * as config from 'config';

export async function sendWelcomeEmail(to: string, username: string, password: string, user?: any) {
  const mailConfig = config.get('mail');
  const transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    requireTLS: mailConfig.require_tls,
    auth: {
      user: mailConfig.smtp_email,
      pass: mailConfig.smtp_password,
    },
  });

  const fullName = user?.lastName && user?.firstName ? `${user.lastName} ${user.firstName}` : '';
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MLFAfrica</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 32px; }
        h2 { color: #2d3748; }
        .credentials { font-size: 1.1em; color: #3182ce; background: #f0f4f8; padding: 12px 24px; border-radius: 6px; margin: 16px 0; }
        p { color: #4a5568; }
        .footer { font-size: 0.9em; color: #a0aec0; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome${fullName ? `, ${fullName}` : ''}!</h2>
        <p>Your account has been created. Here are your login credentials:</p>
        <div class="credentials">
          <strong>Username:</strong> ${username}<br>
          <strong>Password:</strong> ${password}
        </div>
        <p>Please keep this information safe. You can now log in to your account.</p>
        <div class="footer">&copy; ${new Date().getFullYear()} MLFAfrica</div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: mailConfig.from || 'noreply@example.com',
    to,
    subject: 'Your Account Credentials',
    html,
  });
}

export async function sendPasswordResetEmail(to: string, token: string, user?: any) {
  const mailConfig = config.get('mail');
  // console.log('mailConfig',mailConfig)
  const transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    requireTLS: mailConfig.require_tls,
    auth: {
      user: mailConfig.smtp_email,
      pass: mailConfig.smtp_password,
    },
  });

  // console.log('transporter',transporter)

  const frontendUrl = config.has('frontendUrl') ? config.get('frontendUrl') : 'http://localhost:3000';
  const fullName = user.lastName && user.firstName ? `${user.lastName} ${user.firstName}` : '';
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Code</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 32px; }
        h2 { color: #2d3748; }
        .code { font-size: 2em; letter-spacing: 0.2em; color: #3182ce; background: #f0f4f8; padding: 12px 24px; border-radius: 6px; display: inline-block; margin: 16px 0; }
        p { color: #4a5568; }
        .footer { font-size: 0.9em; color: #a0aec0; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Dear${fullName ? ` ${fullName}` : ''},</p>
        <p>You requested to reset your password. Please use the code below to complete the process:</p>
        <div class="code">${token}</div>
        <p>This code will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
        <div class="footer">&copy; ${new Date().getFullYear()} MLFAfrica</div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: mailConfig.from || 'noreply@example.com',
    to,
    subject: 'Your Password Reset Code',
    html,
  });
}
