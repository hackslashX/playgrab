import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url") || "";
  const requestedName = request.nextUrl.searchParams.get("name") || "playgrab-asset";
  const fileName = requestedName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "playgrab-asset";
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return NextResponse.json({ error: "Invalid asset URL." }, { status: 400 });
  }

  if (url.protocol !== "https:" || url.hostname !== "play-lh.googleusercontent.com") {
    return NextResponse.json({ error: "Only Google Play image URLs can be downloaded." }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!upstream.ok || !upstream.body) throw new Error("Image unavailable");
    const type = upstream.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error("Not an image");
    const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("gif") ? "gif" : "jpg";
    return new NextResponse(upstream.body, {
      headers: {
        "content-type": type,
        "content-disposition": `attachment; filename="${fileName}.${extension}"`,
        "cache-control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not download this image." }, { status: 502 });
  }
}
