
export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPerItem: number; 
  image: string;
  images: string[];
  category: string;
  inventory: number;
  sku?: string;
  barcode?: string;
  status: 'active' | 'draft';
  supplierUrl?: string; 
  productType: 'physical' | 'digital' | 'service' | 'subscription'; 
  vendor?: string;
  hasVariants: boolean;
  variants: ProductVariant[]; 
  options: ProductOption[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  handle?: string;
  features: string[];
  buyerQuestions: BuyerQuestion[];
  stripeProductId?: string;
  stripePriceId?: string;
}

export interface ProductVariant {
  id: string;
  title: string; 
  price: number;
  inventory: number;
  sku?: string;
}

export interface BuyerQuestion {
  id: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
}

export interface CartItem extends Product {
  quantity: number;
  answers?: Record<string, string>; 
  selectedVariant?: ProductVariant; 
}

export interface Customer {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  customer: Customer;
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  cost: number;
  date: string;
  status: 'paid' | 'unfulfilled' | 'fulfilled' | 'refunded';
  paymentMethod: string;
  trackingNumber?: string;
  carrier?: string;
  transactionId?: string;
}

export interface Discount {
  id: string;
  code: string;
  percentage: number;
  uses: number;
  active: boolean;
}

// --- Brand & Marketing ---

export interface BrandIdentity {
  mission: string;
  vision: string;
  values: string[];
  toneOfVoice: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: number; // 0.8 to 1.2
    letterSpacing: 'tighter' | 'tight' | 'normal' | 'wide' | 'widest';
    headingWeight: '400' | '500' | '600' | '700' | '800' | '900';
  };
  styling: {
    borderRadius: number; // px
    borderWidth: number; // px
    shadowStrength: number; // 0 to 1
    buttonStyle: 'flat' | 'gradient' | 'outline' | 'soft' | 'neo';
    inputStyle: 'modern' | 'filled' | 'outlined' | 'underlined';
    cardStyle: 'flat' | 'shadow' | 'border' | 'glass';
    noiseTexture: boolean;
  };
  logoUrl?: string;
  faviconUrl?: string;
  coverImage?: string;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  platform: 'Instagram' | 'TikTok' | 'Email' | 'Blog' | 'YouTube';
  status: 'planned' | 'active' | 'completed';
  date: string; // ISO Date
  content: string;
}

export interface CustomerReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  productId?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reply?: string;
}

export interface MarketingStats {
  adCredits: number; // The "Money"
  level: number;
  title: string;
  wins: number;
  losses: number;
  streak: number;
  totalEarnings: number;
}

// --- Builder ---

export type SectionType = 
  | 'hero' 
  | 'text' 
  | 'image' 
  | 'links' 
  | 'video' 
  | 'products' 
  | 'featured-product' 
  | 'testimonial' 
  | 'newsletter' 
  | 'countdown' 
  | 'faq' 
  | 'gallery' 
  | 'contact'
  | 'video-hero' 
  | 'features'   
  | 'story'      
  | 'map'        
  | 'pricing'    
  | 'stats'      
  | 'partners'   
  | 'collections' 
  | 'banner'     
  | 'instagram'; 

export interface ProfileSection {
  id: string;
  type: SectionType;
  title?: string;
  content: any;
  isVisible: boolean;
}

export interface StoreSettings {
  name: string;
  description: string;
  bio?: string;
  contactEmail: string;
  category: string; 
  currency: string;
  country: string;
  language: string;
  timezone: string;
  logo: string;
  banner: string;
  primaryColor: string; 
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily: 'Inter' | 'Playfair Display' | 'Roboto Mono' | 'Courier Prime' | 'Oswald';
  borderRadius: string; 
  buttonStyle?: 'rounded' | 'square' | 'pill';
  viewMode: 'classic' | 'cinematic'; 
  showPoweredBy: boolean;
  socialLinks: { platform: string; url: string }[];
  beginnerMode: boolean; 
  isPaused: boolean; 
  dropMode: boolean; 
  legalPagesGenerated: boolean;
  stripeConnected?: boolean;
  stripePublicKey?: string; 
  stripeSecretKey?: string; 
  taxRate?: number;
}

export interface SalesData {
  date: string;
  sales: number;
  profit: number;
  visitors: number;
}

export interface LiveActivityItem {
  id: string;
  type: 'order' | 'visitor' | 'fulfillment' | 'payment';
  message: string;
  timestamp: string;
  amount?: number;
  customerLocation?: string;
}

export interface Store {
  id: string;
  stripeAccountId?: string;
  settings: StoreSettings;
  brandIdentity: BrandIdentity;
  campaigns: MarketingCampaign[];
  reviews: CustomerReview[];
  products: Product[];
  orders: Order[];
  discounts: Discount[];
  salesData: SalesData[];
  liveFeed: LiveActivityItem[];
  payoutBalance: number;
  sections: ProfileSection[];
  marketingStats: MarketingStats;
}

export interface AIProductSuggestion {
  description: string;
  price: number;
  tags: string[];
  marketingHook: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
