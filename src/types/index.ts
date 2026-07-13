export interface CategoryPromoCard {
  image_url: string | null
  title: string
  href: string
}

export interface CategoryBanner {
  title: string
  subtitle: string
  href: string
  image_url: string | null
  cta: string
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

export interface ProductSpec {
  key: string
  value: string
}

export interface ProductDimension {
  name: string
  width: string
  depth: string
  height: string
}

export interface FAQItem {
  q: string
  a: string
}

export interface Supplier {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  notes: string | null
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
  supplier_id: string | null
  supplier?: Pick<Supplier, 'id' | 'name'> | null
  images: string[]
  stock: number
  is_featured: boolean
  is_active: boolean
  installment_count: number | null
  fast_delivery: boolean
  cart_discount_percent: number | null
  lowest_price_30d: number | null
  created_at: string
  updated_at: string
  variants?: ProductVariant[]
  components?: ProductComponent[]
  featured_specs?: string[]
  specs?: ProductSpec[]
  dimensions?: ProductDimension[]
  faq_items?: FAQItem[]
}

export interface VariantTemplate {
  id: string
  name: string
  options: string[]
  created_at: string
  updated_at: string
}

export interface DimensionTemplate {
  id: string
  name: string
  items: ProductDimension[]
  created_at: string
  updated_at: string
}

export interface SpecTemplate {
  id: string
  name: string
  items: ProductSpec[]
  created_at: string
  updated_at: string
}

export interface FAQTemplate {
  id: string
  name: string
  items: FAQItem[]
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

export interface ComponentTemplateItem {
  name: string
  unit_price: number
  default_quantity: number
  min_quantity: number
  max_quantity: number
}

export interface ComponentTemplate {
  id: string
  name: string
  items: ComponentTemplateItem[]
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
  image_url?: string | null
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

export interface LogoData {
  image_url: string | null
  alt: string
}

export type TrustIconName = 'Award' | 'Users' | 'Package' | 'Truck' | 'Star' | 'Shield' | 'Heart' | 'Home' | 'CheckCircle' | 'Clock'

export interface TrustStat {
  icon: TrustIconName
  value: string
  label: string
}

export interface Testimonial {
  name: string
  location: string
  rating: number
  text: string
}

export interface AboutSectionData {
  title: string
  text: string
  image_url: string | null
}

export interface DesignConsultationData {
  title: string
  text: string
  cta_text: string
  cta_href: string
  phone: string
  image_url: string | null
}

export interface SlideHotspot {
  x: number
  y: number
  product_id: string
  product_name: string
  product_price: number
  product_sale_price: number | null
  product_image_url: string | null
  product_slug: string
}

export interface HeroSlide {
  image_url: string | null
  title: string
  subtitle: string
  desc: string
  cta_text: string
  cta_href: string
  hotspots?: SlideHotspot[]
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

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  author_name?: string
}
