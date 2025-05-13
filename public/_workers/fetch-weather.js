const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

class HttpError extends Error {
  constructor(message, status, response = undefined) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.response = response;
  }
}

async function fetchWeatherFromOpenMeteo(latitude, longitude) {
    const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
    const params = `?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
    const url = `${API_BASE_URL}${params}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new HttpError(`Open-Meteo API request failed: ${response.statusText}. Details: ${errorText}`, response.status, response);
    }
    const data = await response.json();
    return data.current;
}

function handleOptions(request) {
  const headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    let respHeaders = {
      ...CORS_HEADERS,
      'Access-Control-Allow-Headers': headers.get('Access-Control-Request-Headers'),
      'Access-Control-Max-Age': '86400',
    };
    return new Response(null, { headers: respHeaders });
  } else {
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, OPTIONS',
      },
    });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const request = event.request;
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  const url = new URL(request.url);
  const latitude = url.searchParams.get('lat');
  const longitude = url.searchParams.get('lon');

  if (!latitude || !longitude) {
    return new Response(JSON.stringify({ error: 'lat and lon query parameters are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const cacheKey = request.url;
  const cache = caches.default;
  const CACHE_DURATION_SECONDS = 3 * 60 * 60;

  let response = await cache.match(cacheKey);

  if (response) {
    let newHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    newHeaders.set('Cache-Control', `public, max-age=${CACHE_DURATION_SECONDS}, s-maxage=${CACHE_DURATION_SECONDS}`);

    response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
    return response;
  }

  try {
    const weatherData = await fetchWeatherFromOpenMeteo(latitude, longitude);
    const jsonResponse = JSON.stringify(weatherData);
    response = new Response(jsonResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_DURATION_SECONDS}, s-maxage=${CACHE_DURATION_SECONDS}`,
        ...CORS_HEADERS
      }
    });
    event.waitUntil(cache.put(cacheKey, response.clone()));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = error instanceof HttpError ? error.status : (error.status || 500);

    console.error(`Worker error processing request for lat=${latitude}, lon=${longitude}: ${errorMessage}`, `Status: ${errorStatus}`);

    if (error instanceof HttpError && error.response && typeof error.response.text === 'function') {
        try {
            const errorBody = await error.response.text();
            if (errorBody) console.error("Worker: Underlying error response body (HttpError):", errorBody);
        } catch (e) {
            console.error("Worker: Failed to read error response body (HttpError):", e);
        }
    } else if (error.response && typeof error.response.text === 'function') {
        try {
            const errorBody = await error.response.text();
            if (errorBody) console.error("Worker: Underlying error response body (generic error):", errorBody);
        } catch (e) {
            console.error("Worker: Failed to read error response body (generic error):", e);
        }
    }

    response = new Response(JSON.stringify({ error: errorMessage || 'Failed to fetch weather data' }), {
      status: errorStatus,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  return response;
}
