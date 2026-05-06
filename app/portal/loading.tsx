export default function PortalLoading() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border border-champagne/30 border-t-champagne rounded-full animate-spin" />
        <p className="text-cream/40 text-[10px] uppercase tracking-[0.4em]">Loading</p>
      </div>
    </div>
  );
}
