import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let transporter;

// Email template function
const getEmailTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Email Verification - RailLo Event Hub</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0; }
    .logo { font-size: 1.5rem; font-weight: bold; }
    .content { background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .otp-container { text-align: center; margin: 2rem 0; }
    .otp { font-size: 2.5rem; font-weight: bold; letter-spacing: 0.5rem; background: #f8fafc; color: #3b82f6; padding: 1rem; border-radius: 8px; font-family: monospace; }
    .footer { text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 0.9rem; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🚂 RailLo Event Hub</div>
    <h1>Welcome!</h1>
  </div>
  <div class="content">
    <h2>Verify Your Email</h2>
    <p>Your verification code is:</p>
    <div class="otp-container">
      <div class="otp">${otp}</div>
    </div>
    <p>This code will expire in <strong>5 minutes</strong>. Enter it in the app to verify your email.</p>
    <p>If you didn't request this, ignore this email.</p>
    <a href="#" class="button">Open RailLo App</a>
  </div>
  <div class="footer">
    <p>© 2024 RailLo Event Hub. All rights reserved.</p>
  </div>
</body>
</html>
`;

app.post('/send-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    // Init transporter if not done
    if (!transporter) {
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      
      // Test connection
      await transporter.verify();
      console.log('Email server ready');
    }

    // Send email
    await transporter.sendMail({
      from: `"RailLo Event Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your RailLo Email Verification Code',
      html: getEmailTemplate(otp),
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.listen(PORT, () => {
  console.log(`Email server running on http://localhost:${PORT}`);
});

