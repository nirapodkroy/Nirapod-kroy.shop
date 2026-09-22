export interface SizeChartRow {
  name?: string;
  parameter?: string;
  values: { [size: string]: string };
}

export interface SizeChart {
  title?: string;
  unit?: string;
  columns: string[];
  rows: SizeChartRow[];
  note?: string;
}

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
  hasSizes?: boolean;
  sizes?: string[];
  sizeChart?: SizeChart;
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
  selectedSize?: string;
  productCode?: string;
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
  selectedSize?: string;
}

export interface TrackingStep {
  id: 'confirmed' | 'processing' | 'dispatched' | 'out_for_delivery' | 'delivered' | string;
  stepNumber: number; // 1 to 5
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  completed: boolean;
  completedAt?: string;
  note?: string;
}

export interface Order {
  id: string;
  trackingNumber?: string;
  orderTrackingDetails?: string; // Order Tracking Details (order traking detis) from Google Sheet or Admin
  trackingDetails?: string;
  trackingStage?: 'confirmed' | 'processing' | 'dispatched' | 'out_for_delivery' | 'delivered' | string;
  currentStepIndex?: number; // 0 to 4
  trackingSteps?: TrackingStep[];
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
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | string;
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
