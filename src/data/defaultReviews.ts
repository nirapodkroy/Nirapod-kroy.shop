export interface Review {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  rating: number;
  productName: string;
  category: "all" | "food" | "dates" | "oil_ghee" | "fashion" | "gadgets";
  comment: string;
  date: string;
  isActive: boolean;
  isVerified: boolean;
  likes: number;
}

export const DEFAULT_REVIEWS: Review[] = [];
