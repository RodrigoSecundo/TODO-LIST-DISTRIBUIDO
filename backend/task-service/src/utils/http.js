export async function safeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`Request failed for ${url}:`, error.message);
    return null;
  }
}