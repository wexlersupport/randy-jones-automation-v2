export const config = {
  // run every 1 minute (UTC). Change to your cron as needed.
  schedule: '*/1 * * * *'
    // schedule: '0,30 19-21 * * 0' // 18-22 UTC on Sundays (1PM-5PM EST on Sundays)
};

export default async (req) => {
  // scheduled functions receive a JSON payload with `next_run`
  const { next_run } = await req.json();
  console.log('Scheduled invocation — next_run:', next_run);

  return
}