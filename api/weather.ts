
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
            // Если station endpoint упал, не возвращаем 502, чтобы не засорять консоль
            // Возвращаем пустую ошибку или null, frontend это обработает
            if (type === 'station') {
                return new Response("null", {
                    status: 200, // Возвращаем 200 OK но с null телом, чтобы frontend просто считал что данных нет
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ error: `Upstream error: ${response.status}` }), {
                status: response.status === 404 ? 404 : 502, // Прокидываем 404 либо 502
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
