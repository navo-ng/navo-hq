import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import dns from "dns";

function isPrivateIPv4(address: string): boolean {
  const parts = address.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16
  if (a === 127) return true; // 127.0.0.0/8
  if (a === 0) return true; // 0.0.0.0
  return false;
}

function isBlockedAddress(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower === "::1" || lower === "::" || lower === "0.0.0.0") return true;
  // IPv4-mapped IPv6 loopback e.g. ::ffff:127.0.0.1
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped && isPrivateIPv4(mapped[1])) return true;
  if (lower.includes(".")) {
    // Try IPv4 check on the trailing IPv4 portion (covers plain IPv4)
    const ipv4Part = lower.split(":").pop() || lower;
    if (isPrivateIPv4(ipv4Part)) return true;
  }
  // IPv6 unspecified / loopback shorthand already handled; block link-local fe80::/10
  if (lower.startsWith("fe80:") || lower.startsWith("fec0:") || lower.startsWith("fc00:") || lower.startsWith("fd00:")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const serverSupabase = await createServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Blocked target" }, { status: 400 });
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "::"
  ) {
    return NextResponse.json({ error: "Blocked target" }, { status: 400 });
  }

  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    for (const entry of addresses) {
      if (isPrivateIPv4(entry.address) || isBlockedAddress(entry.address)) {
        return NextResponse.json({ error: "Blocked target" }, { status: 400 });
      }
    }
  } catch {
    return NextResponse.json({ error: "Blocked target" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "NAVO-HQ/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 502 });
    }

    const text = await res.text();
    return new NextResponse(text, {
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 502 });
  }
}
