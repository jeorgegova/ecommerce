export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: "buyer" | "admin"
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          level: number
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "created_at" | "updated_at" | "level">
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
      }
      products: {
        Row: {
          id: string
          category_id: string
          name: string
          slug: string
          sku: string
          internal_code: string | null
          short_description: string | null
          long_description: string | null
          technical_specs: string | null
          base_price: number
          sale_price: number | null
          cost_price: number | null
          stock: number
          low_stock_threshold: number
          stock_bar_max: number
          has_variants: boolean
          status: "draft" | "active" | "inactive" | "discontinued"
          is_featured: boolean
          published_at: string | null
          search_vector: string | null
          sales_count: number
          views_count: number
          avg_rating: number | null
          reviews_count: number
          weight: number | null
          width: number | null
          height: number | null
          length: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "created_at" | "updated_at" | "search_vector" | "sales_count" | "views_count" | "avg_rating" | "reviews_count" | "published_at">
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>
      }
      addresses: { Row: { id: string; user_id: string; name: string; full_name: string; phone: string | null; address_line_1: string; address_line_2: string | null; city: string; state: string; postal_code: string; country: string; is_default: boolean; created_at: string; updated_at: string }; Insert: any; Update: any }
      orders: { Row: { id: string; user_id: string; order_number: string; status: string; subtotal: number; shipping_cost: number; discount: number; total: number; notes: string | null; shipping_address_id: string | null; shipping_address: any; billing_address_id: string | null; billing_address: any; coupon_id: string | null; paid_at: string | null; cancelled_at: string | null; cancellation_reason: string | null; created_at: string; updated_at: string }; Insert: any; Update: any }
      order_items: { Row: any; Insert: any; Update: any }
    }
    Views: {
      category_tree: {
        Row: {
          id: string
          parent_id: string | null
          name: string
          slug: string
          level: number
          sort_order: number
          depth: number
          path: string[]
          slug_path: string[]
        }
      }
      product_listing: { Row: any }
    }
    Functions: {
      search_products: { Args: any; Returns: any }
      autocomplete_products: { Args: any; Returns: any }
    }
  }
}
