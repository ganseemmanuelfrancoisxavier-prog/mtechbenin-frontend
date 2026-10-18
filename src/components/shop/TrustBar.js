import { Zap, Shield, Clock, RefreshCw } from 'lucide-react'

const items = [
  {
    icon: Zap,
    title: 'Livraison Express',
    subtitle: 'À Cotonou & Abomey-Calavi',
    color: 'text-cta',
    bg: 'bg-orange-50',
  },
  {
    icon: Shield,
    title: 'Paiement Sécurisé',
    subtitle: 'MTN MoMo · Moov Money',
    color: 'text-primary',
    bg: 'bg-blue-50',
  },
  {
    icon: Clock,
    title: '7 ans d\'expertise',
    subtitle: 'Sur le marché béninois',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: RefreshCw,
    title: 'Retours Faciles',
    subtitle: 'Sous 7 jours',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
]

export default function TrustBar() {
  return (
    <section className="bg-apple-gray border-y border-black/5 py-10">
      <div className="max-w-7xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="font-semibold text-apple-black text-sm">{item.title}</p>
                <p className="text-apple-mid text-xs mt-0.5">{item.subtitle}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}