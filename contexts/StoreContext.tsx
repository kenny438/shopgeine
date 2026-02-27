
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CartItem, StoreSettings, Store, Notification, LiveActivityItem, Order, Customer, ProfileSection, SectionType, Discount, SalesData, BrandIdentity, MarketingCampaign, CustomerReview, MarketingStats } from '../types';

interface StoreContextType {
  stores: Store[];
  activeStoreId: string;
  createStore: (name: string, category: string) => void;
  switchStore: (id: string) => void;

  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => Promise<void>;
  
  // Brand & Marketing
  brandIdentity: BrandIdentity;
  updateBrandIdentity: (updates: Partial<BrandIdentity>) => void;
  campaigns: MarketingCampaign[];
  addCampaign: (campaign: MarketingCampaign) => void;
  reviews: CustomerReview[];
  replyToReview: (reviewId: string, reply: string) => void;
  marketingStats: MarketingStats;
  updateMarketingStats: (stats: Partial<MarketingStats>) => void;
  
  sections: ProfileSection[];
  addSection: (type: SectionType, initialContent?: any) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, content: any) => void;
  moveSection: (id: string, direction: 'up' | 'down') => void;

  orders: Order[];
  payoutBalance: number;
  fulfillOrder: (orderId: string, trackingNumber: string, carrier: string) => void;
  
  salesData: SalesData[];
  liveFeed: LiveActivityItem[];
  
  discounts: Discount[];
  addDiscount: (code: string, percentage: number) => void;
  toggleDiscount: (id: string) => void;

  cart: CartItem[];
  addToCart: (product: Product, answers?: Record<string, string>, variant?: any) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  createOrder: (customer: Customer) => Promise<boolean>;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  
  settings: StoreSettings;
  updateSettings: (settings: Partial<StoreSettings>) => void;
  globalStripeConfig: { publicKey: string, secretKey: string };
  updateGlobalStripe: (publicK: string, secretK: string) => void;
  
  notifications: Notification[];
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissNotification: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SETTINGS: StoreSettings = {
    name: "My Brand",
    description: "Welcome to my official store.",
    bio: "We create sustainable, high-quality products for modern living.",
    contactEmail: "",
    category: "General",
    currency: "USD",
    country: "United States",
    language: "English",
    timezone: "UTC-05:00 Eastern Time",
    logo: "https://via.placeholder.com/200x200?text=Logo",
    banner: "https://via.placeholder.com/1200x400?text=Store+Banner",
    primaryColor: "#00A884", 
    backgroundColor: "#FFFFFF",
    textColor: "#111B21",
    fontFamily: 'Inter',
    borderRadius: "12px", 
    buttonStyle: 'rounded',
    viewMode: 'classic',
    showPoweredBy: true,
    socialLinks: [
      { platform: "Instagram", url: "#" },
      { platform: "TikTok", url: "#" }
    ],
    beginnerMode: true,
    isPaused: false,
    dropMode: false,
    legalPagesGenerated: false,
    stripeConnected: false,
    taxRate: 0.08
};

const DEFAULT_BRAND_IDENTITY: BrandIdentity = {
  mission: "To inspire and innovate with every product we create.",
  vision: "A world where quality and design are accessible to everyone.",
  values: ["Quality", "Integrity", "Innovation"],
  toneOfVoice: "Friendly, Professional, and Trustworthy",
  colors: {
    primary: "#00A884",
    secondary: "#111B21",
    accent: "#34B7F1",
    background: "#FFFFFF",
    surface: "#F9FAFB",
    text: "#111827",
    border: "#E5E7EB"
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    scale: 1,
    letterSpacing: 'normal',
    headingWeight: '700'
  },
  styling: {
    borderRadius: 12,
    borderWidth: 1,
    shadowStrength: 0.5,
    buttonStyle: 'flat',
    inputStyle: 'outlined',
    cardStyle: 'shadow',
    noiseTexture: false
  }
};

const DEFAULT_SECTIONS: ProfileSection[] = [
    {
        id: 'hero-default',
        type: 'hero',
        isVisible: true,
        content: {
            headline: "Welcome to My Store",
            subheadline: "Discover unique products curated just for you.",
            layout: 'center'
        }
    },
    {
        id: 'products-default',
        type: 'products',
        isVisible: true,
        content: { title: "Latest Drops" }
    }
];

const DEFAULT_MARKETING_STATS: MarketingStats = {
    adCredits: 1000,
    level: 1,
    title: "Apprentice",
    wins: 0,
    losses: 0,
    streak: 0,
    totalEarnings: 0
};

// Helper to generate last 7 days for sales chart initialization
const getInitialSalesData = (): SalesData[] => {
    const data: SalesData[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        data.push({
            date: d.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: 0,
            profit: 0,
            visitors: 0
        });
    }
    return data;
};

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  const [stores, setStores] = useState<Store[]>(() => {
      const saved = localStorage.getItem('shopgenie_stores');
      return saved ? JSON.parse(saved) : [];
  });
  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
      return localStorage.getItem('shopgenie_active_id') || '';
  });
  const [globalStripeConfig, setGlobalStripeConfig] = useState(() => {
      const saved = localStorage.getItem('shopgenie_stripe_config');
      return saved ? JSON.parse(saved) : { publicKey: '', secretKey: '' };
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
      localStorage.setItem('shopgenie_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
      localStorage.setItem('shopgenie_active_id', activeStoreId);
  }, [activeStoreId]);

  useEffect(() => {
      localStorage.setItem('shopgenie_stripe_config', JSON.stringify(globalStripeConfig));
  }, [globalStripeConfig]);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => dismissNotification(id), 3000);
  };

  const dismissNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateGlobalStripe = (publicK: string, secretK: string) => {
      setGlobalStripeConfig({ publicKey: publicK, secretKey: secretK });
      setStores(prev => prev.map(s => ({
          ...s,
          settings: {
              ...s.settings,
              stripePublicKey: publicK,
              stripeSecretKey: secretK,
              stripeConnected: true
          }
      })));
      notify("Stripe keys updated globally.");
  };

  const createStore = (name: string, category: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const stripeAccountId = globalStripeConfig.secretKey 
        ? `acct_virtual_${Math.random().toString().substr(2, 8)}` 
        : undefined;

    let themeColor = "#00A884";
    if (category.toLowerCase().includes('fashion')) themeColor = "#111B21";
    if (category.toLowerCase().includes('tech')) themeColor = "#007AFF";
    if (category.toLowerCase().includes('beauty')) themeColor = "#E91E63";

    const newStore: Store = {
        id: newId,
        stripeAccountId, 
        settings: { 
            ...DEFAULT_SETTINGS, 
            name, 
            category,
            primaryColor: themeColor,
            logo: `https://via.placeholder.com/200x200?text=${name.charAt(0)}`,
            stripeConnected: !!globalStripeConfig.secretKey,
            stripePublicKey: globalStripeConfig.publicKey || '',
            stripeSecretKey: globalStripeConfig.secretKey || ''
        },
        brandIdentity: {
            ...DEFAULT_BRAND_IDENTITY,
            colors: { ...DEFAULT_BRAND_IDENTITY.colors, primary: themeColor }
        },
        products: [],
        orders: [],
        discounts: [],
        campaigns: [],
        reviews: [],
        salesData: getInitialSalesData(),
        liveFeed: [],
        payoutBalance: 0,
        sections: DEFAULT_SECTIONS,
        marketingStats: DEFAULT_MARKETING_STATS
    };
    
    setStores(prev => [...prev, newStore]);
    setActiveStoreId(newId);
    setCart([]); 
    notify(`Store "${name}" created!`, 'success');
  };

  const switchStore = (id: string) => {
    const target = stores.find(s => s.id === id);
    if (target) {
        setActiveStoreId(id);
        setCart([]); 
        notify(`Switched to: ${target.settings.name}`);
    }
  };

  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];
  const products = activeStore?.products || [];
  const orders = activeStore?.orders || [];
  const discounts = activeStore?.discounts || [];
  const payoutBalance = activeStore?.payoutBalance || 0;
  const settings = activeStore?.settings || DEFAULT_SETTINGS;
  const sections = activeStore?.sections || DEFAULT_SECTIONS;
  const salesData = activeStore?.salesData || [];
  const liveFeed = activeStore?.liveFeed || [];
  const brandIdentity = activeStore?.brandIdentity || DEFAULT_BRAND_IDENTITY;
  const campaigns = activeStore?.campaigns || [];
  const reviews = activeStore?.reviews || [];
  const marketingStats = activeStore?.marketingStats || DEFAULT_MARKETING_STATS;
  
  const updateStoreState = (updater: (store: Store) => Store) => {
      setStores(prev => prev.map(s => s.id === activeStoreId ? updater(s) : s));
  };

  const updateMarketingStats = (updates: Partial<MarketingStats>) => {
      updateStoreState(store => {
          const newStats = { ...store.marketingStats, ...updates };
          // Simple level up logic
          if (newStats.totalEarnings > newStats.level * 5000) {
              newStats.level += 1;
              const titles = ["Apprentice", "Strategist", "Growth Hacker", "CMO", "Tycoon", "Legend"];
              newStats.title = titles[Math.min(newStats.level - 1, titles.length - 1)];
              notify(`Leveled Up! You are now a ${newStats.title}`, 'success');
          }
          return { ...store, marketingStats: newStats };
      });
  };

  const updateBrandIdentity = (updates: Partial<BrandIdentity>) => {
      updateStoreState(store => {
          // Deep merge logic for nested objects
          const current = store.brandIdentity || DEFAULT_BRAND_IDENTITY;
          
          const newIdentity = {
              ...current,
              ...updates,
              colors: { ...current.colors, ...(updates.colors || {}) },
              typography: { ...current.typography, ...(updates.typography || {}) },
              styling: { ...current.styling, ...(updates.styling || {}) }
          };

          // Sync relevant settings to StoreSettings for legacy compatibility
          const newSettings = { ...store.settings };
          if (updates.colors?.primary) newSettings.primaryColor = updates.colors.primary;
          if (updates.colors?.background) newSettings.backgroundColor = updates.colors.background;
          if (updates.colors?.text) newSettings.textColor = updates.colors.text;
          if (updates.typography?.bodyFont) newSettings.fontFamily = updates.typography.bodyFont as any;
          if (updates.styling?.borderRadius) newSettings.borderRadius = `${updates.styling.borderRadius}px`;
          if (updates.logoUrl) newSettings.logo = updates.logoUrl;

          return { ...store, brandIdentity: newIdentity, settings: newSettings };
      });
  };

  const addCampaign = (campaign: MarketingCampaign) => {
      updateStoreState(store => ({
          ...store,
          campaigns: [...(store.campaigns || []), campaign]
      }));
      notify("Campaign scheduled.");
  };

  const replyToReview = (reviewId: string, reply: string) => {
      updateStoreState(store => ({
          ...store,
          reviews: store.reviews.map(r => r.id === reviewId ? { ...r, reply } : r)
      }));
      notify("Reply posted.");
  };

  const addProduct = async (product: Product) => {
      // Find the store to get settings
      const currentStore = stores.find(s => s.id === activeStoreId);
      const secretKey = currentStore?.settings.stripeSecretKey || globalStripeConfig.secretKey;
      
      let stripeIds: Partial<Product> = {};

      if (secretKey && secretKey.startsWith('sk_')) {
          try {
              // 1. Create Product in Stripe
              const prodBody = new URLSearchParams();
              prodBody.append('name', product.title);
              if (product.description) prodBody.append('description', product.description.substring(0, 500)); // Limit length
              // Only send image if it is a hosted URL (Stripe won't accept base64 in this endpoint)
              if (product.image && product.image.startsWith('http')) {
                  prodBody.append('images[]', product.image);
              }

              const prodRes = await fetch('https://api.stripe.com/v1/products', {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${secretKey}`,
                      'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  body: prodBody
              });

              if (prodRes.ok) {
                  const stripeProd = await prodRes.json();
                  stripeIds = { ...stripeIds, stripeProductId: stripeProd.id };

                  // 2. Create Price in Stripe
                  const priceBody = new URLSearchParams();
                  priceBody.append('unit_amount', Math.round(product.price * 100).toString());
                  priceBody.append('currency', currentStore?.settings.currency?.toLowerCase() || 'usd');
                  priceBody.append('product', stripeProd.id);

                  const priceRes = await fetch('https://api.stripe.com/v1/prices', {
                      method: 'POST',
                      headers: {
                          'Authorization': `Bearer ${secretKey}`,
                          'Content-Type': 'application/x-www-form-urlencoded'
                      },
                      body: priceBody
                  });

                  if (priceRes.ok) {
                      const stripePrice = await priceRes.json();
                      stripeIds = { ...stripeIds, stripePriceId: stripePrice.id };
                  }
                  
                  notify("Synced to Stripe Catalog!", "success");
              } else {
                  console.warn("Stripe Product creation failed", await prodRes.json());
              }
          } catch (e) {
              console.error("Stripe sync error", e);
              notify("Stripe sync failed, created locally only.", "error");
          }
      }

      const newProduct = { ...product, ...stripeIds };
      updateStoreState(store => ({ ...store, products: [newProduct, ...store.products] }));
      notify("Product added.");
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
      updateStoreState(store => ({
          ...store,
          products: store.products.map(p => p.id === id ? { ...p, ...updates } : p)
      }));

      // Fire and forget Stripe Update if key exists and product has ID
      const currentStore = stores.find(s => s.id === activeStoreId);
      const product = currentStore?.products.find(p => p.id === id);
      const secretKey = currentStore?.settings.stripeSecretKey || globalStripeConfig.secretKey;

      if (secretKey && secretKey.startsWith('sk_') && product?.stripeProductId && (updates.title || updates.description)) {
          const body = new URLSearchParams();
          if(updates.title) body.append('name', updates.title);
          if(updates.description) body.append('description', updates.description.substring(0, 500));
          
          fetch(`https://api.stripe.com/v1/products/${product.stripeProductId}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
              body: body
          }).catch(err => console.error("Failed to update Stripe product", err));
      }

      notify("Product updated.");
  };

  const deleteProduct = async (id: string) => {
      updateStoreState(store => ({
          ...store,
          products: store.products.filter(p => p.id !== id)
      }));
      notify("Product deleted.");
  };

  const addSection = (type: SectionType, initialContent: any = {}) => {
      const newSection: ProfileSection = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          isVisible: true,
          content: { ...getDefaultContentForType(type), ...initialContent }
      };
      updateStoreState(store => ({
          ...store,
          sections: [...(store.sections || []), newSection]
      }));
      notify(`Added ${type} block`);
  };

  const removeSection = (id: string) => {
      updateStoreState(store => ({
          ...store,
          sections: store.sections.filter(s => s.id !== id)
      }));
  };

  const updateSection = (id: string, content: any) => {
      updateStoreState(store => ({
          ...store,
          sections: store.sections.map(s => s.id === id ? { ...s, content: { ...s.content, ...content } } : s)
      }));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
      updateStoreState(store => {
          const idx = store.sections.findIndex(s => s.id === id);
          if (idx === -1) return store;
          const newSections = [...store.sections];
          const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (targetIdx >= 0 && targetIdx < newSections.length) {
              [newSections[idx], newSections[targetIdx]] = [newSections[targetIdx], newSections[idx]];
              return { ...store, sections: newSections };
          }
          return store;
      });
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
      updateStoreState(store => ({
          ...store,
          settings: { ...store.settings, ...newSettings }
      }));
      notify("Settings saved.");
  };

  const fulfillOrder = (orderId: string, trackingNumber: string, carrier: string) => {
      updateStoreState(store => ({
          ...store,
          orders: store.orders.map(o => o.id === orderId ? { ...o, status: 'fulfilled', trackingNumber, carrier } : o),
          liveFeed: [{ 
              id: Date.now().toString(), 
              type: 'fulfillment', 
              message: `Order ${orderId} Shipped via ${carrier}`, 
              timestamp: 'Just now' 
          } as LiveActivityItem, ...store.liveFeed].slice(0, 20)
      }));
      notify(`Order ${orderId} marked as fulfilled.`);
  };

  const addDiscount = (code: string, percentage: number) => {
      const newDiscount: Discount = {
          id: Math.random().toString(36).substr(2, 9),
          code,
          percentage,
          uses: 0,
          active: true
      };
      updateStoreState(store => ({
          ...store,
          discounts: [...(store.discounts || []), newDiscount]
      }));
      notify(`Discount ${code} created.`);
  };

  const toggleDiscount = (id: string) => {
      updateStoreState(store => ({
          ...store,
          discounts: (store.discounts || []).map(d => d.id === id ? { ...d, active: !d.active } : d)
      }));
  };

  const addToCart = (product: Product, answers?: Record<string, string>, variant?: any) => {
    const stock = variant ? variant.inventory : product.inventory;
    const isDigital = product.productType === 'digital' || product.productType === 'service';
    if (!isDigital && stock <= 0) {
        notify("Product out of stock", "error");
        return;
    }
    setCart(prev => {
      const uniqueCartId = product.id + (variant ? `-${variant.id}` : '') + (answers ? JSON.stringify(answers) : '');
      const existing = prev.find(item => {
          const itemId = item.id + (item.selectedVariant ? `-${item.selectedVariant.id}` : '') + (item.answers ? JSON.stringify(item.answers) : '');
          return itemId === uniqueCartId;
      });
      if (existing) {
        if (!isDigital && existing.quantity >= stock) {
            notify(`Only ${stock} available`, "error");
            return prev;
        }
        return prev.map(item => {
             const itemId = item.id + (item.selectedVariant ? `-${item.selectedVariant.id}` : '') + (item.answers ? JSON.stringify(item.answers) : '');
             return itemId === uniqueCartId ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }
      return [...prev, { ...product, quantity: 1, answers, selectedVariant: variant }];
    });
    setIsCartOpen(true);
    notify("Added to bag");
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const createOrder = async (customer: Customer): Promise<boolean> => {
      if (cart.length === 0) return false;
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const costOfGoods = cart.reduce((acc, item) => acc + ((item.costPerItem || 0) * item.quantity), 0);
      const tax = subtotal * (settings.taxRate || 0.08);
      const total = subtotal + tax;
      const profit = (subtotal - costOfGoods);

      const transactionId = `ord_${Math.random().toString(36).substr(2, 9)}`;
      const newOrder: Order = {
          id: `#${1000 + orders.length + 1}`,
          customer,
          items: [...cart],
          subtotal,
          tax,
          total,
          cost: costOfGoods,
          date: new Date().toISOString(),
          status: 'unfulfilled', 
          paymentMethod: 'Credit Card',
          transactionId, 
      };

      updateStoreState(store => {
          const newSalesData = [...store.salesData];
          const todayIndex = newSalesData.length - 1; 
          if (todayIndex >= 0) {
              newSalesData[todayIndex] = {
                  ...newSalesData[todayIndex],
                  sales: newSalesData[todayIndex].sales + total,
                  profit: newSalesData[todayIndex].profit + profit,
                  visitors: newSalesData[todayIndex].visitors + 1,
              };
          }
          const activities: LiveActivityItem[] = [];
          activities.push({
              id: Math.random().toString(36).substr(2, 9),
              type: 'order',
              message: `New Order from ${customer.name}`,
              timestamp: 'Just now',
              amount: total,
              customerLocation: `${customer.city}, ${customer.country}`
          });
          const newFeed = [...activities, ...(store.liveFeed || [])].slice(0, 20);
          return {
              ...store,
              orders: [newOrder, ...store.orders],
              payoutBalance: (store.payoutBalance || 0) + total,
              salesData: newSalesData,
              liveFeed: newFeed
          };
      });
      setCart([]);
      return true;
  };

  return (
    <StoreContext.Provider value={{
      stores,
      activeStoreId,
      createStore,
      switchStore,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      orders,
      payoutBalance,
      fulfillOrder,
      discounts,
      addDiscount,
      toggleDiscount,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      createOrder,
      isCartOpen,
      setIsCartOpen,
      settings,
      updateSettings,
      sections,
      addSection,
      removeSection,
      updateSection,
      moveSection,
      notifications,
      notify,
      dismissNotification,
      salesData,
      liveFeed,
      globalStripeConfig,
      updateGlobalStripe,
      brandIdentity,
      updateBrandIdentity,
      campaigns,
      addCampaign,
      reviews,
      replyToReview,
      marketingStats,
      updateMarketingStats
    }}>
      {children}
    </StoreContext.Provider>
  );
};

function getDefaultContentForType(type: SectionType): any {
    switch(type) {
        case 'hero': return { headline: "Your Headline Here", subheadline: "Describe your value proposition.", layout: 'center' };
        case 'text': return { text: "Write something engaging about your brand here." };
        case 'links': return { links: [{ id: '1', label: 'New Link', url: '#', style: 'solid' }] };
        case 'image': return { url: "https://via.placeholder.com/800x400", caption: "" };
        case 'video': return { url: "", caption: "" };
        case 'products': return { title: "Featured Products" };
        case 'featured-product': return { productId: "", layout: 'split' };
        case 'testimonial': return { quote: "Share a customer review here.", author: "Customer Name", rating: 5 };
        case 'newsletter': return { title: "Join the Club", subtitle: "Get exclusive offers." };
        case 'countdown': return { title: "Next Drop In", targetDate: new Date(Date.now() + 86400000).toISOString() };
        case 'faq': return { title: "Common Questions", items: [{ question: "Shipping policy?", answer: "We ship worldwide." }] };
        case 'gallery': return { images: ["https://via.placeholder.com/300", "https://via.placeholder.com/300"] };
        case 'contact': return { title: "Get in Touch", email: "support@brand.com" };
        
        // New Blocks Defaults
        case 'video-hero': return { videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", headline: "Cinematic Experience", subheadline: "Watch our story unfold." };
        case 'features': return { title: "Why Choose Us", items: [{ title: "Fast Shipping", desc: "2-day delivery" }, { title: "Secure", desc: "Encrypted payments" }, { title: "Support", desc: "24/7 assistance" }] };
        case 'story': return { title: "Our Origins", text: "It started with a simple idea...", imageUrl: "https://via.placeholder.com/600x400", layout: 'image-left' };
        case 'map': return { address: "123 Commerce St, New York, NY", title: "Visit Our Flagship" };
        case 'pricing': return { title: "Plans", plans: [{ name: "Starter", price: "$0", features: ["Basic access"] }, { name: "Pro", price: "$29", features: ["Full access", "Priority support"] }] };
        case 'stats': return { items: [{ label: "Happy Customers", value: "10k+" }, { label: "Years", value: "5+" }, { label: "Products", value: "500+" }] };
        case 'partners': return { title: "Trusted By", logos: ["https://via.placeholder.com/100x50", "https://via.placeholder.com/100x50", "https://via.placeholder.com/100x50"] };
        case 'collections': return { title: "Shop by Category", collections: [{ name: "Summer", image: "https://via.placeholder.com/300" }, { name: "Winter", image: "https://via.placeholder.com/300" }] };
        case 'banner': return { text: "Free shipping on orders over $50!", backgroundColor: "#000000", textColor: "#ffffff" };
        case 'instagram': return { title: "@MyBrand", images: ["https://via.placeholder.com/200", "https://via.placeholder.com/200", "https://via.placeholder.com/200", "https://via.placeholder.com/200"] };
        
        default: return {};
    }
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};
