export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  narration: string;
  category: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextRenewal: string;
  category: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface User {
  email: string;
  name: string;
  role: string;
  city: string;
  tier?: 'free' | 'premium';
}

export interface Notification {
  id: string;
  type: 'security' | 'sync' | 'budget' | 'transaction' | 'billing' | 'summary';
  title: string;
  message: string;
  date: string;
  read: boolean;
  emailSent: boolean;
  emailLink: string | null;
  details?: any;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  largeExpenseLimit: number;
  budgetAlerts: boolean;
  loginAlerts: boolean;
  syncAlerts: boolean;
  billingAlerts: boolean;
  weeklyReport: boolean;
}

