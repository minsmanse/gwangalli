import React, { useState } from 'react';
import { io } from 'socket.io-client';
import AdminMenuManager from '../components/AdminMenuManager';
import AdminOrders from '../components/AdminOrders';
import { LayoutDashboard, Wine, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const socket = io('/bar', { transports: ['websocket'] });

// Modern 2024 Theme Constants
const THEME = {
  bg: 'bg-gradient-to-br from-[#FAFAFA] to-[#F0F0F0]',
  textMain: 'text-[#1A1A1A]',
  textMuted: 'text-[#6B7280]',
  accent: 'text-[#EA580C]',
  accentBg: 'bg-[#EA580C]',
  card: 'bg-white/90 backdrop-blur-sm',
  border: 'border-[#E5E5E5]',
  buttonPrimary: 'bg-[#1F2937] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_6px_-1px_rgba(0,0,0,0.2)]',
  buttonPrimaryHover: 'hover:bg-[#374151]',
  buttonPrimaryActive: 'active:bg-[#111827] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const navigate = useNavigate();

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${THEME.bg} ${THEME.textMain} font-sans selection:bg-[#D97757]/20`}>
      <div className="relative z-10 p-6 max-w-[1400px] mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className={`flex justify-between items-center mb-6 flex-shrink-0 pb-5 border-b ${THEME.border}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`p-2 ${THEME.card} border ${THEME.border} rounded-xl ${THEME.textMuted} hover:${THEME.textMain} transition-colors shadow-sm`}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className={`text-2xl font-title font-bold ${THEME.textMain} tracking-tight`}>
                바 <span className={THEME.accent}>관리자</span>
              </h1>
              <p className={`text-xs ${THEME.textMuted} font-medium uppercase tracking-widest`}>대시보드</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className={`flex ${THEME.card} p-1.5 rounded-xl border ${THEME.border} shadow-sm`}>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === 'orders'
                ? `${THEME.buttonPrimary} text-[#F9F8F6] shadow-md`
                : `${THEME.textMuted} hover:${THEME.textMain} hover:bg-[#F2F0ED]`
                }`}
            >
              <LayoutDashboard size={16} /> 주문 확인
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === 'studio'
                ? `${THEME.buttonPrimary} text-[#F9F8F6] shadow-md`
                : `${THEME.textMuted} hover:${THEME.textMain} hover:bg-[#F2F0ED]`
                }`}
            >
              <Wine size={16} /> 메뉴 관리
            </button>
          </nav>
        </header>

        {/* Main Content */}
        <div className={`flex-1 min-h-0 ${THEME.card} rounded-2xl overflow-hidden relative border ${THEME.border} shadow-sm`}>
          <div className="relative h-full p-6 overflow-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'orders' ? (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full"
                >
                  <AdminOrders socket={socket} />
                </motion.div>
              ) : (
                <motion.div
                  key="studio"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full"
                >
                  <AdminMenuManager />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}