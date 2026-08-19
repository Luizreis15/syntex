import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-permission";
import { globalSearch } from "@/lib/domain/global-search";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const result = await globalSearch(auth.session, q);
  return NextResponse.json(result);
}
