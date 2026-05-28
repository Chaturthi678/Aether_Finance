import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2,
  TrendingDown,
  LineChart,
  Lightbulb
} from 'lucide-react';
import axios from 'axios';
import type { Transaction, Message, User as UserType } from '../types';

interface AiAssistantProps {
  transactions: Transaction[];
  currentUser: UserType | null;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ transactions, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi! I'm Aether AI, your personal wealth advisor. I've analyzed your synced accounts. Ask me about your spending trends, top merchants, or how to optimize your budget!",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    { label: 'Analyze my spending', icon: LineChart, text: 'Analyze my spending and give me a full summary.' },
    { label: 'How can I save money?', icon: Lightbulb, text: 'What are some practical saving tips based on my transaction history?' },
    { label: 'My top merchants', icon: TrendingDown, text: 'Identify my top merchants and where my money is going.' }
  ];

  // Auto-scroll chat history
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post('/api/ai-assistant', {
        message: textToSend,
        transactions: transactions
      });

      const aiReply: Message = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: response.data.reply || "I encountered an issue analyzing your transactions. Please try again.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (error) {
      console.error("AI Assistant error:", error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: "Sorry, I couldn't reach the wealth engine. Please verify the backend server is running and try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-primary hover:bg-primary-hover text-white shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-110 group relative border border-primary/20"
        >
          <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-success"></span>
          </span>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-[380px] md:w-[420px] h-[550px] rounded-2xl border border-slate-800/80 bg-[#0e1322] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Chat Header */}
          <div className="px-5 py-4 bg-[#141b2c] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/25">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white">Aether AI Advisor</h3>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">Active Context</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Messages Panel */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0a0d18]/40">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isAi ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}>
                    {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                    isAi 
                      ? 'bg-[#151b2c] border border-slate-800/80 text-slate-200 rounded-tl-none' 
                      : 'bg-primary text-white rounded-tr-none'
                  }`}>
                    {/* Preserve custom formatted text */}
                    <div className="whitespace-pre-line font-normal">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center border bg-primary/10 border-primary/20 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3.5 rounded-xl bg-[#151b2c] border border-slate-800/80 text-slate-400 rounded-tl-none flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-[11px] font-medium">Wealth engine computing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions area */}
          {messages.length === 1 && !loading && (
            <div className="px-4 py-2 bg-[#090c17]/50 border-t border-slate-800/40">
              <p className="text-[10px] text-slate-500 font-semibold mb-2 uppercase tracking-wider">Quick Suggestions</p>
              <div className="flex flex-col gap-1.5">
                {suggestionChips.map((chip, i) => {
                  const ChipIcon = chip.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(chip.text)}
                      className="w-full flex items-center text-[11px] text-slate-300 bg-slate-800/45 hover:bg-slate-800 border border-slate-850 px-3 py-1.5 rounded-lg transition-colors gap-2 text-left"
                    >
                      <ChipIcon className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentUser?.tier !== 'premium' && messages.filter(m => m.sender === 'user').length >= 5 ? (
            <div className="p-4 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-t border-yellow-500/20 text-center space-y-2">
              <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Free AI Limit Reached (5/5)
              </p>
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed max-w-[280px] mx-auto">
                Upgrade to Premium Pro to continue chatting with your intelligent wealth advisor.
              </p>
            </div>
          ) : (
            /* Chat Input form */
            <form
              onSubmit={handleFormSubmit}
              className="p-3 bg-[#111625] border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
                placeholder="Ask about your finances, e.g. 'UPI tips'..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/80 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-600 text-white p-2.5 rounded-xl transition-colors shrink-0 active:scale-95 disabled:scale-100 duration-150"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}

        </div>
      )}
    </div>
  );
};
