import { neon } from '@netlify/neon';
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default async (req) => {
    //   const { next_run } = await req.json();
    //   console.log('Scheduled invocation — next_run:', next_run);
    const client_response = await sql(`SELECT * FROM client_response WHERE is_script_sent = FALSE AND is_sent_reminder = TRUE`);
    console.log(`client_response is ${client_response.length}`);

    for (const data of client_response) {
        // Send reminder
        const scheduledTime = new Date(data.next_meeting_date);
        console.log(`Scheduled Meeting date: ${data.next_meeting_date}`);
        const { startPreviousSunday, endPreviousSunday } = await getPreviousSunday(scheduledTime);
        console.log(`Sunday Reminders: ${startPreviousSunday}`);
        const now = new Date(); // current local date & time
        const target = new Date(startPreviousSunday); // interpreted as local
        // const target = new Date('2025-10-30T12:01'); // 2025-10-30T12:01
        console.log(`Target date & time: ${target.toISOString()}`);

        if (now < target) {
          console.log("Not yet sending...", data.id);
        } else if (now >= target) {
          const emailResponse = await sendEmail(data.person_name, data.person_email);
          console.log("Sending now...", data.person_email, emailResponse);
          const updateResponse = await updateClientResponse(data.id)
          console.log("Update response...", updateResponse[0]?.person_name);
        }
    }

    return
}

// | UTC Time  | Eastern Time (EST, UTC-5) | Philippine Time (UTC+8) |
// | --------- | ------------------------- | ----------------------- |
// | 20:00 UTC | 3:00 PM EST (Sundays)     | 4:00 AM PHT (Monday)    |
// | 20:30 UTC | 3:30 PM EST (Sundays)     | 4:30 AM PHT (Monday)    |
// | 21:00 UTC | 4:00 PM EST (Sundays)     | 5:00 AM PHT (Monday)    |
// | 21:30 UTC | 4:30 PM EST (Sundays)     | 5:30 AM PHT (Monday)    |
export const config = {
    // schedule: '*/1 * * * *'
    // schedule: '0,30 20-21 * * 0' // (20-21 UTC on Sundays) (3PM-4PM EST on Sundays) (4AM-5AM PHT on Mondays)
    schedule: '0,30 20-21 * * 1' // (20-21 UTC on Mondays) (3PM-4PM EST on Mondays) (4AM-5AM PHT on Tuesdays)
};

async function getPreviousSunday(formattedNextMeeting) {
    const pad = (n) => String(n).padStart(2, '0');
    
    const meetingDate = new Date(formattedNextMeeting);
    // console.log('meetingDate:', meetingDate) //Mon Sep 22 2025 00:00:00 GMT+0800 (Philippine Standard Time)
    const dayOfWeek = meetingDate.getDay();     // 0=Sun, 1=Mon, ...
    const previousSunday = new Date(meetingDate);
    previousSunday.setDate(meetingDate.getDate() - dayOfWeek);
    // Set the desired time (15:00:00)
    // previousSunday.setHours(15, 0, 0, 0);
    const startPreviousSunday = previousSunday.getFullYear() + '-' +
        pad(previousSunday.getMonth() + 1) + '-' +
        pad(previousSunday.getDate()) + 'T15:00'

    const endPreviousSunday = previousSunday.getFullYear() + '-' +
        pad(previousSunday.getMonth() + 1) + '-' +
        pad(previousSunday.getDate()) + 'T16:00'

    return { startPreviousSunday, endPreviousSunday }
}

// Record a reminder
async function updateClientResponse(id) {
  const result = await sql(
    `UPDATE client_response SET is_script_sent = $2 WHERE id = $1 RETURNING *`,
    [id, true]
  )

  return result
}

async function sendEmail(name = "", to = "") {
    const accessToken = await microsoftAuth();
    // console.log('Access Token:', accessToken);

    const newSchedule = {
        message: {
            subject: 'Meeting Reminder',
            body: {
                contentType: "HTML",
                content: `
                    <div style="font-family: Arial, Helvetica, sans-serif; font-size:14px; color:#111;">
                        <p>Hi ${name},</p>

                        <div style="margin: 20px 0;">
                            <p>I look forward to the meeting. Please confirm.</p>
                        </div>

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
        const result = graphRes.status === 202 ? { message: "Email scheduled successfully", to } : await graphRes.json();

        return { success: true, response: result }
    } catch (err) {
        console.error(err);

        return { success: false, error: err }
    }
}

async function microsoftAuth() {
    const onedriveTenantId = process.env.NUXT_PUBLIC_ONEDRIVE_TENANT_ID
    const onedriveAccountId = process.env.NUXT_PUBLIC_ONEDRIVE_ACCOUNT_ID
    const onedriveClientSecret = process.env.NUXT_PUBLIC_ONEDRIVE_CLIENT_SECRET

    try {
        // 1️⃣ Get Access Token
        const tokenRes = await fetch(
            `https://login.microsoftonline.com/${onedriveTenantId}/oauth2/v2.0/token`,
            {
                method: 'POST',
                body: new URLSearchParams({
                        client_id: onedriveAccountId,
                        client_secret: onedriveClientSecret,
                        scope: 'https://graph.microsoft.com/.default',
                        grant_type: 'client_credentials'
                    }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )
        const res = await tokenRes.json()
        const accessToken = res.access_token

        return accessToken
    } catch (error) {
        console.error(error)
        throw new Error(error.message || 'Failed to get access token')
    }
}
// netlify functions:invoke send-scheduled-emails
