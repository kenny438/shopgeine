
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Icons, Button } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';

const BUSINESS_TYPES = [
    { id: 'fashion', label: 'Fashion', icon: '👕' },
    { id: 'saas', label: 'Software', icon: '💻' },
    { id: 'digital', label: 'Digital', icon: '📂' },
    { id: 'beauty', label: 'Beauty', icon: '✨' },
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'electronics', label: 'Tech', icon: '⚡' },
    { id: 'food', label: 'Food', icon: '☕' },
    { id: 'art', label: 'Art', icon: '🎨' }
];

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Onboarding State
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('Beginner');

  const navigate = useNavigate();
  const { createStore } = useStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Check if stores exist, if not create default? Logic handled in context usually, but for now just redirect
        // createStore("My Store", "General"); // Don't auto-create on login if persistent
        navigate('/zcloud');
    } catch (error: any) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 1) {
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setStep(2);
    } else if (step === 2) {
        if (!storeName) {
            setError("Please enter a store name.");
            return;
        }
        if (!category) {
            setError("Please select a business type.");
            return;
        }
        setStep(3);
    }
  };

  const handleSignUpComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
                store_name: storeName,
                category,
                age,
                experience
            }
          }
        });
        
        if (error) throw error;
        createStore(storeName, category);
        
        if (data.session) {
            navigate('/zcloud');
        } else {
            alert("Account created successfully! Please check your email.");
            setIsSignUp(false);
            setStep(1);
            navigate('/login');
        }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Components ---

  const MinimalInput = ({ label, type = "text", value, onChange, placeholder, autoFocus }: any) => (
    <div className="mb-4 group">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
        <div className="relative">
            <input 
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 text-gray-900 text-sm transition-all duration-200"
            />
        </div>
    </div>
  );

  // --- Render Steps ---

  const renderFormContent = () => {
    if (!isSignUp) {
        return (
            <div className="animate-fade-in">
                <MinimalInput label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-1.5 ml-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                        <a href="#" className="text-[10px] font-bold text-gray-900 hover:text-gray-600 transition-colors">Forgot?</a>
                    </div>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 text-gray-900 text-sm transition-all duration-200"
                    />
                </div>

                <div className="flex items-center mb-6 ml-1">
                    <input 
                        id="remember-me" 
                        name="remember-me" 
                        type="checkbox" 
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer" 
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-gray-600 cursor-pointer select-none">
                        Keep me signed in
                    </label>
                </div>
            </div>
        );
    }

    if (step === 1) return (
        <div className="animate-fade-in">
             <MinimalInput label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} autoFocus />
             <MinimalInput label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
        </div>
    );

    if (step === 2) return (
        <div className="animate-fade-in space-y-3">
             <MinimalInput label="Store Name" value={storeName} onChange={(e: any) => setStoreName(e.target.value)} autoFocus />
             
             <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Industry</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {BUSINESS_TYPES.map(type => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => setCategory(type.label)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                                category === type.label 
                                ? 'bg-gray-900 text-white shadow-md' 
                                : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:shadow-sm'
                            }`}
                        >
                            <span className="text-base">{type.icon}</span>
                            <span>{type.label}</span>
                        </button>
                    ))}
                </div>
             </div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-3">
            <MinimalInput label="Age" type="number" value={age} onChange={(e: any) => setAge(e.target.value)} />
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Experience</label>
                <div className="space-y-2">
                    {['Just Starting', 'Selling Offline', 'Scaling Online'].map(level => (
                         <button
                            key={level}
                            type="button"
                            onClick={() => setExperience(level)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-left transition-all ${
                                experience === level 
                                ? 'bg-gray-900 text-white shadow-md' 
                                : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:shadow-sm'
                            }`}
                         >
                            {level}
                            {experience === level && <Icons.Check className="w-3 h-3" />}
                         </button>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans flex items-center justify-center bg-[#F5F5F7]">
        
        {/* Animated Ambient Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#F5F5F7]">
             <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full blur-[100px] opacity-40 animate-pulse" style={{animationDuration: '8s'}}></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-l from-purple-100 to-pink-100 rounded-full blur-[120px] opacity-30 animate-pulse" style={{animationDuration: '12s'}}></div>
        </div>

        {/* Card Container */}
        <div className="relative z-10 w-full max-w-[400px] p-4">
            <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/60 p-8 relative overflow-hidden">
                
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black text-white shadow-lg mb-4">
                        <Icons.Package className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {isSignUp 
                            ? (step === 1 ? 'Create account' : step === 2 ? 'Details' : 'About you') 
                            : 'Welcome back'
                        }
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        {isSignUp ? 'Start building your dream store.' : 'Enter your credentials to access.'}
                    </p>
                </div>

                <form onSubmit={isSignUp ? (step === 3 ? handleSignUpComplete : handleNextStep) : handleLogin}>
                    {renderFormContent()}

                    {error && (
                        <div className="mb-4 p-3 text-xs font-medium text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 animate-slide-up">
                            <Icons.X className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        disabled={loading}
                        variant="black"
                        className="w-full py-3 text-sm"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                             {loading ? 'Processing...' : (isSignUp ? (step === 3 ? 'Launch Store' : 'Continue') : 'Sign In')}
                             {!loading && !isSignUp && <Icons.ArrowRight className="w-4 h-4" />}
                        </span>
                    </Button>
                </form>
                
                {isSignUp && step > 1 && (
                        <button 
                        type="button" 
                        onClick={() => setStep(prev => (prev - 1) as any)}
                        className="w-full mt-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                        Back
                        </button>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500 font-medium">
                        {isSignUp ? 'Already have an account?' : 'New to ShopGenie?'}
                        <button 
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setStep(1);
                                setError(null);
                            }}
                            className="ml-1.5 font-bold text-gray-900 hover:underline transition-all"
                        >
                            {isSignUp ? 'Sign in' : 'Create account'}
                        </button>
                    </p>
                </div>

            </div>
            
            <div className="text-center mt-8 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                Protected by ShopGenie Secure
            </div>
        </div>

    </div>
  );
};
