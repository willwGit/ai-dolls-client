import { NextRequest, NextResponse } from 'next/server';
import acceptLanguage from 'accept-language';
import { languages } from '@/locales/i18n';
import { COOKIE_NAME } from './locales/settings';
import { getAppConfigEnv } from './lib/utils';
acceptLanguage.languages(languages);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|logo.png|sw.js|ai-love-web|images/|icons/|tabbar/|communities-icons/|gifs/|restApi/|tonconnect-manifest).*)',
  ],
};

export function middleware(req: NextRequest) {
  let lng;
  const env = getAppConfigEnv(process.env.NEXT_ORIGIN);
  let _u = '';

  if (process.env.NEXT_ORIGIN === 'https://www.arabicloveai.com') {
    _u =
      '/chat' +
      (req.nextUrl.search ? req.nextUrl.search + '&styleId=1' : '?styleId=81');
  }

  // if (req.cookies.has(COOKIE_NAME))
  // lng = acceptLanguage.get(req.cookies.get(COOKIE_NAME)?.value);
  if (
    req.cookies.get(COOKIE_NAME)?.value &&
    languages.some((lang) => req.nextUrl.pathname.indexOf(lang) != -1)
  ) {
    lng = req.cookies.get(COOKIE_NAME)?.value;
  }

  if (
    !lng &&
    languages.some(
      (lang) => req.headers.get('Accept-Language')?.indexOf(lang) != -1
    )
  )
    lng = acceptLanguage.get(req.headers.get('Accept-Language'));
  console.log(
    '读取到了浏览器头部数据',
    req.headers.get('Accept-Language'),
    'lng 为',
    lng,
    '-u',
    _u
  );

  if (!lng) {
    lng = env.LNG;
    console.log('\x1b[36m%s\x1b[0m', `读取默认数据 ${env.LNG}`);
  }
  console.log(`\x1b[36m%s\x1b[0m`, `最终跳转到 ${lng}`);

  if (
    !languages.some((loc) => req.nextUrl.pathname.startsWith(`/${loc}`)) &&
    !req.nextUrl.pathname.startsWith('/_next')
  ) {
    console.log(
      '重定向到',
      `/${lng}${req.nextUrl.pathname}${_u || req.nextUrl.search}`,
      req.nextUrl.pathname
    );

    return NextResponse.redirect(
      new URL(
        `/${lng}${
          req.nextUrl.pathname === '/'
            ? _u || req.nextUrl.search
            : req.nextUrl.pathname + req.nextUrl.search
        }`,
        req.url
      )
    );
  }

  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer') || '');
    const lngInReferer = languages.find((l) =>
      refererUrl.pathname.startsWith(`/${l}`)
    );
    const response = NextResponse.next();
    if (lngInReferer) response.cookies.set(COOKIE_NAME, lngInReferer);
    return response;
  }

  return NextResponse.next();
}
