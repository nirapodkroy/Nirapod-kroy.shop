export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  regularPrice?: number;
  category: string;
  parentCategory?: string;
  stock: number;
  imageUrl: string;
  images?: string[];
  imageCodes?: string[];
  productCode?: string;
  rating: number;
  ratingCount: number;
  badge?: string;
  featured?: boolean;
  isActive?: boolean;
  isAffiliate?: boolean;
  affiliateUrl?: string;
  affiliateSource?: string;
  affiliateButtonText?: string;
  isOfferZone?: boolean;
  offerDiscountNote?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedImageCode?: string;
  selectedImageUrl?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface AdminCustomer extends CustomerUser {
  orderCount?: number;
  totalSpent?: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  selectedImageCode?: string;
  productCode?: string;
}

export interface Order {
  id: string;
  trackingNumber?: string;
  productCodes?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: 'Cash on Delivery' | 'bKash / Mobile Wallet' | 'bKash' | 'Nagad' | 'Rocket' | string;
  senderPhoneNumber?: string;
  transactionId?: string;
  paymentGatewayFee?: number;
  paymentProvider?: 'bKash' | 'Nagad' | 'Rocket' | string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  syncedToGoogleSheet: boolean;
  notes?: string;
  shippingFee?: number;
  deliveryArea?: string;
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
  calculatedRevenue?: number;
  isCustomRevenue?: boolean;
  customTotalRevenue?: number;
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

export interface UserTrackingEntry {
  id: string;
  time: string;
  page: string;
  ip: string;
  location: string;
  device: string;
  os: string;
  browser: string;
  timeSpent: string;
  referrer: string;
  screen: string;
  sessionId: string;
  updatedAt?: number;
}
