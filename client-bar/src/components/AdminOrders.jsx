import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock } from 'lucide-react';

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

export default function AdminOrders({ socket }) {
  const [orders, setOrders] = useState([]);
  const notificationSoundRef = useRef(null);

  // Initialize audio on mount
  useEffect(() => {
    notificationSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    notificationSoundRef.current.preload = 'auto';
  }, []);

  useEffect(() => {
    fetchOrders();

    socket.on('initialData', (data) => { });

    socket.on('newOrder', (order) => {
      setOrders(prev => [order, ...prev]);
      // Play notification sound
      if (notificationSoundRef.current) {
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current.play().catch(error => {
          console.log("Audio play failed (user interaction required):", error);
        });
      }
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderUpdated');
    };
  }, [socket]);

  const fetchOrders = async () => {
    const res = await api.get('/api/bar/orders');
    setOrders(res.data.reverse());
  };

  const updateStatus = async (id, status) => {
    await api.put(`/api/bar/orders/${id}/status`, { status });
  };

  return (
    <div className={THEME.bg}>
      <h2 className={`text-xl font-title font-bold mb-6 flex items-center gap-3 ${THEME.textMain}`}>
        새로운 주문
        <motion.span
          key={orders.filter(o => o.status === 'pending').length}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          className={`${THEME.accentBg} text-white text-xs px-2.5 py-1 rounded-full font-sans`}
        >
          {orders.filter(o => o.status === 'pending').length}
        </motion.span>
      </h2>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.95 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 350, damping: 25 }
                }
              }}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-5 rounded-2xl border-l-4 relative overflow-hidden ${THEME.card} border ${THEME.border} shadow-sm ${order.status === 'completed'
                ? 'border-l-[#5B9A8B] opacity-60'
                : 'border-l-[#D97757] shadow-md'
                }`}
            >
              {order.status === 'pending' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute top-3 right-3"
                >
                  <span className="flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97757] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D97757]"></span>
                  </span>
                </motion.div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-lg font-bold ${THEME.textMain}`}>{order.userName || '게스트'}</span>
                    <span className={`text-xs ${THEME.textMuted} font-mono`}>#{order.id.slice(-4)}</span>
                  </div>
                  <p className={`text-xs ${THEME.textMuted} flex items-center gap-1`}>
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${order.status === 'completed'
                  ? 'bg-[#5B9A8B]/10 text-[#5B9A8B]'
                  : 'bg-[#D97757]/10 text-[#D97757]'
                  }`}>
                  {order.status === 'pending' ? '대기중' : '완료'}
                </div>
              </div>

              <div className={`space-y-2 mb-5 ${THEME.bg} p-3 rounded-xl border ${THEME.border}`}>
                {order.items.map((item, idx) => (
                  <div key={idx} className={`flex justify-between items-center border-b ${THEME.border} last:border-0 pb-2 last:pb-0`}>
                    <span className={`font-medium ${THEME.textMain}`}>{item.name}</span>
                    <span className={`${THEME.card} border ${THEME.border} px-2 py-0.5 rounded-md ${THEME.textMuted} font-bold text-sm`}>
                      {item.quantity}잔
                    </span>
                  </div>
                ))}
                {order.requestMessage && (
                  <div className={`text-sm ${THEME.textMuted} mt-2 pt-2 border-t ${THEME.border}`}>
                    <span className={`font-bold ${THEME.accent}`}>요청:</span> {order.requestMessage}
                  </div>
                )}
              </div>

              {order.status === 'pending' ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateStatus(order.id, 'completed')}
                  className={`w-full ${THEME.buttonPrimary} ${THEME.buttonPrimaryHover} text-[#F9F8F6] font-medium py-3 rounded-xl flex justify-center items-center gap-2 transition shadow-md`}
                >
                  <CheckCircle size={16} /> 완료 처리
                </motion.button>
              ) : (
                <button
                  disabled
                  className={`w-full bg-[#F2F0ED] ${THEME.textMuted} font-medium py-3 rounded-xl flex justify-center items-center gap-2 cursor-not-allowed`}
                >
                  완료됨
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}