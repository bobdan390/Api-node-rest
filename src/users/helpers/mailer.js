//Lib for send emails SENDGRID
require("dotenv").config();
const nodemailer = require("nodemailer");
async function sendEmail(email, code, subj = null, text = null) {
  try {
    const smtpEndpoint = "smtp.sendgrid.net";
    const port = 465;
    const senderAddress = process.env.SG_SENDER;
    var toAddress = email;
    const smtpUsername = process.env.SG_USERNAME;
    const smtpPassword = process.env.SG_APIKEY;
    var subject = subj ? subj : "Verify your email";
    // The body of the email for recipients
    var body_html = `<!DOCTYPE> 
    <html>
      <body>
        <p> ${text ? text : 'Your authentication code is'} : </p> <b>${code}</b>
      </body>
    </html>`;
    // Create the SMTP transport.
    let transporter = nodemailer.createTransport({
      host: smtpEndpoint,
      port: port,
      secure: true, // true for 465, false for other ports
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });
    // Specify the fields in the email.
    let mailOptions = {
      from: senderAddress,
      to: toAddress,
      subject: subject,
      html: body_html,
    };
    let info = await transporter.sendMail(mailOptions);
    return { error: false };
  } catch (error) {
    console.error("send-email-error", error);
    return {
      error: true,
      message: "Cannot send email",
    };
  }
}
module.exports = { sendEmail };