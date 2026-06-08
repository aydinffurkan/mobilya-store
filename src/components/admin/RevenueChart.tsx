interface DayRevenue {
  label: string
  value: number
}

export default function RevenueChart({ data }: { data: DayRevenue[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <h2 className="font-bold mb-1">Gelir Trendi</h2>
      <p className="text-xs text-muted-foreground mb-5">Son 14 gün</p>

      {data.every((d) => d.value === 0) ? (
        <p className="text-center text-sm text-muted-foreground py-12">Bu dönemde gelir verisi yok.</p>
      ) : (
        <div className="flex items-end gap-1.5 h-44">
          {data.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 group relative">
              <div className="relative w-full flex items-end justify-center" style={{ height: '140px' }}>
                <div
                  className="w-full max-w-[28px] bg-[#8B6914] rounded-t-md transition-all group-hover:bg-[#7a5c12]"
                  style={{ height: `${Math.max(2, (d.value / max) * 140)}px` }}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[11px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {d.value.toLocaleString('tr-TR')} ₺
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
