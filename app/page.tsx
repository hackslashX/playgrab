"use client";

import { FormEvent, useState } from "react";

type Asset = { url: string; kind: "icon" | "banner" | "screenshot"; label: string };
type AppResult = { id: string; name: string; assets: Asset[] };

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 18v3h16v-3" /></svg>;
}

function downloadUrl(asset: Asset, id: string) {
  const params = new URLSearchParams({ url: asset.url, name: `${id}-${asset.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` });
  return `/api/download?${params}`;
}

export default function Home() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<AppResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/assets?app=${encodeURIComponent(value.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not find that app.");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return <main>
    <div className="page-frame"><div className="container">
      <header className="site-header"><a className="brand" href="#top">PLAYGRAB<span className="brand-dot">●</span></a><span className="header-description">Google Play downloads</span></header>
      <section className="hero" id="top">
        <div className="hero-copy"><h1>App assets<br /><span>from Google Play.</span></h1><p>Paste an app link or ID. Download its icon and screenshots.</p></div>
        <form className="search" onSubmit={submit}>
          <label className="sr-only" htmlFor="app-input">Google Play URL or package ID</label>
          <span className="input-prefix" aria-hidden="true">APP LINK</span>
          <input id="app-input" autoComplete="off" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Paste a Play Store link or app ID" />
          <button type="submit" disabled={loading}>{loading ? "Loading…" : "Find assets"}<span aria-hidden="true">⟶</span></button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="hint">Example: <button type="button" onClick={() => setValue("com.spotify.music")}>com.spotify.music</button></p>
      </section>
      {result ? <Results result={result} /> : <EmptyState />}
      <footer><span>playgrab</span><span>Images belong to their owners.</span></footer>
    </div></div>
  </main>;
}

function AssetCard({ asset, id }: { asset: Asset; id: string }) {
  return <article className="asset-card">
    <div className="asset-image"><img src={asset.url} alt={asset.label} loading="lazy" /></div>
    <div className="asset-info"><span>{asset.label}</span><a href={downloadUrl(asset, id)} aria-label={`Download ${asset.label}`} title={`Download ${asset.label}`}><DownloadIcon /><span>Download</span></a></div>
  </article>;
}

function Results({ result }: { result: AppResult }) {
  const icon = result.assets.find((asset) => asset.kind === "icon");
  const banner = result.assets.find((asset) => asset.kind === "banner");
  const screenshots = result.assets.filter((asset) => asset.kind === "screenshot");
  return <section className="results" aria-label="App assets">
    <div className="results-top"><div className="results-heading"><span className="section-kicker">Google Play</span><h2>{result.name}</h2><p>{result.id}</p><a href={`https://play.google.com/store/apps/details?id=${encodeURIComponent(result.id)}`} target="_blank" rel="noreferrer" className="store-link">View on Google Play ↗</a></div>
      {icon && <div className="icon-panel"><div className="group-heading"><h3>App icon</h3></div><AssetCard asset={icon} id={result.id} /></div>}
    </div>
    {banner && <div className="asset-group banner"><div className="group-heading"><h3>Feature graphic</h3></div><div className="asset-grid"><AssetCard asset={banner} id={result.id} /></div></div>}
    {screenshots.length > 0 && <div className="asset-group screenshot"><div className="group-heading"><h3>Screenshots</h3><span>{screenshots.length} images</span></div><div className="asset-grid" tabIndex={0} aria-label="Screenshots, scroll horizontally">{screenshots.map((asset) => <AssetCard key={asset.url} asset={asset} id={result.id} />)}</div></div>}
  </section>;
}

function EmptyState() {
  return <section className="empty-state" aria-label="Available assets">
    <div className="section-line"><span>Available downloads</span></div>
    <div className="feature-list">
      <article className="feature"><div className="feature-art icon-art"><div className="icon-illustration"><span>★</span></div></div><div className="feature-copy"><h2>App icon</h2><p>The icon shown on the store page.</p></div></article>
      <article className="feature"><div className="feature-art screen-art"><div className="screen-illustration"><span /><span /><span /></div></div><div className="feature-copy"><h2>Screenshots</h2><p>Images from the public gallery.</p></div></article>
      <article className="feature"><div className="feature-art graphic-art"><div className="graphic-illustration"><i /><b>PLAY<br />MORE.</b></div></div><div className="feature-copy"><h2>Feature graphic</h2><p>Available when the app has one.</p></div></article>
    </div>
  </section>;
}
