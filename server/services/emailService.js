import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: '"HumanHub" <noreply@humanhub.com>',
      to,
      subject,
      html
    });

    console.log(`[Email] Message sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email Error]', error);
    return false;
  }
};
