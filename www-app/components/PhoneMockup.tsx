interface PhoneMockupProps {
  label: string;
  className?: string;
  accentColor?: string;
}

export default function PhoneMockup({ label, className = "", accentColor }: PhoneMockupProps) {
  return (
    <div
      className={`relative mx-auto w-[200px] rounded-[32px] border-2 border-foam-border bg-white shadow-level-3 overflow-hidden ${className}`}
      style={{ aspectRatio: "9/19" }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-foam-bg-secondary rounded-b-xl z-10" />

      {/* Screen content */}
      <div className="absolute inset-0 flex flex-col pt-8 px-3 pb-3 gap-2">
        {/* Status bar */}
        <div className="flex justify-between items-center mb-1 px-1">
          <span className="text-[8px] font-semibold text-foam-text">9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-1.5 rounded-sm border border-foam-text-tertiary">
              <div className="w-2/3 h-full bg-foam-text-tertiary rounded-sm" />
            </div>
          </div>
        </div>

        {/* UI elements */}
        <div
          className="h-6 rounded-md w-3/4"
          style={{ backgroundColor: accentColor ?? "#339DC7", opacity: 0.15 }}
        />
        <div className="h-3 rounded-md w-full bg-foam-bg-secondary" />
        <div className="h-3 rounded-md w-5/6 bg-foam-bg-secondary" />

        <div className="mt-1 flex gap-1.5">
          <div
            className="h-12 w-12 rounded-lg flex-shrink-0"
            style={{ backgroundColor: accentColor ?? "#339DC7", opacity: 0.2 }}
          />
          <div className="flex flex-col gap-1 flex-1 justify-center">
            <div className="h-2.5 rounded bg-foam-bg-secondary w-full" />
            <div className="h-2 rounded bg-foam-bg-secondary w-2/3" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <div
            className="h-12 w-12 rounded-lg flex-shrink-0"
            style={{ backgroundColor: accentColor ?? "#339DC7", opacity: 0.12 }}
          />
          <div className="flex flex-col gap-1 flex-1 justify-center">
            <div className="h-2.5 rounded bg-foam-bg-secondary w-full" />
            <div className="h-2 rounded bg-foam-bg-secondary w-3/4" />
          </div>
        </div>

        <div className="mt-1 h-8 rounded-lg w-full" style={{ backgroundColor: accentColor ?? "#339DC7", opacity: 0.1 }} />
        <div className="h-3 rounded bg-foam-bg-secondary w-5/6" />
        <div className="h-3 rounded bg-foam-bg-secondary w-4/6" />

        {/* Bottom nav */}
        <div className="mt-auto flex justify-around border-t border-foam-border pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-md"
              style={{
                backgroundColor: i === 0 ? (accentColor ?? "#339DC7") : "#E4E4E7",
                opacity: i === 0 ? 0.8 : 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Label overlay (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-foam-bg-secondary/80 backdrop-blur-sm px-2 py-1 border-t border-foam-border">
        <p className="text-[8px] text-foam-text-tertiary text-center leading-tight">{label}</p>
      </div>
    </div>
  );
}
