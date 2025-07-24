const nodemailer = require('nodemailer');
const config = require('./config');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'your-app-password'
            }
        });
    }

    async sendVerificationCode(email, code) {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@elioti.com',
            to: email,
            subject: 'Elioti - Kodi i Verifikimit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Mirë se vini në Elioti!</h2>
                    <p>Kodi juaj i verifikimit është:</p>
                    <div style="background-color: #ecf0f1; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #e74c3c; font-size: 32px; margin: 0;">${code}</h1>
                    </div>
                    <p>Ky kod është i vlefshëm për 10 minuta.</p>
                    <p>Nëse nuk keni krijuar këtë llogari, ju lutem injoroni këtë email.</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }
}

module.exports = EmailService; 