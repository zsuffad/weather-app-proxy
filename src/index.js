export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only allow your domain (optional)
    const origin = request.headers.get('Origin');
    if (origin !== 'https://zsuffad.github.io') {
      return new Response('Forbidden', { status: 403 });
    }

    // Proxy different APIs based on path
    if (url.pathname.startsWith('/api/weather')) {
      return await proxyWeatherAPI(request, env);
    }

    return new Response('Not found', { status: 404 });
  }
};

async function proxyWeatherAPI(request, env) {
  const apiKey = env.WEATHER_API_KEY; // Secret stored in Cloudflare
  const response = await fetch(`https://api.weather.com/v1/current?key=${apiKey}&`);

  // Add CORS headers
  const newResponse = new Response(response.body, {
    status: response.status,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': 'https://yourusername.github.io',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  });

  return newResponse;
}