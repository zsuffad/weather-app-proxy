export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only allow your domain (optional)
    const origin = request.headers.get('Origin');
    if (!origin) {
      return new Response('No Origin header: ' + JSON.stringify([...request.headers]), { status: 403 });
    }
    if (origin !== 'https://zsuffad.github.io' &&
        origin !== 'http://127.0.0.1:10001') {
      return new Response('Forbidden', { status: 403 });
    }

    // https://api.open-meteo.com/v1/forecast
    if (url.pathname.startsWith('/v1/forecast')) {
      return await proxyOpenMeteoAPI(request, env);
    }

    // https://tile.openweathermap.org/map/${this.CURRENT_WEATHER_LAYER}/{z}/{x}/{y}.png?appid=${this.openweathermap_API_KEY}&opacity=${this.layerOpacity}&date=${this.timestamp}
    if (url.pathname.startsWith('/map/')) {
      return await proxyOpenWeatherMapAPI(request, env);
    }

    return new Response(`Not found ${url.pathname}`, { status: 404 });
  }
};

const allowedOrigins = [
  'https://zsuffad.github.io',
  'http://127.0.0.1:10001'
];

async function proxyOpenMeteoAPI(request, env) {
  // const apiKey = env.OPEN_METEO_API_KEY; // Secret stored in Cloudflare

  // Parse the incoming request URL
  const incomingUrl = new URL(request.url);

  // Build a new URL with the correct hostname and path
  const url = new URL(incomingUrl.pathname + incomingUrl.search, 'https://api.open-meteo.com');
  // url.searchParams.set('appid', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return new Response(`Error fetching data from Open Meteo API. URL: ${url.toString()}. ${response.statusText}`, { status: response.status });
  }

  // Add CORS headers
  const origin = request.headers.get('Origin');
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  const newResponse = new Response(response.body, {
    status: response.status,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  });

  return newResponse;
}

// https://tile.openweathermap.org/map/clouds_new/z/x/y.png?opacity=0.9&date=1753279256
async function proxyOpenWeatherMapAPI(request, env) {
  const apiKey = env.WEATHER_API_KEY; // Secret stored in Cloudflare

  // Parse the incoming request URL
  const incomingUrl = new URL(request.url);

  // Append the request URL with the API key
  const url = new URL(incomingUrl.pathname + incomingUrl.search, 'https://tile.openweathermap.org');
  url.searchParams.set('appid', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    return new Response(`Error fetching data from OpenWeatherMap API. URL: ${url.toString()}. ${response.statusText}`, { status: response.status });
  }

  // Add CORS headers
  const origin = request.headers.get('Origin');
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  const newResponse = new Response(response.body, {
    status: response.status,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  });

  return newResponse;
}