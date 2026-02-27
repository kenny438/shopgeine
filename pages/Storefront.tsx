
import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Product, ProductVariant, Customer, ProfileSection } from '../types';
import { Icons, Button, Badge, Input, Card, TextArea } from '../components/UI';
import { useParams, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { cart, setIsCartOpen, settings, notify } = useStore();
  // Safe reduce in case cart is undefined
  const itemCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    } else {
        notify(`Section ${id} not found`, "info");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"></div>
      <div className="relative max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {settings.logo && !settings.logo.includes('placeholder') ? (
                <img src={settings.logo} className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">{settings.name.charAt(0)}</div>
            )}
            <span className="font-bold text-xl md:text-2xl tracking-tight text-gray-900 group-hover:opacity-80 transition-opacity">{settings.name}</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-black transition-colors">Home</button>
            <button onClick={() => scrollToSection('products-grid')} className="hover:text-black transition-colors">Catalog</button>
            <button onClick={() => scrollToSection('footer-section')} className="hover:text-black transition-colors">About</button>
        </div>

        <div className="flex items-center gap-6">
            <button 
              className="relative group p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 duration-200"
              onClick={() => setIsCartOpen(true)}
            >
              <Icons.ShoppingCart className="w-6 h-6 text-gray-800 group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span 
                    className="absolute top-0 right-0 w-5 h-5 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md animate-pop"
                    style={{ backgroundColor: settings.primaryColor }}
                >
                  {itemCount}
                </span>
              )}
            </button>
        </div>
      </div>
    </nav>
  );
};

const CartOverlay = () => {
  const { isCartOpen, setIsCartOpen, cart, removeFromCart, settings, createOrder, notify } = useStore();
  const [mode, setMode] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [loading, setLoading] = useState(false);
  const [stripeProcessing, setStripeProcessing] = useState(false);
  
  // Checkout State
  const [customer, setCustomer] = useState<Customer>({
      name: '', email: '', address: '', city: '', zip: '', country: ''
  });
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const safeCart = cart || [];
  const subtotal = safeCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  useEffect(() => {
      if (!isCartOpen) {
          setTimeout(() => setMode('cart'), 300);
      }
  }, [isCartOpen]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!customer.name || !customer.email || !customer.address || !cardNumber) {
          notify("Please fill in all fields", "error");
          return;
      }
      setLoading(true);
      if (settings.stripeConnected) {
          setStripeProcessing(true);
      }
      // Simulate network request to Stripe
      await new Promise(resolve => setTimeout(resolve, settings.stripeConnected ? 3000 : 1500));
      const success = await createOrder(customer);
      setLoading(false);
      setStripeProcessing(false);
      if (success) {
          setMode('success');
      }
  };

  if (!isCartOpen) return null;

  // Helper for dynamic styles
  const btnRadius = settings.buttonStyle === 'pill' ? '9999px' : settings.buttonStyle === 'square' ? '0px' : settings.borderRadius;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <h2 className="text-xl font-bold">
                {mode === 'cart' ? 'Your Bag' : mode === 'checkout' ? 'Checkout' : 'Order Confirmed'}
            </h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded-full"><Icons.X className="w-6 h-6" /></button>
         </div>

         {mode === 'cart' && (
             <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {safeCart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                            <Icons.ShoppingCart className="w-12 h-12 opacity-20" />
                            <p>Your shopping bag is empty.</p>
                            <Button variant="secondary" onClick={() => setIsCartOpen(false)} style={{ borderRadius: btnRadius }}>Start Shopping</Button>
                        </div>
                    ) : (
                        safeCart.map((item, idx) => (
                            <div key={idx} className="flex gap-4 group">
                                <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 relative">
                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                                            <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Icons.X className="w-4 h-4" /></button>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-md text-gray-600">Qty: {item.quantity}</span>
                                        {item.productType === 'digital' && <Badge color="blue">Digital</Badge>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {safeCart.length > 0 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xl font-bold mb-6"><span>Total</span><span>${total.toFixed(2)}</span></div>
                        <Button 
                            onClick={() => setMode('checkout')}
                            variant="primary"
                            className="w-full py-4 text-sm uppercase tracking-widest"
                            style={{ backgroundColor: settings.primaryColor, borderRadius: btnRadius }}
                        >
                            Checkout <Icons.ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
             </>
         )}

         {mode === 'checkout' && (
             <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col h-full bg-gray-50">
                 <div className="flex-1 overflow-y-auto p-6 space-y-6">
                     <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                         <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">Shipping</h3>
                         <Input placeholder="Full Name" required value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                         <Input placeholder="Email" type="email" required value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
                         <Input placeholder="Address" required value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
                         <div className="grid grid-cols-2 gap-3">
                             <Input placeholder="City" required value={customer.city} onChange={e => setCustomer({...customer, city: e.target.value})} />
                             <Input placeholder="Zip" required value={customer.zip} onChange={e => setCustomer({...customer, zip: e.target.value})} />
                         </div>
                     </div>

                     <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                         <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">Payment</h3>
                         <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                             <div className="flex justify-between items-center mb-2">
                                <Icons.CreditCard className="w-5 h-5 text-gray-400" />
                                {settings.stripeConnected && (
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Icons.Shield className="w-3 h-3" /> Stripe Secure
                                    </span>
                                )}
                             </div>
                             <Input placeholder="Card Number" maxLength={19} required value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="mb-3 bg-white border-transparent focus:border-shop-primary" />
                             <div className="grid grid-cols-2 gap-3">
                                 <Input placeholder="MM/YY" maxLength={5} required value={expiry} onChange={e => setExpiry(e.target.value)} className="bg-white border-transparent" />
                                 <Input placeholder="CVC" maxLength={3} required type="password" value={cvc} onChange={e => setCvc(e.target.value)} className="bg-white border-transparent" />
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between font-bold text-lg mb-4"><span>Total</span><span>${total.toFixed(2)}</span></div>
                    <div className="flex gap-3">
                         <Button type="button" variant="secondary" onClick={() => setMode('cart')} className="flex-1" style={{ borderRadius: btnRadius }}>Back</Button>
                         <Button 
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            className="flex-[2] text-sm uppercase tracking-widest"
                            style={{ backgroundColor: settings.primaryColor, borderRadius: btnRadius }}
                        >
                            {loading ? (stripeProcessing ? 'Contacting Stripe...' : 'Processing...') : `Pay $${total.toFixed(2)}`}
                        </Button>
                    </div>
                 </div>
             </form>
         )}

         {mode === 'success' && (
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in p-8">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 animate-slide-up">
                     <Icons.Check className="w-10 h-10" />
                 </div>
                 <h3 className="text-2xl font-bold mb-2">Order Confirmed</h3>
                 <p className="text-gray-500 mb-8 max-w-xs">Thank you, {customer.name}. We've received your order and sent a confirmation email.</p>
                 <Button onClick={() => { setIsCartOpen(false); setMode('cart'); }} variant="black" className="w-full h-12 text-sm" style={{ borderRadius: btnRadius }}>
                     Continue Shopping
                 </Button>
             </div>
         )}
      </div>
    </div>
  );
};

const AddToCartButton = ({ product }: { product: Product }) => {
    const { addToCart, settings } = useStore();
    return (
        <Button 
           onClick={() => addToCart(product)} 
           disabled={product.inventory <= 0}
           className="w-full md:w-auto px-8 py-3 text-sm uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
           style={{ 
               backgroundColor: settings.primaryColor,
               borderRadius: settings.borderRadius === '9999px' ? '9999px' : settings.borderRadius
           }}
        >
            {product.inventory > 0 ? 'Add to Cart' : 'Sold Out'}
        </Button>
    );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const { settings, addToCart } = useStore();
    return (
        <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                {product.inventory <= 0 && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">Sold Out</span>
                    </div>
                )}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        Sale
                    </span>
                )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{product.description}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-lg font-bold" style={{ color: settings.primaryColor }}>${product.price.toFixed(2)}</span>
                    <button 
                        onClick={() => addToCart(product)}
                        disabled={product.inventory <= 0}
                        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-gray-900"
                    >
                        <Icons.ShoppingCart className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const StorefrontPage = () => {
    const { settings, sections, products } = useStore();

    const renderSection = (section: ProfileSection) => {
        if (!section.isVisible) return null;
        const { type, content, id } = section;
        const { textColor, primaryColor, borderRadius } = settings;

        switch (type) {
             case 'hero':
                return (
                    <section key={id} className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
                        {content.avatar ? (
                            <>
                                <img src={content.avatar} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40"></div>
                                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto text-white">
                                    <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">{content.headline}</h1>
                                    <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">{content.subheadline}</p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center px-6 max-w-4xl mx-auto py-20">
                                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight" style={{ color: textColor }}>{content.headline}</h1>
                                <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto" style={{ color: textColor }}>{content.subheadline}</p>
                            </div>
                        )}
                    </section>
                );
            case 'text':
                return (
                    <section key={id} className="py-16 px-6">
                        <div className="max-w-3xl mx-auto text-center">
                            <p className="text-lg leading-relaxed whitespace-pre-wrap" style={{ color: textColor }}>{content.text}</p>
                        </div>
                    </section>
                );
            case 'products':
                return (
                    <section key={id} id="products-grid" className="py-16 px-6 bg-gray-50/50">
                        <div className="max-w-7xl mx-auto">
                            {content.title && <h2 className="text-3xl font-bold mb-10 text-center" style={{ color: textColor }}>{content.title}</h2>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {products.map((product: Product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                                {products.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No products available.</div>}
                            </div>
                        </div>
                    </section>
                );
            case 'featured-product':
                 const fProduct = products.find(p => p.id === content.productId);
                 if (!fProduct) return null;
                 return (
                     <section key={id} className="py-16 px-6">
                         <div className="max-w-6xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col md:flex-row">
                             <div className="md:w-1/2 h-96 md:h-auto bg-gray-100 relative">
                                 <img src={fProduct.image} className="w-full h-full object-cover" />
                             </div>
                             <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-start">
                                 <Badge color="green" className="mb-4">Spotlight</Badge>
                                 <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>{fProduct.title}</h2>
                                 <p className="text-gray-500 mb-6 leading-relaxed line-clamp-4">{fProduct.description}</p>
                                 <div className="text-2xl font-bold mb-8" style={{ color: primaryColor }}>${fProduct.price.toFixed(2)}</div>
                                 <AddToCartButton product={fProduct} />
                             </div>
                         </div>
                     </section>
                 );
            case 'links':
                return (
                    <section key={id} className="py-12 px-6">
                        <div className="max-w-md mx-auto space-y-4">
                            {content.links?.map((link: any) => (
                                <a 
                                    key={link.id} 
                                    href={link.url}
                                    className="block w-full text-center py-4 px-6 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md border border-gray-200/50"
                                    style={{ backgroundColor: primaryColor, color: '#fff', borderRadius }}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </section>
                );
            case 'image':
                return (
                    <section key={id} className="py-12 px-6">
                        <div className="max-w-5xl mx-auto">
                            <img src={content.url} alt={content.caption} className="w-full h-auto rounded-2xl shadow-lg" style={{ borderRadius }} />
                            {content.caption && <p className="text-center text-sm text-gray-500 mt-4">{content.caption}</p>}
                        </div>
                    </section>
                );
            case 'testimonial':
                return (
                    <section key={id} className="py-20 px-6 bg-gray-900 text-white">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="mb-8 text-yellow-400 flex justify-center gap-1">
                                {[1,2,3,4,5].map(i => <Icons.Star key={i} className="w-6 h-6 fill-current" />)}
                            </div>
                            <blockquote className="text-2xl md:text-4xl font-serif italic mb-8">"{content.quote}"</blockquote>
                            <cite className="not-italic font-bold tracking-widest uppercase text-sm opacity-70">— {content.author}</cite>
                        </div>
                    </section>
                );
            case 'newsletter':
                 return (
                     <section key={id} className="py-20 px-6">
                         <div className="max-w-2xl mx-auto text-center p-10 bg-gray-50 rounded-3xl border border-gray-100">
                             <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>{content.title}</h2>
                             <p className="text-gray-500 mb-6">{content.subtitle}</p>
                             <div className="flex gap-2 max-w-md mx-auto">
                                 <Input placeholder="Your email" className="bg-white" />
                                 <Button variant="black">Subscribe</Button>
                             </div>
                         </div>
                     </section>
                 );
            case 'faq':
                return (
                    <section key={id} className="py-16 px-6">
                         <div className="max-w-3xl mx-auto">
                             <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: textColor }}>{content.title}</h2>
                             <div className="space-y-4">
                                 {content.items?.map((item: any, i: number) => (
                                     <div key={i} className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                                         <h4 className="font-bold text-lg mb-2" style={{ color: textColor }}>{item.question}</h4>
                                         <p className="text-gray-600">{item.answer}</p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    </section>
                );
            case 'gallery':
                return (
                    <section key={id} className="py-12 px-6">
                         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                             {content.images?.map((img: string, i: number) => (
                                 <div key={i} className="aspect-square rounded-xl overflow-hidden group relative">
                                     <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                 </div>
                             ))}
                         </div>
                    </section>
                );
            case 'contact':
                return (
                    <section key={id} className="py-20 px-6 bg-gray-50">
                        <div className="max-w-md mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-6" style={{ color: textColor }}>{content.title}</h2>
                            <form className="space-y-4 text-left">
                                <Input placeholder="Name" className="bg-white" />
                                <Input placeholder="Email" type="email" className="bg-white" />
                                <TextArea placeholder="Message" className="bg-white" />
                                <Button className="w-full py-3" style={{ backgroundColor: primaryColor, borderRadius }}>Send Message</Button>
                            </form>
                            <p className="text-xs text-gray-400 mt-6">Or email us at {content.email}</p>
                        </div>
                    </section>
                );
            default: return null;
        }
    };

    return (
        <div 
            className="min-h-screen bg-white font-sans"
            style={{ 
                fontFamily: settings.fontFamily, 
                backgroundColor: settings.backgroundColor,
                color: settings.textColor
            }}
        >
            <Navbar />
            <CartOverlay />
            <main className="pt-20">
                {sections.map(renderSection)}
            </main>
            <footer id="footer-section" className="py-12 px-6 border-t border-gray-100 mt-12 bg-gray-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h4 className="font-bold text-lg mb-2">{settings.name}</h4>
                        <p className="text-sm text-gray-500 max-w-xs">{settings.bio}</p>
                    </div>
                    <div className="flex gap-4">
                        {settings.socialLinks?.map((link, i) => (
                            <a key={i} href={link.url} className="text-gray-400 hover:text-gray-900 transition-colors">{link.platform}</a>
                        ))}
                    </div>
                    {settings.showPoweredBy && (
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            Powered by <span className="font-bold text-gray-600">ShopGenie</span>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
};
