import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    // const { from, to, subject, dt_start, dt_end, next_meeting_date, name, sunday_date } = parseBody.emailObj
    // let subject = parseBody?.subject
    // let start_date_time = parseBody?.start_date_time
    // let end_date_time = parseBody?.end_date_time
    const { to, subject, name, sunday_date } = parseBody.emailObj
    console.log('send_meeting_reminder sunday_date:', sunday_date)// 2025-09-22

  const newSchedule = {
    message: {
        subject,
        body: {
            contentType: "HTML",
            content: `
                <div style="font-family: Arial, Helvetica, sans-serif; font-size:14px; color:#111;">
                    <p>Hi ${name},</p>
                    <br>

                    <p>I look forward to the meeting. Please confirm.</p>
                    <br>

                    <p style="margin:0;">
                        <strong>Randy Jones</strong><br>
                        <em>The Legacy Builder</em><br>
                        Office: <a href="tel:571-375-8031">571-375-8031</a><br>
                        Cell: <a href="tel:703-919-6258">703-919-6258</a>
                    </p>
                </div>
            `
        },
        toRecipients: [
            {
                emailAddress: {
                    address: to
                }
            }
        ]
    },
    // deferUntilDateTime: `${sunday_date}T15:00:00Z`
    deferredSendTime: `${sunday_date}T15:00:00Z`
  };


  try {
    const graphRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/sendMail`,
        {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSchedule)
        }
    )
    // console.log('graphRes:', graphRes)

    const result = graphRes.status === 202 ? { message: "Email scheduled successfully" } : await graphRes.json();

    return { success: true, response: result }
  } catch (err) {
    console.error(err);
    return { success: false, error: err }
  }
});
