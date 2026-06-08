export interface CategoryPromoCard {
  image_url: string | null
  title: string
  href: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  promo_cards?: CategoryPromoCard[]
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  sale_price: number | null
  category_id: string
  category?: Category
  images: string[]
  stock: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  variants?: ProductVariant[]
  components?: ProductComponent[]
}

export interface VariantTemplate {
  id: string
  name: string
  options: string[]
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  attributes: Record<string, string>
  price: number | null
  sale_price: number | null
  stock: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductComponent {
  id: string
  product_id: string
  name: string
  unit_price: number
  default_quantity: number
  min_quantity: number
  max_quantity: number
  stock: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SelectedComponent {
  component_id: string
  name: string
  quantity: number
  unit_price: number
}

export interface CartItem {
  product: Product
  quantity: number
  variant?: ProductVariant
  components?: SelectedComponent[]
}

export interface Order {
  id: string
  user_id: string | null
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: OrderItem[]
  shipping_address: ShippingAddress
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  variant_id?: string | null
  variant_name?: string | null
  components_config?: SelectedComponent[] | null
}

export interface HeroSlide {
  image_url: string | null
  title: string
  subtitle: string
  desc: string
  cta_text: string
  cta_href: string
}

export interface ShippingAddress {
  full_name: string
  phone: string
  email: string
  address: string
  city: string
  district: string
  zip_code: string
}
