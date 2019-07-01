const nodemailer = require('nodemailer');

const createEmailHtml = text => `
  <div
    className="email"
    style="
      border: 1px solid black;
      padding: 20px;
      font-family: sans-serif;
      line-height: 2;
      font-size: 20px;
    "
  >
    ${text}
  </div>
`;

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});


module.exports = {
  createEmailHtml,
  transport,
};