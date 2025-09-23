import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('timeZone:', timeZone); // e.g. "America/Los_Angeles"

    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    let subject = parseBody?.subject
    let start_date_time = parseBody?.start_date_time // e.g. "2025-09-20T15:00:00"
    let end_date_time = parseBody?.end_date_time // e.g. "2025-09-20T16:00:00"
    let attendeesEmails =  parseBody?.attendees // Array of emails
    let zoomLink = parseBody?.zoom_link || 'https://us02web.zoom.us/j/82361712152?pwd=7xFwWhvWAWZzw9taHdat1ImLa1BO6j.1#success'

    const newEvent = {
        subject,
        body: {
            contentType: 'HTML',
            content: `
                <p>Join Zoom Meeting:
                    <a href="${zoomLink}" target="_blank" rel="noopener noreferrer">
                        ${zoomLink}
                    </a>
                </p>
            `
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
        attendees: attendeesEmails.map((email: string) => ({
            emailAddress: { address: email },
            type: "required"
        })),
        isReminderOn: true,
        reminderMinutesBeforeStart: 60,
        allowNewTimeProposals: true,
        // isOnlineMeeting: true,
        // onlineMeetingProvider: 'teamsForBusiness',
        categories: ["Blue category"]
    };

    try {
        const graphRes = await fetch(
            `https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/calendar/events?sendInvitations=true`,
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
