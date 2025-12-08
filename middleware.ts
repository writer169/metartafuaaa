import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessKey = process.env.ACCESS_KEY;
  const clientKey = request.nextUrl.searchParams.get('key');

  if (!accessKey) {
    console.warn("ACCESS_KEY not set, authorization disabled");
    return NextResponse.next();
  }

  if (clientKey === accessKey) {
    const response = NextResponse.next();
    response.cookies.set('authorized', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24
    });
    return response;
  }

  const isAuthorized = request.cookies.get('authorized')?.value === 'true';
  
  if (isAuthorized) {
    return NextResponse.next();
  }

  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Доступ ограничен</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div class="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">Доступ ограничен</h2>
          <p class="text-slate-400 text-sm mb-6 leading-relaxed">
            Для доступа к приложению необходим ключ авторизации. Пожалуйста, используйте корректную ссылку.
          </p>
          <div class="bg-slate-950 rounded-lg p-3 text-xs font-mono text-slate-600 break-all border border-slate-900">
            ?key=YOUR_ACCESS_KEY
          </div>
        </div>
      </body>
    </html>`,
    {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  );
}

export const config = {
  matcher: '/',
};
