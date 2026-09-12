export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  regularPrice?: number;
  category: string;
  stock: number;
  imageUrl: string;
  images?: string[];
  rating: number;
  ratingCount: number;
  badge?: string;
  featured?: boolean;
  isActive?: boolean;
  isAffiliate?: boolean;
  affiliateUrl?: string;
  affiliateSource?: string;
  affiliateButtonText?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: 'Cash on Delivery' | 'bKash / Mobile Wallet' | 'Credit / Debit Card';
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  syncedToGoogleSheet: boolean;
  notes?: string;
}

export interface OrderTickerItem {
  id: string;
  customerName: string;
  city: string;
  itemName: string;
  timeAgo: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  syncedGoogleSheetsCount: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export type Theme = 'light' | 'dark';
export type Language = 'bn' | 'en';
