import React, { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, Sparkles, UserPlus, ArrowRight, Compass, ShieldAlert, Award, ArrowRightCircle } from 'lucide-react';
import axios from 'axios';
import type { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

const DEMO_PROFILES = [
  { 
    email: 'ananya@aether.in', 
    name: 'Ananya Sharma', 
    role: 'Software Engineer', 
    city: 'Bangalore', 
    password: 'pass123',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
  }
];

const ROLES = [
  "College Student", 
  "Software Engineer", 
  "Small Business Owner", 
  "Freelance UI Designer", 
  "Data Analyst", 
  "Product Manager", 
  "Consultant", 
  "Doctor"
];

const CITIES = [
  "Ahmedabad", 
  "Bangalore", 
  "Delhi", 
  "Mumbai", 
  "Pune", 
  "Hyderabad", 
  "Chennai", 
  "Kolkata"
];

const ONBOARDING_SLIDES = [
  {
    title: "Interactive Setu Banking",
    description: "Sync mock bank accounts instantly using simulated Setu Sandbox callbacks. Experience the modern Open Banking flow.",
    icon: Compass,
    color: "text-primary bg-primary/10 border-primary/20"
  },
  {
    title: "SMS & Invoice Scanners",
    description: "Upload invoices, receipts or drag & drop bills to instantly parse transaction ledger metadata automatically.",
    icon: Award,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    title: "Context-Aware AI Assistant",
    description: "Chat with an AI Advisor that reads your ledger context to provide real-time Indian budgeting tips.",
    icon: Sparkles,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  },
  {
    title: "Real-Time Email Alerts",
    description: "Receive instant email alerts directly to your inbox for budget violations, login security, and monthly wealth digests.",
    icon: ShieldAlert,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
  }
];

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // Tabs: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES[1]); // Software Engineer default
  const [city, setCity] = useState(CITIES[1]); // Bangalore default

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: any = {
      email: email.trim(),
      password: password.trim()
    };

    if (activeTab === 'signup') {
      payload.name = name.trim();
      payload.role = role;
      payload.city = city;
    }

    try {
      const response = await axios.post('/api/auth/login', payload);
      if (response.data.success && response.data.user) {
        onLoginSuccess(response.data.user, response.data.token);
      }
    } catch (err: any) {
      console.error("Auth failed:", err);
      setError(err.response?.data?.error || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (profile: typeof DEMO_PROFILES[0]) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        email: profile.email,
        password: profile.password
      });
      if (response.data.success && response.data.user) {
        onLoginSuccess(response.data.user, response.data.token);
      }
    } catch (err: any) {
      console.error("Quick login failed:", err);
      setError(err.response?.data?.error || "Quick login failed.");
      setLoading(false);
    }
  };

  const SlideIcon = ONBOARDING_SLIDES[currentSlide].icon;

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-6 relative font-sans overflow-y-auto">
      {/* Background glow filters */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-success/10 blur-[80px]" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 z-10 my-8">
        
        {/* Onboarding Left Panel */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-8 text-left pr-0 md:pr-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-1 rounded flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-spin" /> India's Intelligent Ledger
              </span>
            </div>
            <div>
              <h1 className="font-display font-black text-4xl text-white tracking-tight leading-none">
                Aether <span className="text-primary bg-clip-text">Finance</span>
              </h1>
              <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                Experience glassmorphism analytics, automated banking SMS parsing, drag-and-drop receipt scanning, and context-aware AI advisors tailored for personal budgets.
              </p>
            </div>
          </div>

          {/* Dynamic Interactive Carousel Card */}
          <div className="bg-[#101625]/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden transition-all duration-500 shadow-xl shadow-black/20">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl border flex-shrink-0 ${ONBOARDING_SLIDES[currentSlide].color}`}>
                <SlideIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{ONBOARDING_SLIDES[currentSlide].title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  {ONBOARDING_SLIDES[currentSlide].description}
                </p>
              </div>
            </div>

            {/* Indicator Dots */}
            <div className="flex gap-1.5 mt-4 justify-end">
              {ONBOARDING_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-5 bg-primary' : 'w-1.5 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Secured via Open Aggregator Protocols
          </div>
        </div>

        {/* Credentials Form & Quick Profiles Right Panel */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Main Credentials Form Card */}
          <div className="glass-panel p-6">
            
            {/* Custom Tab Selectors */}
            <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/50 mb-5">
              <button
                onClick={() => { setActiveTab('signin'); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'signin' 
                    ? 'bg-primary text-white shadow-md shadow-primary/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="h-4 w-4" /> Sign In Securely
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'signup' 
                    ? 'bg-primary text-white shadow-md shadow-primary/10' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="h-4 w-4" /> Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 bg-danger/15 text-danger border border-danger/20 rounded-xl text-xs font-semibold mb-4 text-left">
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              {activeTab === 'signup' && (
                <>
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80 placeholder-slate-600"
                    />
                  </div>

                  {/* Profile Settings (Role & City Dropdowns) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Professional Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Indian Residence</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                      >
                        {CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. ananya@aether.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80 placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80 placeholder-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 rounded-xl active:scale-[0.98] transition-transform duration-700 flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {activeTab === 'signin' ? (
                      <>
                        <LogIn className="h-4.5 w-4.5" /> Access Dashboard
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4.5 w-4.5" /> Create Account Securely
                      </>
                    )}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick-Login Demo Accounts Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">Explore Demo Persona</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {DEMO_PROFILES.map((profile) => (
                <div
                  key={profile.email}
                  onClick={() => !loading && handleQuickLogin(profile)}
                  className={`bg-gradient-to-br ${profile.color} border p-3 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-left relative overflow-hidden group shadow-lg shadow-black/5 hover:border-slate-700`}
                >
                  {/* Subtle hover icon indicators */}
                  <ArrowRightCircle className="absolute right-3 bottom-3 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
                  
                  <p className="text-xs font-bold text-white">{profile.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{profile.role}</p>
                  
                  <div className="flex items-center justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-3">
                    <span>{profile.city}</span>
                    <span className="text-primary hover:underline font-extrabold flex items-center gap-0.5 group-hover:text-white">
                      Quick Log In <ArrowRight className="h-2 w-2" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
