const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config()
async function sendVerificationEmail(email, otp) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        auth: {
          user: process.env.GOOGLE_ACCOUNT,
          pass: process.env.GOOGLE_APP_PASSWORD,
        },
      });
  
      transporter.sendMail({
        from: process.env.GOOGLE_ACCOUNT,
        to: email,
        subject: "Your OTP for Verification",
        text: `Your OTP is ${otp}`,
        html: ` <!DOCTYPE html>
                      <html lang="en">
                      <head>
                          <meta charset="UTF-8" />
                          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                          <title>OTP Verification</title>
                      </head>
                      <body style="margin:0; padding:0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #2eec71 0%, #8db39b 100%);">
                          <table align="center" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:40px auto; ; box-shadow:0 6px 20px rgba(0,0,0,0.1); overflow:hidden;">
                          <tr>
                              <td style="padding:30px; text-align:center;">
                              <h1 style="margin:0; font-size:24px; color:#474744;">OTP Verification</h1>
                              <p style="margin:20px 0; font-size:16px; color:#474744;">
                                  Use the OTP below to complete your verification process:
                              </p>
                              <div style="background: white; color: #474744; font-size:28px; letter-spacing:4px; font-weight:bold; padding:15px 30px; border-radius:12px; display:inline-block; margin:20px 0;">
                                  ${otp}
                              </div>
                              <p style="margin:20px 0; font-size:14px; color:#474744;">
                                  This OTP will expire in <strong>3 minutes</strong>. Do not share it with anyone.
                              </p>
                              <hr style="border:none; border-top:1px solid #e0e0e0; margin:30px 0;" />
                              <p style="font-size:12px; color:#888888;">
                                  If you did not request this, please ignore this email or contact our support team.
                              </p>
                              </p>
                              </td>
                          </tr>
                          </table>
                      </body>
                      </html>
                      `,
      });
    } catch (error) {
      console.error(error);
    }
  }

  module.exports = {
    sendVerificationEmail
}