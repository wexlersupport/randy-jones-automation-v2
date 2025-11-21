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
        // const now = new Date('2025-11-09T15:00'); // current local date & time
        console.log(`now date & time: ${now.toISOString()}`);
        const target = new Date(startPreviousSunday); // interpreted as local
        console.log(`Target date & time: ${target.toISOString()}`);

        if (now < target) {
          console.log("Not yet sending...", data.id);
        } else if (now >= target) {
            const reminders_data = await sql(`SELECT * FROM meeting_summary_temp WHERE type = 'invite_reminders' ORDER BY id DESC`);
            const recipientEmails = data?.person_email?.split(',')
            const recipientNames = data?.person_name?.split(',')
            console.log("Recipient...", recipientEmails, recipientNames);

            let emailResponses = await Promise.all(
                recipientEmails.map((email, index) =>
                    sendEmail(data, email?.trim(), recipientNames[index], reminders_data?.[0])
                )
            );
            // Log each response
            emailResponses.forEach((response, index) => {
                console.log("Sending now...", recipientEmails[index], response);
            });
            // Check if all were successful
            const allSuccessful = emailResponses.every(res => res?.success);
            if (allSuccessful) {
                console.log("Emails sent successfully to all recipients for client_response ID:", data.id);
                const updateResponse = await updateClientResponse(data.id);
                console.log("Update response...", updateResponse[0]?.person_name);
            } else {
                console.warn("Some emails failed to send:", emailResponses);
            }
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
    // schedule: '*/1 * * * *' // (every 1 minute)
    schedule: '0,30 20-21 * * 0' // (20-21 UTC on Sundays) (3PM-4PM EST on Sundays) (4AM-5AM PHT on Mondays)
    // schedule: '0,30 20-21 * * 1' // (20-21 UTC on Mondays) (3PM-4PM EST on Mondays) (4AM-5AM PHT on Tuesdays)
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

async function sendEmail(data, email, name, reminders_data) {
    const convertedDate = await convertDate(data?.next_meeting_date);
    // console.log('Converted Date:', convertedDate);
    const accessToken = await microsoftAuth();
    console.log('Access Token:', accessToken);
    const replacements = {
        name,
        meeting_date: convertedDate,
        zoom_link: data?.zoom_link,
    };
    let content = fillTemplate(reminders_data?.meeting_ai_summary, replacements);
    content = await plainTextToHtml(content);
    // console.log('Email Content:', content);

    const newSchedule = {
        message: {
            subject: reminders_data.model || 'Quick Reminder — Upcoming Meeting with Randy Jones',
            body: {
                contentType: "HTML",
                content
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: email
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
        const result = graphRes.status === 202 ? { message: "Email scheduled successfully", email } : await graphRes.json();
        // console.log('Graph API Response:', result);

        return { success: true, response: result }
    } catch (err) {
        console.error(err);

        return { success: false, error: err }
    }
}

function fillTemplate(tpl = "", map = {}, { forSubject = false } = {}) {
  if (!tpl) return "";
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    let val = map[key] ?? "";
    // subjects shouldn't have newlines; keep HTML in body as-is
    if (forSubject) val = String(val).replace(/\r?\n/g, " ").trim();
    return String(val);
  });
}

async function microsoftAuth() {
    const onedriveTenantId = process.env.NUXT_PUBLIC_ONEDRIVE_TENANT_ID
    const onedriveAccountId = process.env.NUXT_PUBLIC_ONEDRIVE_ACCOUNT_ID
    const onedriveClientSecret = process.env.NUXT_PUBLIC_ONEDRIVE_CLIENT_SECRET
    // console.log('Microsoft Auth Env:', { onedriveTenantId, onedriveAccountId, onedriveClientSecret });

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
        // console.log('Microsoft Auth Token Response Status:', tokenRes);
        const res = await tokenRes.json()
        // console.log('Microsoft Auth Response:', res);
        const accessToken = res.access_token
        // console.log('Access Token:', accessToken);
        return accessToken
    } catch (error) {
        console.error(error)
        throw new Error(error.message || 'Failed to get access token')
    }
}

async function convertDate(dateInput) {
    // Step 1: Create a Date object
    const date = new Date(dateInput);

    // Step 2: Define formatter for EST (America/New_York)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "Asia/Manila"
    const options = {
        timeZone,
        day: '2-digit',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };

    // Step 3: Format components
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    // Extract needed parts
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const dayPeriod = parts.find(p => p.type === 'dayPeriod').value.toUpperCase();

    // Step 4: Construct formatted string manually
    const formatted = `${day} ${month}, ${hour}:${minute} ${dayPeriod}`;

    // console.log(formatted);
    return formatted ?? date;
}

async function plainTextToHtml(text) {
  const cleanedBody = text
    .split(/\r?\n{2,}/)                     // split on 2+ line breaks (paragraphs)
    .map(block =>
      block
        .split(/\r?\n/)                     // split inside block on single line breaks
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join("<br>")                       // join single breaks as <br>
    )
    .filter(block => block.length > 0)      // drop empty blocks
    .map(block => `<p>${block}</p>`)        // wrap each block in <p>
    .join("\n");

    return htmlFormat(cleanedBody);
}

async function htmlFormat(cleanedBody) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="format-detection" content="telephone=no">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
            <title>Email</title>
            <style type="text/css">
                body, table, td, p, a, li, blockquote {
                    -webkit-text-size-adjust: 100% !important;
                    -ms-text-size-adjust: 100% !important;
                    -webkit-font-smoothing: antialiased !important;
                }
                table, td {
                    mso-table-lspace: 0pt !important;
                    mso-table-rspace: 0pt !important;
                }
                img {
                    -ms-interpolation-mode: bicubic !important;
                    border: 0 !important;
                    height: auto !important;
                    line-height: 100% !important;
                    outline: none !important;
                    text-decoration: none !important;
                }
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background-color: #f8f9fa !important;
                    font-family: Verdana, sans-serif !important;
                    font-size: 10px !important;
                    line-height: 1.5 !important;
                    color: #333333 !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                .email-wrapper {
                    width: 100% !important;
                    background-color: #f8f9fa !important;
                    padding: 20px 0 !important;
                }
                .email-container {
                    max-width: 600px !important;
                    margin: 0 auto !important;
                    background-color: #ffffff !important;
                    border-radius: 8px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                    overflow: hidden !important;
                }
                .email-content {
                    padding: 30px !important;
                    font-family: Verdana, sans-serif !important;
                    font-size: 10px !important;
                    line-height: 1.5 !important;
                    color: #333333 !important;
                }
                .email-content td {
                    font-family: Verdana, sans-serif !important;
                    font-size: 10px !important;
                    line-height: 1.5 !important;
                    color: #333333 !important;
                }
                .email-content strong {
                    font-weight: 600 !important;
                    color: #333333 !important;
                }
                .email-content em {
                    font-style: italic !important;
                    color: #333333 !important;
                }
                .email-content a {
                    color: #007bff !important;
                    text-decoration: underline !important;
                    font-weight: 500 !important;
                }
                .email-content ul, .email-content ol {
                    margin: 0 !important;
                    padding-left: 20px !important;
                }
                .email-content li {
                    margin: 8px 0 !important;
                    line-height: 1.5 !important;
                }
                @media only screen and (max-width: 600px) {
                    .email-container {
                        max-width: 100% !important;
                        margin: 0 10px !important;
                        border-radius: 0 !important;
                    }
                    .email-content {
                        padding: 20px !important;
                    }
                    .email-content td {
                        font-size: 9px !important;
                    }
                }
                // @media (prefers-color-scheme: dark) {
                //     .email-wrapper {
                //         background-color: #1a1a1a !important;
                //     }
                //     .email-container {
                //         background-color: #2d2d2d !important;
                //     }
                //     .email-content td {
                //         color: #ffffff !important;
                //     }
                //     .email-content strong {
                //         color: #ffffff !important;
                //     }
                //     .email-content em {
                //         color: #ffffff !important;
                //     }
                // }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Verdana, sans-serif; font-size: 10px; line-height: 1.5; color: #333333; width: 100%; height: 100%;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-wrapper" style="width: 100%; background-color: #f8f9fa; padding: 20px 0;">
                <tr>
                    <td align="center" style="padding: 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                            <tr>
                                <td class="email-content" style="padding: 30px; font-family: Verdana, sans-serif; font-size: 10px; line-height: 1.5; color: #333333;">
                                    ${cleanedBody}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
        </table>
    </body>
</html>`;
}
// netlify functions:invoke send-scheduled-emails
