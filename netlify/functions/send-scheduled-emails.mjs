// import nodemailer from "nodemailer";
// import { neon } from '@netlify/neon';
// const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

// export default async (req) => {
//     //   const { next_run } = await req.json();
//     //   console.log('Scheduled invocation — next_run:', next_run);
//     const client_response = await sql(`SELECT * FROM client_response WHERE is_script_sent = FALSE AND is_sent_reminder = TRUE`);
//     console.log(`client_response is ${client_response.length}`);

//     for (const data of client_response) {
//         // Send reminder
//         const scheduledTime = new Date(data.next_meeting_date);
//         console.log(`Scheduled Meeting date: ${data.next_meeting_date}`);
//         const { startPreviousSunday, endPreviousSunday } = await getPreviousSunday(scheduledTime);
//         console.log(`Sunday Reminders: ${startPreviousSunday}`);
//         const now = new Date(); // current local date & time
//         const target = new Date(startPreviousSunday); // interpreted as local
//         console.log(`Target date & time: ${target.toISOString()}`);
//         // const target = new Date('2025-09-24T15:12'); // 2025-09-28T15:00

//         if (now < target) {
//           console.log("Not yet sending...");
//         } else if (now >= target) {
//           const emailResponse = await sendEmail(data.person_name, data.person_email);
//           console.log("Sending now...", data.person_email, emailResponse?.messageId);
//           const updateResponse = await updateClientResponse(data.id)
//           console.log("Update response...", updateResponse[0]?.person_name);
//         }
//     }

//     return
// }

// export const config = {
//     schedule: '*/1 * * * *'
//     // schedule: '0,30 19-21 * * 0' // 18-22 UTC on Sundays (1PM-5PM EST on Sundays)
// };

// async function getPreviousSunday(formattedNextMeeting) {
//     const pad = (n) => String(n).padStart(2, '0');
    
//     const meetingDate = new Date(formattedNextMeeting);
//     // console.log('meetingDate:', meetingDate) //Mon Sep 22 2025 00:00:00 GMT+0800 (Philippine Standard Time)
//     const dayOfWeek = meetingDate.getDay();     // 0=Sun, 1=Mon, ...
//     const previousSunday = new Date(meetingDate);
//     previousSunday.setDate(meetingDate.getDate() - dayOfWeek);
//     // Set the desired time (15:00:00)
//     // previousSunday.setHours(15, 0, 0, 0);
//     const startPreviousSunday = previousSunday.getFullYear() + '-' +
//         pad(previousSunday.getMonth() + 1) + '-' +
//         pad(previousSunday.getDate()) + 'T15:00'

//     const endPreviousSunday = previousSunday.getFullYear() + '-' +
//         pad(previousSunday.getMonth() + 1) + '-' +
//         pad(previousSunday.getDate()) + 'T16:00'

//     return { startPreviousSunday, endPreviousSunday }
// }

// // Record a reminder
// async function updateClientResponse(id) {
//   const result = await sql(
//     `UPDATE client_response SET is_script_sent = $2 WHERE id = $1 RETURNING *`,
//     [id, true]
//   )

//   return result
// }

// async function sendEmail(name = "", to = "") {
//     try {
//         const sendContent = {
//             from: 'francis@viacry.com',
//             to: to,
//             subject: 'Meeting Reminder',
//             html: `
//                 <div style="font-family: Arial, Helvetica, sans-serif; font-size:14px; color:#111;">
//                     <p>Hi ${name},</p>
//                     <p><br></p>

//                     <p>I look forward to the meeting. Please confirm.</p>
//                     <p><br></p>

//                     <p style="margin:0;">
//                         <strong>Randy Jones</strong><br>
//                         <em>The Legacy Builder</em><br>
//                         Office: <a href="tel:571-375-8031">571-375-8031</a><br>
//                         Cell: <a href="tel:703-919-6258">703-919-6258</a>
//                     </p>
//                 </div>
//             `,
//         }

//         const transporter = nodemailer.createTransport({
//             service: "gmail", // you can also use "Outlook365", "Yahoo", or custom SMTP
//             auth: {
//                 user: 'francis@viacry.com', // your email
//                 pass: 'jgtz swiq bxai dttu', // app password (not your real password!)
//             },
//         });

//         const data = await transporter.sendMail(sendContent);

//         return data;
//     } catch (error) {
//         return error;
//     }
// }
// // netlify functions:invoke send-scheduled-emails
