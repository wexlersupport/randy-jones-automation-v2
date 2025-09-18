import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    let subject = parseBody?.subject
    let start_date_time = parseBody?.start_date_time
    let end_date_time = parseBody?.end_date_time

  const newEvent = {
    subject,
    start: {
      dateTime: start_date_time,
      timeZone
    },
    end: {
      dateTime: end_date_time,
      timeZone
    },
    isReminderOn: true,
    reminderMinutesBeforeStart: 60
  };

  try {
    const graphRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/events`,
        {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
        }
    )

    const result = await graphRes.json()

    return { success: true, response: result }
  } catch (err) {
    console.error(err);
    return { success: false, error: err }
  }
});
