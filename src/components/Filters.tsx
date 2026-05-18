const filterGroups = [
  { title: "Price", options: ["Under $250", "$250 - $500", "$500 - $1000", "$1000+"] },
  { title: "Brand", options: ["Northstar", "Lumio", "Sonicwell", "PixelCraft", "Forge"] },
  { title: "Availability", options: ["Online", "Pickup today", "Free shipping", "In stock"] },
  { title: "Condition", options: ["New", "Open Box", "Refurbished"] },
  { title: "Rating", options: ["4 stars & up", "3 stars & up"] },
];

export function Filters() {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">Filters</h2>
        <button className="text-sm font-semibold text-emerald-700">Reset</button>
      </div>
      <div className="space-y-5">
        {filterGroups.map((group) => (
          <section key={group.title}>
            <h3 className="mb-2 text-sm font-bold text-slate-900">{group.title}</h3>
            <div className="space-y-2">
              {group.options.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="size-4 accent-emerald-600" />
                  {option}
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
