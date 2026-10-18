import ShopLayout from '@/components/layout/ShopLayout'
import CataloguePage from '@/components/shop/CataloguePage'

export const metadata = {
  title: 'Catalogue',
  description: 'Tous nos produits — Écouteurs, Enceintes, Vapes et plus encore.',
}

export default function Catalogue() {
  return (
    <ShopLayout>
      <CataloguePage />
    </ShopLayout>
  )
}