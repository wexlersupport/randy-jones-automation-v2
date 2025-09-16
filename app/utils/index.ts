export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
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

export function getRandomDayFromNext7() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // start from tomorrow

  // Random offset 0–6 (days)
  const randomOffset = Math.floor(Math.random() * 7);
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
  const time = randomDate.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${month} ${addOrdinal(day)} at ${time}`;
}


export function convertHtmlEmail(body: any) {
  // Clean up QuillEditor specific classes and normalize content
  const cleanedBody = body
    .replace(/class="[^"]*"/g, '') // Remove all class attributes
    .replace(/<p><br><\/p>/g, '') // Remove empty paragraphs completely
    .replace(/<p><\/p>/g, '') // Remove empty paragraphs
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '<br>') // Remove duplicate line breaks
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/<p>/g, '<div style="margin: 0 0 12px 0; line-height: 1.5;">') // Convert p tags with proper spacing
    .replace(/<\/p>/g, '</div>')
    .replace(/<br\s*\/?>/g, '<br style="display: block; margin: 6px 0;">') // Consistent line breaks
    .trim(); // Remove leading/trailing whitespace

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Email</title>
    <style>
        /* Email CSS Reset */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }
        
        /* Content container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        
        /* Typography */
        .email-content {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        
        .email-content div {
            margin: 0 0 12px 0;
            line-height: 1.5;
        }
        
        .email-content div:last-child {
            margin-bottom: 0;
        }
        
        .email-content br {
            display: block;
            margin: 6px 0;
            line-height: 1;
        }
        
        .email-content strong {
            font-weight: 600;
        }
        
        .email-content em {
            font-style: italic;
        }
        
        .email-content ul, .email-content ol {
            margin: 16px 0;
            padding-left: 20px;
        }
        
        .email-content li {
            margin: 8px 0;
        }
        
        .email-content a {
            color: #007bff;
            text-decoration: underline;
        }
        
        .email-content a:hover {
            color: #0056b3;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                padding: 15px;
            }
            .email-content {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            ${cleanedBody}
        </div>
    </div>
</body>
</html>`;
}