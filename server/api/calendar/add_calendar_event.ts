import { getOnedriveAccessToken } from './auth';

interface CalendarEventBody {
    subject: string;
    start_date_time: string;
    end_date_time: string;
}

interface GraphResponse {
    success?: boolean;
    error?: any;
    [key: string]: any;
}

export default defineEventHandler(async (event): Promise<{ success: boolean; response?: any; error?: any }> => {
    const accessToken: string = await getOnedriveAccessToken();
    const timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const body: string = await readBody(event)
    const parseBody: CalendarEventBody = JSON.parse(body)
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
    const graphRes: Response = await fetch(
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

    const result: GraphResponse = await graphRes.json()

    return { success: true, response: result }
  } catch (err) {
    console.error(err);
    return { success: false, error: err }
  }
});
