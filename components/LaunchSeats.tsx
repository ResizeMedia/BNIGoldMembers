import type { SeatColor } from '@/lib/bni-data'

const CheckIcon = ({ size }: { size: string }) => (
  <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const seatClass: Record<SeatColor, string> = {
  green: 'bg-emerald-500 text-white border-emerald-500',
  yellow: 'bg-amber-400 text-white border-amber-400',
  gray: 'bg-white text-transparent border-slate-300',
}

const seatTitle: Record<SeatColor, string> = {
  green: 'Validat si confirmat',
  yellow: 'Membru deja validat',
  gray: 'Loc liber',
}

// Bullet size shrinks as the number of seats grows, so a large launch target
// stays compact instead of rendering hundreds of full-size circles. Above the
// largest tier the check icon is dropped — color alone carries the meaning.
function getSeatStyle(count: number) {
  if (count <= 30) return { seat: 'h-4 w-4', icon: 'h-2.5 w-2.5', gap: 'gap-1', showCheck: true }
  if (count <= 60) return { seat: 'h-3 w-3', icon: 'h-2 w-2', gap: 'gap-1', showCheck: true }
  if (count <= 100) return { seat: 'h-2.5 w-2.5', icon: '', gap: 'gap-0.5', showCheck: false }
  return { seat: 'h-2 w-2', icon: '', gap: 'gap-0.5', showCheck: false }
}

interface LaunchSeatsProps {
  seats: SeatColor[]
  showLegend?: boolean
}

export default function LaunchSeats({ seats, showLegend = false }: LaunchSeatsProps) {
  const green = seats.filter((seat) => seat === 'green').length
  const yellow = seats.filter((seat) => seat === 'yellow').length
  const style = getSeatStyle(seats.length)

  return (
    <div className="mt-3">
      <div className={`flex flex-wrap ${style.gap}`}>
        {seats.map((seat, index) => (
          <span
            key={index}
            title={seatTitle[seat]}
            className={`flex ${style.seat} items-center justify-center rounded-full border ${seatClass[seat]}`}
          >
            {style.showCheck && seat !== 'gray' && <CheckIcon size={style.icon} />}
          </span>
        ))}
      </div>
      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-400" /> Deja validati ({yellow})</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Validat prin recomandare ({green})</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full border-2 border-slate-300 bg-white" /> Liber ({seats.length - green - yellow})</span>
        </div>
      )}
    </div>
  )
}
