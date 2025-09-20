import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const eventId = parseBody?.eventId

    const updatedEvent = {
        "categories": []
    };

    try {
        const graphRes = await fetch(
            `https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/events/${eventId}`,
            {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedEvent)
            }
        )

        const result = await graphRes.json()

        return { success: true, response: result }
    } catch (err) {
        console.error(err);
        return { success: false, error: err }
    }
});
