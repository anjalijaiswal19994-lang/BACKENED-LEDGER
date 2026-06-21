console.log("email.service.js loaded");
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({ // to connect and communicate with google smtp(handles emails) sever
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});
module.exports = transporter;

// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        console.log("Sending email to:", to);
        const info = await transporter.sendMail({
            from: `"Backened Ledger" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        console.log("Message sent:", info.messageId);
        console.log(info);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
async function sendRegistrationEmail(userEmail, name) {
    console.log("sendRegistrationEmail called");
    const subject = "welcome to Backened Ledger:";
    const text = `Hello ${name},

Thank you for registering at Backened Ledger, we're excited to have you on board!

Best regards,
The Backened Ledger Team`;
    const html = `
<h2>Welcome ${name}!</h2>
<p>Thank you for registering at Backened Ledger.</p>
<p>We're excited to have you on board!</p>
`;
    console.log("html =", html);
    console.log("Reached before sendEmail");
    console.log("html value:", html);
    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, account, toAccount) {
    const subject = 'Transaction Successful:';
    const text = `Hello ${name}, \n\n Your transaction of ${amount} to account ${toAccount} was successful,\n\nBest regards,\nThe Backend Ledger`;
    const html = `<p>Hello ${name}, </p>Your transaction of ${amount} to account ${toAccount} was successful,</p><p> Best regards, <br> The Backend Ledger`;
    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, account, toAccount) {
    const subject = 'Transaction Successful:';
    const text = `Hello ${name}, \n\n Your transaction of ${amount} to account ${toAccount} was failed,\n\nBest regards,\nThe Backend Ledger`;
    const html = `<p>Hello ${name}, </p>Your transaction of ${amount} to account ${toAccount} was failed,</p><p> Best regards, <br> The Backend Ledger`;
    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};


