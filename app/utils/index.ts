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

export function convertHtmlEmail(body: any) {
  return `<html>
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              </head>
              <body>
                <div>
                  ${body}
                </div>
              </body>
            </html>`;
}