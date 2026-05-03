export function SafeZonePreview({ format }: { format: string }) {
  const isVertical = /reel|historia|story|video/i.test(format)
  const isGoogle = /google/i.test(format)

  if (isGoogle) return null

  if (isVertical) {
    return (
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="relative w-[42px] rounded-lg overflow-hidden border-2 border-border bg-muted/30" style={{ height: '74px' }}>
          {/* Unsafe top */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center bg-red-400/25 border-b border-red-400/50" style={{ height: '15%' }}>
            <span className="text-[5px] text-red-600 font-bold leading-none">✕</span>
          </div>
          {/* Safe zone */}
          <div className="absolute left-[8%] right-[8%] flex items-center justify-center border border-dashed border-green-500/60 rounded-sm" style={{ top: '15%', bottom: '15%' }}>
            <span className="text-[5px] text-green-600 font-bold text-center leading-tight">OK</span>
          </div>
          {/* Unsafe bottom */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-red-400/25 border-t border-red-400/50" style={{ height: '15%' }}>
            <span className="text-[5px] text-red-600 font-bold leading-none">✕</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-semibold text-foreground/70">9:16</p>
          <p className="text-[8px] text-muted-foreground">Zona segura 70%</p>
        </div>
      </div>
    )
  }

  // Square (Post / Carousel)
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative w-[52px] h-[52px] rounded-lg overflow-hidden border-2 border-border bg-muted/30">
        {/* Safe zone inset */}
        <div className="absolute inset-[10%] border border-dashed border-green-500/60 rounded-sm flex items-center justify-center">
          <span className="text-[5px] text-green-600 font-bold">OK</span>
        </div>
        {/* Corner warning dots */}
        {[
          'top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'
        ].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-[10%] h-[10%] bg-red-400/30`} />
        ))}
      </div>
      <div className="text-center">
        <p className="text-[9px] font-semibold text-foreground/70">1:1</p>
        <p className="text-[8px] text-muted-foreground">Margen 10%</p>
      </div>
    </div>
  )
}
