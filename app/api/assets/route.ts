import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Asset = { url: string; kind: "icon" | "banner" | "screenshot"; label: string };

function appIdFrom(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.endsWith("play.google.com")) return url.searchParams.get("id") || "";
  } catch {
    // A package ID is accepted directly.
  }
  return /^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$/.test(value) ? value : "";
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

function meta(html: string, property: string) {
  const expression = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  return decodeHtml(html.match(expression)?.[1] || "");
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("app")?.trim() || "";
  const id = appIdFrom(raw);
  if (!id) return NextResponse.json({ error: "Paste a Google Play link or app ID." }, { status: 400 });

  try {
    const response = await fetch(`https://play.google.com/store/apps/details?id=${encodeURIComponent(id)}&hl=en&gl=US`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; Playgrab/1.0)", "accept-language": "en-US,en;q=0.8" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("We couldn't open that app page.");
    const html = await response.text();
    const name = meta(html, "og:title").replace(/ - Apps on Google Play$/i, "") || id;
    const developer = meta(html, "og:site_name") || "Google Play";
    const ogImage = meta(html, "og:image");
    const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    const imageAttribute = (tag: string, attribute: string) => tag.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"))?.[1] || "";
    const imageBase = (url: string) => url.split("=")[0];
    const seen = new Set<string>();
    const listingImages = imageTags.map((tag) => ({
      url: decodeHtml(imageAttribute(tag, "src")),
      alt: decodeHtml(imageAttribute(tag, "alt")),
    })).filter(({ url }) => url.startsWith("https://play-lh.googleusercontent.com/") && !url.includes("/a-/"))
      .filter(({ url }) => {
        const base = imageBase(url);
        if (seen.has(base)) return false;
        seen.add(base);
        return true;
      });

    const assets: Asset[] = [];
    if (ogImage) assets.push({ url: ogImage, kind: "icon", label: "App icon" });
    const graphic = listingImages.find((image) => /feature graphic/i.test(image.alt));
    if (graphic) assets.push({ url: `${imageBase(graphic.url)}=s0`, kind: "banner", label: "Feature graphic" });
    listingImages.filter((image) => /screenshot/i.test(image.alt)).slice(0, 60)
      .forEach((image, index) => assets.push({ url: `${imageBase(image.url)}=s0`, kind: "screenshot", label: `Screenshot ${index + 1}` }));

    if (!assets.length) throw new Error("No images were found for this app.");
    return NextResponse.json({ id, name, developer, assets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We couldn't load this app.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
