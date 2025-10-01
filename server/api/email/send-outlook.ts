import getOnedriveAccessToken from '../calendar/auth';
import { convertHtmlEmail } from '~/utils'

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken();
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const { from, to, subject, html, filename, attachments } = parseBody.emailObj
    // console.log('attachments:', attachments)

    const newSchedule = {
        message: {
            subject,
            body: {
                contentType: "HTML",
                content: convertHtmlEmail(html)
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: to
                    }
                }
            ],
            attachments
        },
        saveToSentItems: "true",
        // deferUntilDateTime: `${sunday_date}T15:00:00Z`
        // deferredSendTime: `${sunday_date}T15:00:00Z`
    };


  try {
    const graphRes = await fetch(`https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/sendMail`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSchedule)
        }
    )
    const result = graphRes.status === 202 ? { message: "Email sent successfully" } : await graphRes.json();

    return { success: true, response: result }
  } catch (err) {
    console.error(err);

    return { success: false, error: err }
  }
});
