import { getCartUpsellProducts } from '@/lib/repositories/products'
import CartClient from '@/components/cart/CartClient'
import CartUpsellSection from '@/components/cart/CartUpsellSection'

export default async function CartPage() {
  const upsellProducts = await getCartUpsellProducts()
  return (
    <>
      <CartClient />
      <CartUpsellSection products={upsellProducts} />
    </>
  )
}
