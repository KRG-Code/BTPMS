const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create a transporter using the credentials from .env
let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });
} catch (error) {
  console.error("Error creating mail transporter:", error);
}

// Read the logo file and encode it for embedding in emails
let logoBase64;
try {
  const logoPath = path.join(__dirname, '../public/icon.png');
  const logoFile = fs.readFileSync(logoPath);
  logoBase64 = logoFile.toString('base64');
  console.log("Successfully loaded email logo");
} catch (error) {
  console.error('Error loading logo for emails:', error);
}

// Function to send verification code email
const sendVerificationCode = async (email, code, firstName) => {
  try {
    // Always log the code in development environment for testing
    if (process.env.NODE_ENV === 'Development') {
      console.log(`
      =====================================================
      VERIFICATION CODE for ${firstName || email}: ${code}
      =====================================================
      `);
    }

    // Skip actual email sending if transporter is not configured properly
    if (!transporter) {
      console.warn("Email transporter not configured - skipping email send");
      // Still return true since we logged the code in development
      return process.env.NODE_ENV === 'Development';
    }

    // Use a reliable external image that works in Gmail
    const fallbackLogoUrl = 'https://i.imgur.com/0aWBgfX.png';
    
    // Create email with embedded image using nodemailer cid
    const emailContent = {
      from: `"BTPMS Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "BTPMS Login Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f9fc; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logoImage" alt="BTPMS Logo" style="width: 80px; height: auto;">
            <h1 style="color: #1e40af; margin-top: 10px; font-size: 24px;">Barangay San Agustin Tanod Patrol Management System</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h2 style="color: #333; margin-top: 0;">Login Verification Required</h2>
            <p>Hello${firstName ? ` ${firstName}` : ''},</p>
            <p>Your login verification code for BTPMS is:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; background-color: #f0f4ff; border-radius: 6px; display: inline-block; color: #1e40af;">
                ${code}
              </div>
            </div>
            
            <p>This code will expire in 10 minutes for security reasons.</p>
            <p>If you didn't attempt to login, please contact your administrator immediately.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Barangay San Agustin Tanod Patrol Management System. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'icon.png',
          content: logoBase64 ? Buffer.from(logoBase64, 'base64') : undefined,
          cid: 'logoImage',
          path: logoBase64 ? undefined : path.join(__dirname, '../public/icon.png')
        }
      ]
    };

    // Send email
    const info = await transporter.sendMail(emailContent);

    console.log(`Verification email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    // Return true in development mode since we've logged the code to console
    return process.env.NODE_ENV === 'Development';
  }
};

// Add this new function to send password reset emails
const sendPasswordResetEmail = async (email, resetLink, firstName) => {
  try {
    // Always log the reset link in development environment for testing
    if (process.env.NODE_ENV === 'Development') {
      console.log(`
      =====================================================
      PASSWORD RESET LINK for ${firstName || email}:
      ${resetLink}
      =====================================================
      `);
    }

    // Skip actual email sending if transporter is not configured properly
    if (!transporter) {
      console.warn("Email transporter not configured - skipping email send");
      // Still return true since we logged the link in development
      return process.env.NODE_ENV === 'Development';
    }

    // Create email with embedded image using nodemailer cid
    const emailContent = {
      from: `"BTPMS Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "BTPMS Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f9fc; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logoImage" alt="BTPMS Logo" style="width: 80px; height: auto;">
            <h1 style="color: #1e40af; margin-top: 10px; font-size: 24px;">Barangay San Agustin Tanod Patrol Management System</h1>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p>Hello${firstName ? ` ${firstName}` : ''},</p>
            <p>We received a request to reset your password for your BTPMS account. To reset your password, click on the button below:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetLink}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email or contact your administrator immediately.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} Barangay San Agustin Tanod Patrol Management System. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'icon.png',
          content: logoBase64 ? Buffer.from(logoBase64, 'base64') : undefined,
          cid: 'logoImage',
          path: logoBase64 ? undefined : path.join(__dirname, '../public/icon.png')
        }
      ]
    };

    // Send email
    const info = await transporter.sendMail(emailContent);

    console.log(`Password reset email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    // Return true in development mode since we've logged the link to console
    return process.env.NODE_ENV === 'Development';
  }
};

module.exports = {
  sendVerificationCode,
  sendPasswordResetEmail
};
