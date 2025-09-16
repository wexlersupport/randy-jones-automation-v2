
export default defineEventHandler(async (event) => {
  const { url } = await readBody(event);

  const res = await fetch(url);
  if (!res.ok) {
    throw createError({ statusCode: 400, statusMessage: 'Failed to fetch PDF' });
  }

  const buffer = await res.arrayBuffer();

  // Return raw PDF bytes with proper headers
  event.node.res.setHeader("Content-Type", "application/pdf");
  return Buffer.from(buffer);
});
