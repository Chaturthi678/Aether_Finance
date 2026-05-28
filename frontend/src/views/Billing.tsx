import React, { useState } from 'react';
import { 
  Check, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  AlertCircle, 
  Loader2, 
  QrCode, 
  Lock,
  X
} from 'lucide-react';
import axios from 'axios';
import type { User } from '../types';

interface BillingProps {
  currentUser: User | null;
  onUpdateUser: (user: User, token?: string) => void;
}

export const Billing: React.FC<BillingProps> = ({ currentUser, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const isPremium = currentUser?.tier === 'premium';

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(val);
    }
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val.substring(0, 5));
  };

  // Initiate purchase flow
  const handleOpenCheckout = () => {
    setError(null);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setShowCheckout(true);
  };

  // Handle Mock payment processing
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCvv.length < 3 || !cardName.trim()) {
        alert("Please enter valid mock card details.");
        return;
      }
    }

    setPaymentProcessing(true);
    // Simulate payment processing network latency
    setTimeout(async () => {
      try {
        const response = await axios.post('/api/billing/upgrade');
        if (response.data.success && response.data.user) {
          setPaymentSuccess(true);
          // Wait 2s to show celebration checkout state
          setTimeout(() => {
            onUpdateUser(response.data.user, response.data.token);
            setShowCheckout(false);
            setPaymentSuccess(false);
            setPaymentProcessing(false);
          }, 2000);
        }
      } catch (err: any) {
        console.error("Upgrade failed:", err);
        setError(err.response?.data?.error || "Failed to complete payment checkout.");
        setPaymentProcessing(false);
      }
    }, 2500);
  };

  // Downgrade flow
  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your Premium benefits? You will lose unlimited AI access and live banking features.")) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/billing/cancel');
      if (response.data.success && response.data.user) {
        onUpdateUser(response.data.user, response.data.token);
        alert("Your subscription has been cancelled. Reverted to Free tier.");
      }
    } catch (err: any) {
      console.error("Cancellation failed:", err);
      setError(err.response?.data?.error || "Failed to cancel subscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="font-display font-bold text-2xl text-white tracking-tight">Premium Billing</h2>
        <p className="text-slate-400 text-sm mt-0.5">Manage your Aether Finance subscription plan and unlock pro modules.</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/15 text-danger border border-danger/20 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Status Banner */}
      <div className={`glass-panel p-6 border-slate-800/80 bg-gradient-to-r relative overflow-hidden ${
        isPremium 
          ? 'from-yellow-500/10 via-transparent to-transparent border-yellow-500/20' 
          : 'from-primary/10 via-transparent to-transparent'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isPremium 
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' 
                : 'bg-primary/10 border border-primary/20 text-primary'
            }`}>
              {isPremium ? <Sparkles className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              Current Plan: {isPremium ? 'Premium Pro Member' : 'Free Tier'}
            </div>
            <h4 className="font-display font-extrabold text-lg text-white">
              {isPremium ? 'Welcome to Aether Premium Pro' : 'Unlock Aether Premium Wealth Tools'}
            </h4>
            <p className="text-xs text-slate-400 max-w-xl">
              {isPremium 
                ? 'Your account has full unrestricted access to Indian banking aggregator frameworks, unlimited AI wealth reports, and high-fidelity ledger automation.' 
                : 'Accelerate your financial analysis with automated receipt scanning, infinite AI advisor queries, and secure sandbox Account Aggregator sync hooks.'
              }
            </p>
          </div>

          {isPremium ? (
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="bg-slate-900 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-bold py-2.5 px-5 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          ) : (
            <button
              onClick={handleOpenCheckout}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 text-xs font-black py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-yellow-500/10 flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" /> Go Premium Pro
            </button>
          )}
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-4">
        
        {/* Free Plan */}
        <div className="glass-panel p-6 border-slate-850 bg-slate-900/10 flex flex-col justify-between opacity-80">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plan</span>
            <h3 className="font-display font-bold text-lg text-white mt-1">Standard Free</h3>
            <p className="text-slate-400 text-xs mt-2">Basic manual ledger utilities.</p>
            
            <div className="my-6">
              <span className="text-3xl font-display font-black text-white">₹0</span>
              <span className="text-slate-500 text-xs font-semibold ml-1">/ forever</span>
            </div>

            <div className="divider"></div>

            <ul className="space-y-3 mt-6">
              <li className="flex items-start gap-2.5 text-xs text-slate-350">
                <Check className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Standard transaction ledger (Manual input & CSV imports)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-350">
                <Check className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Simulated Setu mock bank sync (Manual trigger)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-350">
                <Check className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Budget goals & categories setup</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-500">
                <X className="h-4 w-4 text-red-500/40 shrink-0 mt-0.5" />
                <span className="line-through">AI Assistant queries (Capped at 5 messages)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-500">
                <X className="h-4 w-4 text-red-500/40 shrink-0 mt-0.5" />
                <span className="line-through">AI Receipt OCR Scan (Capped at 3 receipt uploads)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-500">
                <X className="h-4 w-4 text-red-500/40 shrink-0 mt-0.5" />
                <span className="line-through">Live Account Aggregator Sandbox Redirects</span>
              </li>
            </ul>
          </div>
          
          <button 
            disabled={!isPremium} 
            className="w-full mt-8 bg-slate-900 border border-slate-800 text-slate-500 text-xs font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPremium ? 'Downgrade to Free' : 'Active Plan'}
          </button>
        </div>

        {/* Premium Pro Plan */}
        <div className="glass-panel p-6 border-yellow-500/25 bg-gradient-to-b from-yellow-500/5 to-transparent flex flex-col justify-between relative overflow-hidden group shadow-xl shadow-yellow-500/5">
          <div className="absolute top-0 right-0 h-16 w-16 bg-yellow-500/10 rounded-bl-full flex items-center justify-center border-l border-b border-yellow-500/15">
            <Sparkles className="h-5 w-5 text-yellow-400" />
          </div>

          <div>
            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Most Popular</span>
            <h3 className="font-display font-bold text-lg text-white mt-1">Premium Pro</h3>
            <p className="text-slate-400 text-xs mt-2">Unrestricted AI-powered financial ledger intelligence.</p>
            
            <div className="my-6">
              <span className="text-3xl font-display font-black text-white">₹99</span>
              <span className="text-slate-500 text-xs font-semibold ml-1">/ month</span>
            </div>

            <div className="divider"></div>

            <ul className="space-y-3 mt-6">
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <span className="font-semibold text-white">Unlimited AI Assistant Chat queries</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <span className="font-semibold text-white">Unlimited AI Receipt Scanner uploads</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>Live Account Aggregator Sandbox redirects & callbacks</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>Real-time email alert delivery (Gmail SMTP configuration)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>Automated monthly wealth digests and reports</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>Priority support and custom email limit setup</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={isPremium}
            className={`w-full mt-8 text-xs font-black py-3 rounded-xl transition-all duration-200 active:scale-95 ${
              isPremium 
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 cursor-default' 
                : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 shadow-lg shadow-yellow-500/10'
            }`}
          >
            {isPremium ? 'Active Pro Member' : 'Subscribe Now (₹99)'}
          </button>
        </div>

      </div>

      {/* Razorpay Mock Checkout Overlay Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-[#05070c]/90 backdrop-blur-[12px] z-50 flex items-center justify-center p-4">
          <div className="bg-[#121829] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
            
            {/* Razorpay Brand Header */}
            <div className="px-5 py-4 bg-[#0a2540] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-[#1e40af] text-white p-1.5 rounded-lg text-xs font-black tracking-tight flex items-center gap-1 font-mono uppercase">
                  R
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-[13px] text-white tracking-wide uppercase">Razorpay Sandbox</h3>
                  <p className="text-[10px] text-blue-300 font-semibold leading-none">Secured Checkout Gateway</p>
                </div>
              </div>
              
              <button
                onClick={() => !paymentProcessing && setShowCheckout(false)}
                disabled={paymentProcessing}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Merchant Info Area */}
            <div className="bg-[#0f1424] px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-[10px] uppercase font-mono">
                  A
                </div>
                <span className="text-white font-bold">Aether Finance Premium</span>
              </div>
              <span className="text-emerald-400 font-black text-sm">₹99.00</span>
            </div>

            {paymentSuccess ? (
              /* Success confirmation Screen */
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px] animate-in fade-in duration-300">
                <div className="h-16 w-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center text-success text-3xl font-bold animate-bounce shadow-lg shadow-success/15">
                  ✓
                </div>
                <div>
                  <h4 className="text-white font-display font-extrabold text-lg">Payment Successful</h4>
                  <p className="text-slate-400 text-xs mt-1">₹99.00 debited from selected provider.</p>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pt-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-success" /> Upgrading account status...
                </div>
              </div>
            ) : paymentProcessing ? (
              /* Payment processing screen */
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div>
                  <h4 className="text-white font-display font-extrabold text-sm">Processing Transaction...</h4>
                  <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed max-w-[250px] mx-auto">
                    Simulating 3D secure verification callback. Please do not close this window.
                  </p>
                </div>
              </div>
            ) : (
              /* Payment entry form screen */
              <form onSubmit={handleProcessPayment} className="p-5 space-y-5">
                
                {/* Method selector tabs */}
                <div className="flex bg-slate-900 border border-slate-800/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 ${
                      paymentMethod === 'upi' ? 'bg-[#0a2540] text-white border border-slate-700/50' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" /> UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 ${
                      paymentMethod === 'card' ? 'bg-[#0a2540] text-white border border-slate-700/50' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Card details
                  </button>
                </div>

                {paymentMethod === 'upi' ? (
                  /* UPI checkout panel */
                  <div className="space-y-4 flex flex-col items-center justify-center py-2 animate-in fade-in duration-200">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 relative overflow-hidden group shadow-lg shadow-black/15">
                      {/* Interactive mock QR Code */}
                      <div className="h-32 w-32 bg-slate-100 flex items-center justify-center border border-slate-200 relative">
                        <QrCode className="h-28 w-28 text-slate-900" />
                        <div className="absolute inset-0 bg-blue-500/5 animate-[pulse_1s_infinite]"></div>
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-white font-bold">Scan QR code using UPI App</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed max-w-[260px]">
                        Scan via GooglePay, PhonePe, Paytm, or BHIM. Sandbox handles payment verification instantly.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Card checkout panel */
                  <div className="space-y-3 text-left animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Card Number</label>
                      <input
                        type="text"
                        required
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary/80"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          maxLength={5}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary/80"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CVV Code</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, '').substring(0, 3))}
                          maxLength={3}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary/80"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ananya Sharma"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-primary/80"
                      />
                    </div>
                  </div>
                )}

                {/* Simulated payment button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 duration-150 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" /> Pay Securely (₹99.00)
                  </button>
                  <p className="text-center text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-3">
                    🛡 Sandbox simulated transaction - no real money will be charged
                  </p>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};


