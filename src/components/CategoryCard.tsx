'use client'
export default function CategoryCard({
  nominee, selected, onSelect
}: {
  nominee: { id: string; display_name: string; avatar_url: string | null }
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button onClick={onSelect}
      className={`rounded-2xl p-4 border ${selected ? 'border-purple-500 bg-purple-900/30' : 'border-neutral-800 bg-neutral-900'}`}>
      <div className="flex items-center gap-3">
        <img src={nominee.avatar_url ?? '/placeholder.png'} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="text-left">
          <div className="font-semibold">{nominee.display_name}</div>
          <div className="text-sm text-neutral-400">Seleccionar</div>
        </div>
      </div>
    </button>
  )
}
