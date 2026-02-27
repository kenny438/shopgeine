
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Icons, Button, Card, Badge, Toggle, Input } from '../components/UI';
import { Store } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const ZCloudPage = () => {
    const { stores, createStore, switchStore, notify, globalStripeConfig, updateGlobalStripe } = useStore();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'empire' | 'universe' | 'system'>('empire');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreCategory, setNewStoreCategory] = useState('General');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [stripeVerifying, setStripeVerifying] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // System Config State (Local UI state for inputs)
    const [sysConfig, setSysConfig] = useState({
        twoFactor: true,
        emailAlerts: true,
        aiCreativity: 0.7,
        apiKeyStripePublic: globalStripeConfig.publicKey || '',
        apiKeyStripeSecret: globalStripeConfig.secretKey || '',
        webhookUrl: 'https://api.zcloud.os/hooks/v1/dispatch'
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Aggregated Stats
    const totalRevenue = stores.reduce((acc, store) => acc + store.salesData.reduce((s, d) => s + d.sales, 0), 0);
    const totalVisitors = stores.reduce((acc, store) => acc + store.salesData.reduce((s, d) => s + d.visitors, 0), 0);
    const activeAlerts = stores.filter(s => !s.settings.stripeConnected).length; 

    // Generate combined chart data
    const combinedChartData = useMemo(() => {
        if (stores.length === 0) return [];
        const dateMap: Record<string, number> = {};
        stores.forEach(store => {
            store.salesData.forEach(data => {
                dateMap[data.date] = (dateMap[data.date] || 0) + data.sales;
            });
        });
        return Object.entries(dateMap).map(([date, sales]) => ({ date, sales })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [stores]);

    // Aggregate live feed
    const globalLiveFeed = useMemo(() => {
        return stores
            .flatMap(s => s.liveFeed.map(f => ({...f, storeName: s.settings.name})))
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }, [stores]);

    const handleEnterStore = (storeId: string) => {
        switchStore(storeId);
        navigate('/admin');
    };

    const handleCreateStore = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newStoreName) return;
        createStore(newStoreName, newStoreCategory);
        setShowCreateModal(false);
        setNewStoreName('');
    };

    const handleSyncNetwork = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            notify("Network synchronized successfully.", "success");
        }, 1500);
    };

    const saveStripeConfig = async () => {
        setStripeVerifying(true);
        if (!sysConfig.apiKeyStripeSecret.startsWith('sk_')) {
            notify("Invalid Secret Key format. Must start with 'sk_'.", "error");
            setStripeVerifying(false);
            return;
        }

        try {
            // Verify by making a real (lightweight) call to Stripe API
            const response = await fetch('https://api.stripe.com/v1/account', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sysConfig.apiKeyStripeSecret}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const accountData = await response.json();
                updateGlobalStripe(sysConfig.apiKeyStripePublic, sysConfig.apiKeyStripeSecret);
                notify(`Connected to Stripe Account: ${accountData.email || accountData.id}`, "success");
            } else {
                const errorData = await response.json();
                notify(`Stripe Connection Failed: ${errorData.error?.message}`, "error");
            }
        } catch (error) {
            notify("Network error connecting to Stripe.", "error");
        } finally {
            setStripeVerifying(false);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // System Components
    const SystemCard = ({ title, icon: Icon, children, className }: any) => (
        <div className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${className || ''}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-900">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
            </div>
            {children}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans overflow-x-hidden relative selection:bg-black selection:text-white" onClick={() => setMenuOpenId(null)}>
            
            {/* Soft Ambient Background (Light Mode Aurora) */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-30%] left-[-10%] w-[70vw] h-[70vw] bg-purple-200/40 rounded-full blur-[120px] mix-blend-multiply animate-float"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[20%] right-[30%] w-[40vw] h-[40vw] bg-pink-200/30 rounded-full blur-[100px] mix-blend-multiply animate-float" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                            <Icons.Cloud className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-gray-900">ZCloud <span className="text-gray-400 font-normal">OS</span></span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100/50 px-3 py-1.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            <span>Network Stable</span>
                        </div>
                        <div className="h-6 w-[1px] bg-gray-200"></div>
                        <button onClick={() => signOut()} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Sign Out</button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 border border-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-700">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                
                {/* Header Section */}
                <div className="mb-12 animate-slide-up">
                    <p className="text-gray-500 font-medium mb-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                            {getGreeting()}, <span className="text-gray-400">Owner.</span>
                        </h1>
                        <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-md rounded-full border border-gray-200/50">
                            {[
                                { id: 'empire', label: 'My Ventures' },
                                { id: 'universe', label: 'Z-Universe' },
                                { id: 'system', label: 'System' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-black text-white shadow-lg' 
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KPI Cards (Only on Empire Tab) */}
                {activeTab === 'empire' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between h-40 group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                                    <Icons.CreditCard className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">${totalRevenue.toLocaleString()}</h3>
                                <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between h-40 group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                                    <Icons.Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{totalVisitors.toLocaleString()}</h3>
                                <p className="text-sm font-medium text-gray-400">Total Traffic</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between h-40 relative overflow-hidden group">
                             {/* Decorative shimmer */}
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                             
                             <div className="flex justify-between items-start relative z-10">
                                <div className="p-2.5 bg-white/10 rounded-xl text-white">
                                    <Icons.Bell className="w-5 h-5" />
                                </div>
                                {activeAlerts > 0 && <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>}
                             </div>
                             <div className="relative z-10">
                                <h3 className="text-3xl font-bold tracking-tight">{stores.length}</h3>
                                <p className="text-sm font-medium text-gray-400">Active Ventures</p>
                             </div>
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                    {activeTab === 'empire' ? (
                        <div>
                            {/* Global Analytics & Live Feed */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-gray-900">Empire Revenue</h3>
                                        <Badge color="blue">Last 7 Days</Badge>
                                    </div>
                                    <div className="flex-1 min-h-[250px] w-full">
                                        {combinedChartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(value) => `$${value}`} />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                                                    />
                                                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data available</div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 shadow-xl text-white relative overflow-hidden flex flex-col h-[350px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                                    <div className="flex justify-between items-center mb-6 relative z-10">
                                        <h3 className="text-lg font-bold">Network Activity</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                            <span className="text-xs text-gray-400 font-mono">LIVE</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 relative z-10 overflow-y-auto flex-1 pr-2 no-scrollbar">
                                        {globalLiveFeed.map((activity, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                <div className={`p-2 rounded-lg ${activity.type === 'order' ? 'bg-green-500/20 text-green-400' : activity.type === 'visitor' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                    {activity.type === 'order' ? <Icons.ShoppingCart className="w-4 h-4" /> : activity.type === 'visitor' ? <Icons.Users className="w-4 h-4" /> : <Icons.Activity className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-200">{activity.message}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{activity.storeName}</span>
                                                        <span className="text-[10px] text-gray-500">•</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {globalLiveFeed.length === 0 && (
                                            <div className="text-center text-gray-500 text-sm mt-10">Awaiting network initialization...</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Your Ventures</h2>
                                <button onClick={handleSyncNetwork} disabled={isSyncing} className="text-sm font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Icons.Activity className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? 'Syncing...' : 'Sync Network'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Create New Card */}
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    className="group h-[280px] rounded-3xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center transition-all duration-300"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
                                        <Icons.Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                                    </div>
                                    <span className="font-bold text-gray-900">Launch New Venture</span>
                                    <span className="text-xs text-gray-500 mt-1">Start a new business entity</span>
                                </button>

                                {stores.map(store => {
                                    const storeRevenue = store.salesData.reduce((acc, curr) => acc + curr.sales, 0);
                                    return (
                                        <div 
                                            key={store.id} 
                                            onClick={() => handleEnterStore(store.id)}
                                            className="group relative h-[280px] bg-white rounded-3xl p-8 cursor-pointer overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 border border-gray-100"
                                        >
                                            {/* Store Options Menu */}
                                            <div className="absolute top-4 right-4 z-20">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === store.id ? null : store.id); }}
                                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                                                >
                                                    <Icons.MoreHorizontal className="w-5 h-5" />
                                                </button>
                                                {menuOpenId === store.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-pop origin-top-right">
                                                        <button className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                                                            <Icons.Settings className="w-4 h-4" /> Deep Settings
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); notify("Cloning initiated..."); setMenuOpenId(null); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                                                            <Icons.Layers className="w-4 h-4" /> Clone Venture
                                                        </button>
                                                        <div className="h-px bg-gray-100"></div>
                                                        <button className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-red-50 text-red-600 flex items-center gap-2">
                                                            <Icons.Trash2 className="w-4 h-4" /> Archive
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative z-10 h-full flex flex-col">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shadow-inner">
                                                        {store.settings.logo && !store.settings.logo.includes('placeholder') ? (
                                                            <img src={store.settings.logo} className="w-full h-full object-cover rounded-2xl" />
                                                        ) : (
                                                            store.settings.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge color="gray">{store.settings.category}</Badge>
                                                        {store.stripeAccountId && (
                                                            <Badge color="purple" className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                                                                Stripe Connected
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-auto">
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{store.settings.name}</h3>
                                                    <p className="text-sm text-gray-400 truncate">{store.settings.country}</p>
                                                </div>

                                                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total Revenue</p>
                                                        <p className="text-xl font-bold text-gray-900 font-mono">${storeRevenue.toLocaleString()}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-lg">
                                                        <Icons.ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : activeTab === 'universe' ? (
                        <div>
                             <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-10 overflow-hidden relative">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
                                 <div className="relative z-10 flex items-start gap-6">
                                     <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <Icons.Globe className="w-8 h-8 text-gray-900" />
                                     </div>
                                     <div>
                                         <h3 className="text-2xl font-bold text-gray-900 mb-2">Global Business Directory</h3>
                                         <p className="text-gray-500 max-w-xl leading-relaxed">
                                             Explore the Z-Universe. A curated list of top-performing businesses built on the ZCloud operating system. 
                                             Connect, partner, or acquire.
                                         </p>
                                     </div>
                                 </div>
                            </div>

                            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <Icons.Search className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No other ventures found</h3>
                                <p className="text-gray-500 max-w-xs mx-auto">The directory is currently empty. Be the first to scale!</p>
                            </div>
                        </div>
                    ) : (
                        // SYSTEM CONFIGURATION TAB
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
                            
                            {/* Left Column */}
                            <div className="space-y-6">
                                <SystemCard title="Z-ID Identity" icon={Icons.Users}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{user?.email?.split('@')[0]}</h4>
                                            <p className="text-sm text-gray-500">{user?.email}</p>
                                        </div>
                                        <button className="ml-auto text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">Edit Profile</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Role</p>
                                            <p className="font-bold">Owner / Admin</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Member Since</p>
                                            <p className="font-bold">Oct 2023</p>
                                        </div>
                                    </div>
                                </SystemCard>

                                <SystemCard title="Security" icon={Icons.Shield}>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <div>
                                                <p className="font-bold text-sm">Two-Factor Authentication</p>
                                                <p className="text-xs text-gray-500">Secure your account with 2FA.</p>
                                            </div>
                                            <Toggle checked={sysConfig.twoFactor} onChange={v => setSysConfig({...sysConfig, twoFactor: v})} />
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <div>
                                                <p className="font-bold text-sm">Email Alerts</p>
                                                <p className="text-xs text-gray-500">Receive security notifications.</p>
                                            </div>
                                            <Toggle checked={sysConfig.emailAlerts} onChange={v => setSysConfig({...sysConfig, emailAlerts: v})} />
                                        </div>
                                        <div className="border-t border-gray-100 pt-4 mt-2">
                                            <button className="text-sm font-bold text-red-600 hover:text-red-700">Sign out of all devices</button>
                                        </div>
                                    </div>
                                </SystemCard>

                                <SystemCard title="Neural Engine" icon={Icons.Sparkles}>
                                    <div className="space-y-4">
                                         <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-xs font-bold uppercase text-gray-500">AI Creativity Level</label>
                                                <span className="text-xs font-bold text-blue-600">{(sysConfig.aiCreativity * 100).toFixed(0)}%</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" max="1" step="0.1"
                                                value={sysConfig.aiCreativity}
                                                onChange={(e) => setSysConfig({...sysConfig, aiCreativity: parseFloat(e.target.value)})}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                            />
                                            <p className="text-xs text-gray-400 mt-2">Adjusts how inventive the AI is when generating product descriptions and ad copy.</p>
                                         </div>
                                    </div>
                                </SystemCard>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div className="bg-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/2"></div>
                                     <div className="relative z-10">
                                         <div className="flex justify-between items-start mb-8">
                                             <div>
                                                 <p className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-1">Current Plan</p>
                                                 <h3 className="text-3xl font-bold">ZCloud Infinite</h3>
                                             </div>
                                             <div className="px-3 py-1 rounded-full border border-white/20 bg-white/10 text-xs font-bold">
                                                 Active
                                             </div>
                                         </div>
                                         
                                         <div className="space-y-4 mb-8">
                                             <div>
                                                 <div className="flex justify-between text-xs font-bold mb-2">
                                                     <span>Storage</span>
                                                     <span>45% Used</span>
                                                 </div>
                                                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                     <div className="h-full bg-blue-500 w-[45%] rounded-full"></div>
                                                 </div>
                                             </div>
                                             <div>
                                                 <div className="flex justify-between text-xs font-bold mb-2">
                                                     <span>API Calls</span>
                                                     <span>12% Used</span>
                                                 </div>
                                                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                     <div className="h-full bg-purple-500 w-[12%] rounded-full"></div>
                                                 </div>
                                             </div>
                                         </div>

                                         <div className="flex gap-3">
                                             <button className="flex-1 py-3 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors">Manage Subscription</button>
                                             <button className="flex-1 py-3 bg-white/10 text-white border border-white/10 font-bold rounded-xl text-sm hover:bg-white/20 transition-colors">View Invoices</button>
                                         </div>
                                     </div>
                                </div>

                                <SystemCard title="Global Integrations" icon={Icons.Key}>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 leading-relaxed mb-2">
                                            Adding keys here will act as a <strong>Platform</strong>. Any store created will be provisioned as a "Connected Account" under these credentials.
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Stripe Publishable Key</label>
                                            <div className="relative">
                                                <Input 
                                                    value={sysConfig.apiKeyStripePublic}
                                                    onChange={e => setSysConfig({...sysConfig, apiKeyStripePublic: e.target.value})}
                                                    placeholder="pk_live_..."
                                                    className="pr-10 bg-white border-gray-200" 
                                                />
                                                <Icons.Eye className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 cursor-pointer" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Stripe Secret Key (Platform)</label>
                                            <div className="relative">
                                                <Input 
                                                    type="password" 
                                                    value={sysConfig.apiKeyStripeSecret} 
                                                    onChange={e => setSysConfig({...sysConfig, apiKeyStripeSecret: e.target.value})}
                                                    placeholder="sk_live_..."
                                                    className="pr-10 bg-white border-gray-200" 
                                                />
                                                <Icons.Key className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={saveStripeConfig}
                                            disabled={stripeVerifying}
                                            className="w-full mt-2 py-3 bg-black text-white font-bold rounded-xl text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                                        >
                                            {stripeVerifying ? 'Verifying Platform Keys...' : 'Connect to Stripe Platform'}
                                        </button>
                                    </div>
                                </SystemCard>

                                <SystemCard title="Developer Console" icon={Icons.Activity}>
                                     <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-gray-500 block mb-1.5">Global Webhook URL</label>
                                            <Input value={sysConfig.webhookUrl} readOnly className="bg-gray-50 border-transparent font-mono text-xs" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="text-xs font-bold bg-black text-white px-3 py-2 rounded-lg">Regenerate Token</button>
                                            <button className="text-xs font-bold bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">API Docs</button>
                                        </div>
                                     </div>
                                </SystemCard>
                                
                                <div className="p-6 rounded-3xl border border-red-100 bg-red-50/50">
                                    <h3 className="font-bold text-red-900 mb-2">Danger Zone</h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-red-700">Pause all business operations instantly.</p>
                                        <button className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg text-xs hover:bg-red-50">Pause All</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreateModal(false)} />
                    <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 md:p-10 relative shadow-2xl animate-pop border border-white">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"><Icons.X className="w-5 h-5"/></button>
                        
                        <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-xl shadow-black/10">
                            <Icons.Rocket className="w-7 h-7" />
                        </div>
                        
                        <h2 className="text-3xl font-bold mb-2 text-gray-900 tracking-tight">Launch Venture</h2>
                        <p className="text-gray-500 mb-8">Initialize a new business entity in the ZCloud OS.</p>
                        
                        <form onSubmit={handleCreateStore} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2 ml-1">Venture Name</label>
                                <input 
                                    autoFocus
                                    value={newStoreName}
                                    onChange={e => setNewStoreName(e.target.value)}
                                    placeholder="e.g. Cyber Dynamics"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none transition-all font-medium text-lg"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2 ml-1">Sector</label>
                                <div className="relative">
                                    <select 
                                        value={newStoreCategory}
                                        onChange={e => setNewStoreCategory(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-xl px-5 py-4 text-gray-900 focus:outline-none transition-all appearance-none font-medium"
                                    >
                                        <option value="General">General Trade</option>
                                        <option value="Tech">Advanced Tech</option>
                                        <option value="Fashion">Fashion & Apparel</option>
                                        <option value="Services">Services</option>
                                    </select>
                                    <Icons.ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-4 bg-black text-white font-bold rounded-xl mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                            >
                                <Icons.Zap className="w-4 h-4" />
                                Initialize Venture
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
