import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendApplicationEmail(to: string, subject: string, text: string, attachments: any[]) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            attachments,
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Email Sending Error:", error);
        return { success: false, error };
    }
}
