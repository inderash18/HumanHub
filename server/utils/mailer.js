import nodemailer from 'nodemailer';

// Create Nodemailer Transporter using environment variables or a development console transporter
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // Development Fallback: Logs OTP cleanly in console
  return {
    sendMail: async (options) => {
      console.log('====================================================');
      console.log('📧 [DEV EMAIL DISPATCH]');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body:\n${options.text || options.html}`);
      console.log('====================================================');
      return { messageId: 'dev-' + Date.now() };
    }
  };
};

const transporter = createTransporter();

export const sendOTPEmail = async (email, otp, type = 'register') => {
  const isRegister = type === 'register';
  const subject = isRegister 
    ? 'Your HumanHub Verification Code' 
    : 'HumanHub Password Reset Code';

  const text = isRegister
    ? `Welcome to HumanHub! Your 6-digit verification code is: ${otp}\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`
    : `You requested a password reset for your HumanHub account. Your 6-digit verification code is: ${otp}\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #0B1120; color: #FFFFFF; padding: 32px; border-radius: 16px; border: 1px solid #1E293B;">
      <h2 style="color: #F06E5C; margin-bottom: 8px; font-weight: 800;">Human<span style="color: #2EC4D6;">Hub</span></h2>
      <p style="color: #94A3B8; font-size: 14px; margin-bottom: 24px;">${isRegister ? 'Complete your registration to enter the community.' : 'Reset your account password.'}</p>
      
      <div style="background: #111C2E; border: 1px solid #17263D; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2EC4D6; font-family: monospace;">${otp}</span>
      </div>
      
      <p style="color: #64748B; font-size: 12px; line-height: 1.6;">
        This code expires in 10 minutes. For your security, never share this code with anyone.
      </p>
    </div>
  `;

  return await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"HumanHub" <no-reply@humanhub.social>',
    to: email,
    subject,
    text,
    html
  });
};

export default transporter;
