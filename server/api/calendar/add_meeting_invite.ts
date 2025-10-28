import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // console.log('timeZone:', timeZone); // e.g. "America/Los_Angeles"

    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    let subject = parseBody?.subject
    let start_date_time = parseBody?.start_date_time // e.g. "2025-09-20T15:00:00"
    let end_date_time = '2025-11-11T15:41:00'
    // let end_date_time = parseBody?.end_date_time // e.g. "2025-09-20T16:00:00"
    let zoomLink = parseBody?.zoom_link || ''
    let content = parseBody?.content || ''
    // let attendeesEmails =  parseBody?.attendees // Array of emails
    // let attachments = parseBody?.attachments || []

    const newEvent = {
        subject,
        body: {
            contentType: 'HTML',
            content
        },
        start: {
            dateTime: start_date_time,
            timeZone
        },
        end: {
            dateTime: end_date_time,
            timeZone
        },
        location: {
            displayName: `Zoom Meeting Link: ${zoomLink}`
        },
        isReminderOn: true,
        reminderMinutesBeforeStart: 60,
        allowNewTimeProposals: true,
        categories: ["Blue category"],
        // isOnlineMeeting: true,
        // onlineMeetingProvider: 'teamsForBusiness',
        // attendees: attendeesEmails.map((email: string) => ({
        //     emailAddress: { address: email },
        //     type: "required"
        // })),
        // attachments
    };

    try {
        const graphRes = await fetch(
            `https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/calendar/events`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newEvent)
            }
        );

        const result = await graphRes.json();
        return { success: true, response: result };
    } catch (err) {
        console.error(err);
        return { success: false, error: err };
    }
});
