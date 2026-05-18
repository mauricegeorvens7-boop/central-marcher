export function AdminTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-bold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-sm">
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`} className="border-t border-slate-100">
                {row.map((cell) => (
                  <td key={cell} className="py-3 pr-4 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
