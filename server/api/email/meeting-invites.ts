import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const { from, to, subject, dt_start, dt_end } = parseBody.emailObj

    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Your Company//Your App//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@example.com`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dt_start}`,
        `DTEND:${dt_end}`,
        `SUMMARY:${subject}`,
        'DESCRIPTION:Meeting Invites.',
        'LOCATION:Zoom Meeting',
        `ORGANIZER;CN=Francis Regala:mailto:francis@viacry.com`,
        `ATTENDEE;CN=Francis ViaCry;RSVP=TRUE:mailto:francis@viacry.com`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'TRANSP:OPAQUE',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n')

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: from,
            pass: 'jgtz swiq bxai dttu', // Gmail App Password
        },
    })

    const data = await transporter.sendMail({
        from,
        to,
        subject,
        text: 'You are invited to a meeting.',
        html: await htmlTemplate(),
        alternatives: [
            {
                contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
                content: icsContent
            }
        ]
    })

    return data
})


async function htmlTemplate() {
    return `
        <!DOCTYPE html>
        <html lang="en" style="margin:0;padding:0;">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Meeting Invitation</title>
        </head>
        <body style="margin:0;padding:0;background:#f5f5f5;font-family:Roboto,Arial,sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:20px 0;">
            <tr>
                <td align="center">
                <table width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
                    <!-- Header -->
                    <tr>
                    <td style="background:#4285f4;color:#ffffff;padding:20px;text-align:center;font-size:20px;font-weight:bold;">
                        Meeting Invitation
                    </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                    <td style="padding:30px;">
                        <p style="font-size:16px;margin:0 0 20px;">
                            You’re invited to a meeting.
                            Please respond to calendar invite.
                        </p>


                        <p style="font-size:13px;color:#888;margin-top:25px;">
                            Please check your calendar application for the meeting details and to RSVP.
                        </p>
                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td style="background:#f1f3f4;padding:15px;text-align:center;font-size:12px;color:#666;">
                        © All rights reserved.
                    </td>
                    </tr>
                </table>
                </td>
            </tr>
            </table>
        </body>
        </html>
    `
}