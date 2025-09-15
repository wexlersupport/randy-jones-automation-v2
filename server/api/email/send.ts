import nodemailer from 'nodemailer'
import { convertHtmlEmail } from '~/utils'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    try {
        const { from, to, subject, html, filename, content } = parseBody.emailObj
        const sendContent: any = { from, to, subject, html }
        if (sendContent.html) {
            sendContent.html = convertHtmlEmail(html)
        }

        // const attachments = [
        //     {
        //         content,
        //         filename,
        //         type: "text/html",
        //         encoding: "base64",
        //         disposition: "attachment"
        //     }
        // ]
        // sendContent.attachments = attachments

        const transporter = nodemailer.createTransport({
            service: "gmail", // you can also use "Outlook365", "Yahoo", or custom SMTP
            auth: {
                user: from, // your email
                pass: 'mizh igci lyma mtpx', // app password (not your real password!)
            },
        });

        const data = await transporter.sendMail(sendContent);

        return data;
    } catch (error) {
        return error;
    }
});