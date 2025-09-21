import sgMail from '@sendgrid/mail'
import fs from 'fs';
import { convertHtmlEmail } from '~/utils'

const config = useRuntimeConfig()
const sendgridApiKey = config.public.sendgridApiKey
sgMail.setApiKey(sendgridApiKey)

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    try {
        const { from, to, subject, html, filename, attachments } = parseBody.emailObj
        const sendContent: any = { from, to, subject, html }
        if (sendContent.html) {
            sendContent.html = convertHtmlEmail(html)
        }

        // const attachments = [
        //     {
        //         content,
        //         filename,
        //         type: "text/html",
        //         disposition: "attachment"
        //     }
        // ]
        sendContent.attachments = attachments

        const data = sgMail
            // .send({...sendContent, template_id: 'd-9ea9297503204eab95b081340ee70691'})
            .send(sendContent)
            .then((res: any) => {
                console.log('Email sent')
                return res
            })
            .catch((error: any) => {
                console.error(error)
                return error
            })

        return data;
    } catch (error) {
        return error;
    }
});