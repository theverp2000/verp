import nodemailer, {Transporter} from "nodemailer";
import tls from "tls";

type ms = number;

const ctx = {
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'kaitlyn.jakubowski65@ethereal.email',
    pass: 'kfxE17YHCd5dCDXara'
  },
  tls: {
    secureContext: tls.createSecureContext()
  }
}

const transporter: Transporter = nodemailer.createTransport(ctx);

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  try {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
      to: "toanthuan@gmail.com, toanthuan@yahoo.com", // list of receivers
      subject: "Hello 2 ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
  } catch(e) {
    console.error(e);
  }
}

main();
