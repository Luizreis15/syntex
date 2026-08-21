import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware Edge-safe: usa @supabase/ssr direto.
 * Não importar @syntex/database aqui — o barrel puxa admin/service_role (Node).
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!url || !anon) {
    console.error(
      "[middleware] Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente Vercel.",
    );
    if (!request.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
    if (!user && !isAuthRoute) {
      const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value);
      });
      return redirectResponse;
    }
    if (user && isAuthRoute) {
      const redirectResponse = NextResponse.redirect(new URL("/inicio", request.url));
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value);
      });
      return redirectResponse;
    }

    return response;
  } catch (err) {
    console.error("[middleware]", err);
    if (!request.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
