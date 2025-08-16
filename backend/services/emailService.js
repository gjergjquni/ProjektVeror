const nodemailer = require('nodemailer');
const config = require('../utils/config');

class mailService {
    constructor() {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASSWORD;

        if (!emailUser || !emailPass) {
            console.error('Email service credentials are not configured in .env file.');
            throw new Error('Email service is not configured.');
        }

        this.transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });
    }

    // --- THIS IS YOUR EXISTING FUNCTION (NO CHANGES NEEDED) ---
    async sendVerificationCode(email, code) {
        const mailOptions = {
            from: `Elioti <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Elioti - Kodi i Verifikimit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #2c3e50; text-align: center;">Mirë se vini në Elioti!</h2>
                    <p>Kodi juaj i verifikimit është:</p>
                    <div style="background-color: #ecf0f1; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #e74c3c; font-size: 32px; letter-spacing: 2px; margin: 0;">${code}</h1>
                    </div>
                    <p>Ky kod është i vlefshëm për 10 minuta.</p>
                    <p style="color: #777; font-size: 0.9em;">Nëse nuk keni krijuar këtë llogari, ju lutem injoroni këtë email.</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Verification email sending failed:', error);
            return false;
        }
    }

    // --- THIS IS THE NEW FUNCTION YOU NEED TO ADD ---
    async sendPasswordResetLink(email, token) {
        // IMPORTANT: In production, change 'localhost:3000' to your actual frontend domain name.
        // For now, this points to your React development server.
        const resetLink = `http://localhost:3000/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        const mailOptions = {
            from: `Elioti <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Elioti - Kërkesë për Ndryshim Fjalëkalimi',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #2c3e50; text-align: center;">Kërkesë për Ndryshim Fjalëkalimi</h2>
                    <p>Ju keni kërkuar të ndryshoni fjalëkalimin tuaj. Klikoni butonin më poshtë për të vazhduar.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #e74c3c; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Ndrysho Fjalëkalimin
                        </a>
                    </div>
                    <p>Ky link është i vlefshëm për 1 orë.</p>
                    <p style="color: #777; font-size: 0.9em;">Nëse nuk e keni bërë ju këtë kërkesë, ju lutem injoroni këtë email.</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error)
        {
            console.error('Password reset email sending failed:', error);
            return false;
        }
    }
}

module.exports = new EmailService();