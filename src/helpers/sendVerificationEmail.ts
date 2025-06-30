import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Create HTML email template
function createVerificationEmailHTML(firstName: string, otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="padding: 30px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #333; margin: 0 0 20px 0;">Hello, ${firstName}! 👋</h1>
          <p style="font-size: 16px; color: #555; margin-top: 20px; line-height: 1.5;">
            Thank you for signing up. Please verify your email address to get started.
          </p>
          
          <div style="background-color: #f0f0f0; border-radius: 6px; padding: 20px; margin: 30px 0; display: inline-block;">
            <p style="font-size: 22px; font-weight: bold; letter-spacing: 2px; color: #1a1a1a; margin: 0;">
              ${otp}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #888; line-height: 1.5;">
            Enter this One-Time Password (OTP) in the app or website to complete your verification.
          </p>
          
          <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;" />
          
          <p style="font-size: 12px; color: #aaa; margin: 0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
) {
  try {
    // Create HTML email content
    const emailHtml = createVerificationEmailHTML(username, verifyCode);

    const mailOptions = {
      from: `Mystery <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Mystery message verification code",
      html: emailHtml,
      text: `Hello ${username}, your verification code is: ${verifyCode}. Enter this code to complete your verification.`,
    };

    const info = await transporter.sendMail(mailOptions);

    if (!info.messageId) {
      console.error("Email not sent:", info);
      return {
        success: false,
        message: "Failed to send verification email.",
      };
    }

    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      message: "Verification email sent successfully.",
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: "An error occurred while sending the email.",
    };
  }
}
