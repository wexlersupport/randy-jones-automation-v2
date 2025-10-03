import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken();
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const eventId = parseBody?.eventId
    const attendeesEmails =  parseBody?.attendees // Array of emails

    try {
        const graphRes = await fetch(`https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/events/${eventId}?sendUpdates=all`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    attendees: attendeesEmails.map((email: string) => ({
                        emailAddress: { address: email },
                        type: "required"
                    })),
                })
            }
        )

        const result = await graphRes.json()

        return { success: true, response: result }
    } catch (err) {
        console.error(err);
        return { success: false, error: err }
    }
});
