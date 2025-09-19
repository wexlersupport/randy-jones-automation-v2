export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

export function toBase64(file: any) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file) // returns "data:<mime>;base64,xxxx"
      reader.onload = () => {
          const result: any = reader.result
          // Remove the "data:...;base64," prefix
          const base64String = result.split(',')[1]
          resolve(base64String)
      }
      reader.onerror = (error) => reject(error)
  })
}

export function convertDate(date: any) {
    const todayLocal = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, // Set hours to 0 (midnight local)
        0, // Set minutes to 0
        0  // Set seconds to 0
    );

    // Helper to add leading zero for single-digit numbers
    const pad = (num: any) => String(num).padStart(2, '0');

    const year = todayLocal.getFullYear();
    const month = pad(todayLocal.getMonth() + 1); // getMonth() is 0-indexed
    const day = pad(todayLocal.getDate());
    const hours = pad(todayLocal.getHours());   // Will be '00'
    const minutes = pad(todayLocal.getMinutes()); // Will be '00'
    const seconds = pad(todayLocal.getSeconds()); // Will be '00'

    // Construct the string
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    return formattedDate;
}

export function convertDateFormat(dateString: any) {
  const date = new Date(dateString);
  
  const options: any = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}

export function convertTimeFormat(dateString: any) {
  const date = new Date(dateString);
  
  const options: any = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hours12: true // Use 12-hour format
  };
  
  return date.toLocaleTimeString('en-US', options);
}

export function convertDateTimeFormat(details: any) {
  return convertDateFormat(details.date) + ' ' + convertTimeFormat(details.time);
}

export function formatJsDateToDatetime(date: any) {
  // Get components of the date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // e.g., "2025-07-09 10:00:00" (depending on current time)
}

export async function handleApiResponse(responsePromise: any) {
    try {
        const response = await responsePromise;
        // console.log('handleApiResponse response', response)
        if (response) {
            // const data = await response.json();
            return response
        } else {
            // const errorData = await response.json();
            throw createError({
                statusCode: 500,
                statusMessage: `Error!`
            })
        }
    } catch (err) {
        console.error('API call error:', err);
    }
};

export function convertCurrencyToNumber(currencyString:any): number {
  // Check if the input is a string to avoid errors
  if (typeof currencyString !== 'string') {
    console.error("Input is not a string.");
    return NaN; // Return NaN (Not a Number) for invalid input
  }

  // Use a regular expression to remove the dollar sign ($) and commas (,)
  const cleanedString = currencyString.replace(/[\$,]/g, '');

  // Convert the cleaned string to a floating-point number
  const numberValue = parseFloat(cleanedString);

  return numberValue;
}

export function filterStringsByIndex(arrayIndex: any, arrayString: any) {
  // Use the map() method to create a new array.
  // It iterates over each element (which is an index) in arrayIndex.
  const filteredStrings = arrayIndex.map((index: any) => {
    // Return the string from arrayString at the current index.
    return arrayString[index];
  });
  return filteredStrings.filter((item: any) => item !== undefined);
}

export function getRandomDayFromNext7(_numberOfDays = 7, _startDate = new Date()): string {
  const today = _startDate;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // start from tomorrow

  // Random offset 0–6 (days)
  const randomOffset = Math.floor(Math.random() * _numberOfDays);
  const randomDate = new Date(tomorrow);
  randomDate.setDate(tomorrow.getDate() + randomOffset);

  // Random time between 9:00 AM and 4:30 PM
  const randomHour = Math.floor(Math.random() * 8) + 9; // 9–16 (4 PM)
  const randomMinute = Math.random() < 0.5 ? 0 : 30;    // 00 or 30
  randomDate.setHours(randomHour, randomMinute, 0, 0);

  // Add English ordinal suffix (st, nd, rd, th)
  function addOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  const month = randomDate.toLocaleString('en-US', { month: 'long' });
  const day = randomDate.getDate();

  // Format time in 12-hour format with AM/PM
  // const time = randomDate.toLocaleString('en-US', {
  //   hour: 'numeric',
  //   minute: '2-digit',
  //   hour12: true
  // });

  return `${month} ${addOrdinal(day)}`;
}

export function convertToMMDD(dateString: any) {
  // 1️⃣ Remove the "st", "nd", "rd", "th"
  const cleaned = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');

  // 2️⃣ Parse into a Date object
  const date = new Date(cleaned + " 2025"); // Add a year to make it valid

  // 3️⃣ Format to MM/DD
  const formatted = String(date.getMonth() + 1).padStart(2, '0') + '/' + 
                    String(date.getDate()).padStart(2, '0');

  return formatted;
}

export function convertDateStamp(dateString: any, timeString: any): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "Asia/Manila"
    const localDate = new Date(`${dateString}T${timeString}`);

    // Convert the local time to UTC correctly
    const utc = new Date(
        localDate.toLocaleString("en-US", { timeZone }) // ensure we interpret as your system timeZone
    );

    return utc.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // e.g. "20250920T050000Z"
}


export function convertHtmlEmail(body: any): string {
  // Enhanced HTML processing for better email client compatibility and minimal white space
  let cleanedBody = body
    // Remove QuillEditor specific classes and attributes
    .replace(/class="[^"]*"/g, '')
    .replace(/data-[^=]*="[^"]*"/g, '')
    .replace(/contenteditable="[^"]*"/g, '')
    .replace(/spellcheck="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '') // Remove inline styles to apply our own
    
    // Advanced white space normalization
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')   // Normalize line endings
    .replace(/\n\s*\n/g, '\n') // Remove multiple consecutive newlines
    .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs
    
    // Handle empty paragraphs with minimal spacing - use simple divs
    .replace(/<p><br\s*\/?><\/p>/g, '<div style="height: 6px; line-height: 6px; font-size: 1px;">&nbsp;</div>')
    .replace(/<p><\/p>/g, '<div style="height: 4px; line-height: 4px; font-size: 1px;">&nbsp;</div>')
    .replace(/<p>\s*<\/p>/g, '<div style="height: 4px; line-height: 4px; font-size: 1px;">&nbsp;</div>')
    
    // Convert paragraphs to table-based layout with minimal spacing
    .replace(/<p>/g, '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 6px 0; border-collapse: collapse;"><tr><td style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; padding: 0; mso-line-height-rule: exactly;">')
    .replace(/<\/p>/g, '</td></tr></table>')
    
    // Handle lists with minimal spacing and Outlook compatibility
    .replace(/<ul>/g, '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 4px 0; border-collapse: collapse;"><tr><td style="padding: 0;"><ul style="margin: 0; padding: 0 0 0 20px; font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; mso-line-height-rule: exactly;">')
    .replace(/<\/ul>/g, '</ul></td></tr></table>')
    .replace(/<ol>/g, '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 4px 0; border-collapse: collapse;"><tr><td style="padding: 0;"><ol style="margin: 0; padding: 0 0 0 20px; font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; mso-line-height-rule: exactly;">')
    .replace(/<\/ol>/g, '</ol></td></tr></table>')
    
    // Improve list items with minimal spacing
    .replace(/<li>/g, '<li style="margin: 0 0 2px 0; line-height: 1.4; mso-line-height-rule: exactly;">')
    
    // Handle line breaks with minimal spacing - use simple approach to avoid extra spacing
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '<div style="height: 8px; line-height: 8px; font-size: 1px;">&nbsp;</div>')
    .replace(/<br\s*\/?>/g, '<div style="height: 4px; line-height: 4px; font-size: 1px;">&nbsp;</div>')
    
    // Enhanced text formatting with better email client support
    .replace(/<strong>/g, '<strong style="font-weight: 600; color: #333333; mso-bidi-font-weight: bold;">')
    .replace(/<b>/g, '<strong style="font-weight: 600; color: #333333; mso-bidi-font-weight: bold;">')
    .replace(/<\/b>/g, '</strong>')
    .replace(/<em>/g, '<em style="font-style: italic; color: #333333; mso-bidi-font-style: italic;">')
    .replace(/<i>/g, '<em style="font-style: italic; color: #333333; mso-bidi-font-style: italic;">')
    .replace(/<\/i>/g, '</em>')
    
    // Improve links with better accessibility and styling
    .replace(/<a\s+href="([^"]*)"[^>]*>/g, '<a href="$1" style="color: #007bff; text-decoration: underline; font-weight: 500; mso-line-height-rule: exactly;" target="_blank">')
    
    // Handle headings with minimal spacing
    .replace(/<h([1-6])>/g, '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 6px 0 4px 0; border-collapse: collapse;"><tr><td style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, Arial, sans-serif; font-weight: 600; color: #333333; mso-line-height-rule: exactly; font-size: $1" data-heading="$1">')
    .replace(/<\/h[1-6]>/g, '</td></tr></table>')
    
    // Apply heading sizes with tighter line heights
    .replace(/font-size: 1" data-heading="1"/g, 'font-size: 28px; line-height: 1.2"')
    .replace(/font-size: 2" data-heading="2"/g, 'font-size: 24px; line-height: 1.2"')
    .replace(/font-size: 3" data-heading="3"/g, 'font-size: 20px; line-height: 1.3"')
    .replace(/font-size: 4" data-heading="4"/g, 'font-size: 18px; line-height: 1.3"')
    .replace(/font-size: 5" data-heading="5"/g, 'font-size: 16px; line-height: 1.4"')
    .replace(/font-size: 6" data-heading="6"/g, 'font-size: 14px; line-height: 1.4"')
    
    // Enhanced whitespace cleanup to eliminate all unnecessary spacing
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .replace(/>\s+</g, '><') // Remove all spaces between HTML tags
    .replace(/\s*<div[^>]*style="height:\s*[^"]*"[^>]*>\s*&nbsp;\s*<\/div>\s*<div[^>]*style="height:\s*[^"]*"[^>]*>\s*&nbsp;\s*<\/div>\s*/g, '<div style="height: 6px; line-height: 6px; font-size: 1px;">&nbsp;</div>') // Merge consecutive spacing divs
    .replace(/\s*<table[^>]*style="margin:\s*0[^"]*"[^>]*>\s*<tr>\s*<td[^>]*>\s*&nbsp;\s*<\/td>\s*<\/tr>\s*<\/table>\s*/g, '') // Remove empty spacing tables that might cause double spacing
    .replace(/(<\/table>)\s*(<table)/g, '$1$2') // Remove spaces between consecutive tables
    .replace(/(<\/div>)\s*(<div)/g, '$1$2') // Remove spaces between consecutive divs
    .replace(/(<\/table>)\s*(<div)/g, '$1$2') // Remove spaces between table and div
    .replace(/(<\/div>)\s*(<table)/g, '$1$2') // Remove spaces between div and table
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
    .trim();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="format-detection" content="telephone=no">
          <title>Email</title>
          <!--[if mso]>
          <noscript>
              <xml>
                  <o:OfficeDocumentSettings>
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                  </o:OfficeDocumentSettings>
              </xml>
          </noscript>
          <![endif]-->
          <style type="text/css">
              /* Email CSS Reset */
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
              
              /* Outlook specific fixes */
              .ReadMsgBody { width: 100%; }
              .ExternalClass { width: 100%; }
              .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
                  line-height: 100%;
              }
              
              /* Base styles */
              body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #f8f9fa !important;
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif !important;
                  font-size: 16px !important;
                  line-height: 1.5 !important;
                  color: #333333 !important;
                  width: 100% !important;
                  height: 100% !important;
              }
              
              /* Container table */
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
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif !important;
                  font-size: 16px !important;
                  line-height: 1.5 !important;
                  color: #333333 !important;
              }
              
              /* Typography improvements */
              .email-content table {
                  width: 100% !important;
              }
              
              .email-content td {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif !important;
                  font-size: 16px !important;
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
              
              /* Responsive */
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
                      font-size: 14px !important;
                  }
              }
              
              /* Dark mode support */
              @media (prefers-color-scheme: dark) {
                  .email-wrapper {
                      background-color: #1a1a1a !important;
                  }
                  .email-container {
                      background-color: #2d2d2d !important;
                  }
                  .email-content td {
                      color: #ffffff !important;
                  }
                  .email-content strong {
                      color: #ffffff !important;
                  }
                  .email-content em {
                      color: #ffffff !important;
                  }
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #333333; width: 100%; height: 100%;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-wrapper" style="width: 100%; background-color: #f8f9fa; padding: 20px 0;">
              <tr>
                  <td align="center" style="padding: 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                          <tr>
                              <td class="email-content" style="padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #333333;">
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