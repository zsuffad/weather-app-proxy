export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only allow your domain (optional)
    const origin = request.headers.get('Origin');
    if (origin !== 'https://zsuffad.github.io') {
      return new Response('Forbidden', { status: 403 });
    }

    // https://api.open-meteo.com
    // https://api.open-meteo.com/v1/forecast
    if (url.hostname.startsWith('https://api.open-meteo.com')) {
      return await proxyOpenMeteoAPI(request, env);
    }

    // https://tile.openweathermap.org
    // https://tile.openweathermap.org/map/${this.CURRENT_WEATHER_LAYER}/{z}/{x}/{y}.png?appid=${this.openweathermap_API_KEY}&opacity=${this.layerOpacity}&date=${this.timestamp}
    if (url.hostname.startsWith('https://tile.openweathermap.org')) {
      return await proxyOpenWeatherMapAPI(request, env);
    }

    return new Response('Not found', { status: 404 });
  }
};

async function proxyOpenMeteoAPI(request, env) {
  const apiKey = env.OPEN_METEO_API_KEY; // Secret stored in Cloudflare
  // Append the request URL with the API key
  const url = new URL(request.url);
  url.searchParams.set('appid', apiKey);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return new Response('Error fetching data from Open Meteo API', { status: response.status });
  }

  // Add CORS headers
  const newResponse = new Response(response.body, {
    status: response.status,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': 'https://zsuffad.github.io',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  });

  return newResponse;
}

// https://tile.openweathermap.org/map/clouds_new/z/x/y.png?opacity=0.9&date=1753279256
async function proxyOpenWeatherMapAPI(request, env) {
  const apiKey = env.WEATHER_API_KEY; // Secret stored in Cloudflare
  // Append the request URL with the API key
  const url = new URL(request.url);
  url.searchParams.set('appid', apiKey);
  const response = await fetch(url.toString());
  if (!response.ok) {
    return new Response('Error fetching data from OpenWeatherMap API', { status: response.status });
  }

  // Add CORS headers
  const newResponse = new Response(response.body, {
    status: response.status,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': 'https://zsuffad.github.io',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  });

  return newResponse;
}