import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendResetEmail = async (email, token) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `Click the link below to reset your password:
            ${process.env.CLIENT_URL}/reset-password/${token}
            
            This link is valid for 15 minutes.`
        };

        await transporter.sendMail(mailOptions);
        console.log('Reset email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
