export default function Loading() {
  return (
    <main className="container-luxe py-12 md:py-16">
      <div className="mb-8 h-4 w-32 bg-champagne/10 rounded animate-pulse" />
      <p className="eyebrow mb-3 animate-pulse">Admin · Event bearbeiten</p>
      <div className="h-10 w-2/3 bg-champagne/10 rounded mb-3 animate-pulse" />
      <div className="h-4 w-1/3 bg-champagne/5 rounded mb-12 animate-pulse" />
      <div className="border border-champagne/15 p-6 mb-8 space-y-3">
        <div className="h-4 w-24 bg-champagne/10 rounded animate-pulse" />
        <div className="h-10 bg-champagne/10 rounded animate-pulse" />
      </div>
      <div className="border border-champagne/15 p-8 space-y-4">
        <div className="h-10 bg-champagne/10 rounded animate-pulse" />
        <div className="h-10 bg-champagne/10 rounded animate-pulse" />
        <div className="h-32 bg-champagne/5 rounded animate-pulse" />
      </div>
    </main>
  );
}
