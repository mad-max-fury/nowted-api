const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");
const sgMail = require("@sendgrid/mail");
const AppError = require("../errors/appError");
require("dotenv").config();
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.firstName || user.userName;
    this.url = url;
    this.from = `Nowted <${process.env.EMAIL_FROM}>`;
    this.transporter = this.newTransport();
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Set SendGrid API key
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // Return SendGrid transport instance
      return sgMail;
    } else {
      console.log("Sending SendGrid");
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_HOST_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  async send(template, subject) {
    // Render HTML based on Pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // Send the email

    process.env.NODE_ENV === "production"
      ? await this.transporter.send(mailOptions)
      : await this.transporter.sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Nowted App");
  }
  async sendResetPasswordInstructions() {
    await this.send("passwordReset", "Reset your password");
  }
};
