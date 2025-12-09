
export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const ids = url.searchParams.get('ids');

    if (!type || !ids) {
        return new Response(JSON.stringify({ error: 'Missing type or ids parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const allowedTypes = ['metar', 'taf', 'station'];
    if (!allowedTypes.includes(type)) {
        return new Response(JSON.stringify({ error: 'Invalid type parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const targetUrl = `https://aviationweather.gov/api/data/${type}?ids=${ids}&format=json`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AeroWeather/1.0)',
            },
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ error: `Upstream error: ${response.status}` }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const data = await response.text();

        return new Response(data, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
