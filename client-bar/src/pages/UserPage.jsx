import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingBag, Minus, Plus, Beer, X, Clock, Trash2, ChevronDown, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CompositionChart from '../components/CompositionChart';

// --- Modern 2024 Theme Constants ---
const THEME = {
  bg: 'bg-gradient-to-b from-[#FAFAFA] to-[#F5F5F4]',
  textMain: 'text-[#1A1A1A]',
  textMuted: 'text-[#6B7280]',
  accent: 'text-[#EA580C]',
  accentBg: 'bg-[#EA580C]',
  card: 'bg-white/80 backdrop-blur-sm',
  border: 'border-[#E5E5E5]',
  // Solid dark button with 3D pressed effect via shadow
  buttonPrimary: 'bg-[#1F2937] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_6px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.1)]',
  buttonPrimaryHover: 'hover:bg-[#374151] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_8px_-2px_rgba(0,0,0,0.25)]',
  buttonPrimaryActive: 'active:bg-[#111827] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
};

// --- Enhanced Animations (Cascade Card Effect) ---
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
      mass: 0.8
    }
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 350,
      mass: 0.9
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 15,
    filter: "blur(2px)",
    transition: {
      duration: 0.25,
      ease: [0.32, 0, 0.67, 0]
    }
  }
};

const floatingButtonVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  },
  exit: {
    y: 20,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.97 },
  hover: { scale: 1.02 }
};

// --- Components ---

function MenuDetailModal({ item, onClose, onAddToCart, cartQuantity, onRemoveFromCart }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#2D2B26]/40 backdrop-blur-sm"
      />

      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`relative ${THEME.card} w-full max-w-sm rounded-2xl overflow-hidden shadow-xl z-10 max-h-[90vh] flex flex-col`}
      >
        <div className="relative h-64 bg-[#F2F0ED] shrink-0">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${THEME.textMuted}`}>
              <Beer size={48} strokeWidth={1.5} />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white text-[#2D2B26] p-2 rounded-full backdrop-blur-md transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-6 overflow-y-auto">
          <div className="flex flex-col items-center mb-6">
            <h2 className={`text-2xl font-title font-bold ${THEME.textMain} mb-2 text-center tracking-tight`}>{item.name}</h2>
            <p className={`${THEME.textMuted} leading-relaxed text-sm text-center mb-6 max-w-xs`}>{item.description}</p>
            <div className="w-full max-w-[180px]">
              <CompositionChart items={item.items} totalVolume={item.totalVolume} height={180} />
            </div>
          </div>
        </div>

        <div className={`p-5 border-t ${THEME.border} bg-[#FBFBF9] mt-auto flex items-center justify-between gap-4`}>
          <div className="flex flex-col items-start pl-1">
            <span className={`text-xs font-semibold ${THEME.textMuted} uppercase tracking-wider`}>ABV</span>
            <span className={`text-2xl font-title font-bold ${THEME.accent}`}>{item.finalAbv}<span className="text-base font-sans ml-0.5">%</span></span>
          </div>

          <div className="flex-1">
            <button
              onClick={() => {
                onAddToCart(item);
                onClose();
              }}
              className={`w-full h-12 ${THEME.buttonPrimary} ${THEME.buttonPrimaryHover} ${THEME.buttonPrimaryActive} text-white font-medium text-lg rounded-xl transition-all flex items-center justify-center gap-2`}
            >
              주문 추가 <Plus size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CartSheet({ cart, isOpen, onClose, onPlaceOrder, isOrdering, onUpdateQuantity }) {
  const [userName, setUserName] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const cartItems = Object.values(cart);
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const savedName = localStorage.getItem('party_user_name');
    if (savedName) setUserName(savedName);
  }, []);

  const handleOrder = () => {
    if (!userName.trim()) {
      alert('주문자 이름을 입력해주세요!');
      return;
    }
    localStorage.setItem('party_user_name', userName);
    onPlaceOrder(userName, requestMessage);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 35, stiffness: 400, mass: 0.8 }}
            className={`fixed bottom-0 left-0 right-0 ${THEME.bg} rounded-t-[28px] z-50 max-h-[90vh] flex flex-col max-w-md mx-auto shadow-[0_-20px_60px_rgba(0,0,0,0.15)]`}
          >
            {/* Handle Bar */}
            <div className="pt-4 pb-2 flex justify-center cursor-pointer" onClick={onClose}>
              <div className="w-10 h-1 bg-[#E0DDD9] rounded-full" />
            </div>

            <div className={`px-6 pb-4 flex justify-between items-center border-b ${THEME.border}`}>
              <h2 className={`text-xl font-title font-bold ${THEME.textMain}`}>내 주문 <span className={`${THEME.accent} font-sans ml-1 text-lg`}>({totalQuantity})</span></h2>
              <button onClick={onClose} className="p-2 hover:bg-[#EAE8E4] rounded-full transition-colors text-[#8E8B86]">
                <ChevronDown size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <AnimatePresence>
                {cartItems.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-10 ${THEME.textMuted}`}>장바구니가 비어있습니다.</motion.div>
                ) : (
                  cartItems.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className={`flex items-center gap-4 ${THEME.card} p-3 rounded-xl shadow-sm border ${THEME.border}`}
                    >
                      <div className="w-14 h-14 bg-[#F2F0ED] rounded-lg overflow-hidden shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${THEME.textMain} truncate`}>{item.name}</h4>
                        <p className={`text-xs ${THEME.textMuted}`}>{item.finalAbv}% ABV</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 text-[#8E8B86] hover:bg-[#F2F0ED] rounded"><Minus size={16} /></button>
                        <span className={`font-medium ${THEME.textMain} w-4 text-center text-sm`}>{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 text-[#8E8B86] hover:bg-[#F2F0ED] rounded"><Plus size={16} /></button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className={`p-6 ${THEME.card} border-t ${THEME.border} mt-auto pb-8`}>
              <div className="mb-6 space-y-4">
                <div>
                  <label className={`block text-xs font-semibold ${THEME.textMuted} uppercase mb-2 ml-1`}>주문자명</label>
                  <input
                    type="text"
                    placeholder="이름을 입력하세요"
                    className={`w-full p-3 rounded-lg border ${THEME.border} bg-[#F9F8F6] ${THEME.textMain} focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] focus:outline-none transition-all placeholder-[#Cac8c4]`}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${THEME.textMuted} uppercase mb-2 ml-1`}>요청사항 (선택)</label>
                  <textarea
                    placeholder="예: 얼음 조금만 주세요, 라임 추가해주세요 등"
                    className={`w-full p-3 rounded-lg border ${THEME.border} bg-[#F9F8F6] ${THEME.textMain} focus:ring-1 focus:ring-[#D97757] focus:border-[#D97757] focus:outline-none h-20 resize-none placeholder-[#Cac8c4] text-sm`}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <button
                onClick={handleOrder}
                disabled={isOrdering || totalQuantity === 0}
                className={`w-full ${THEME.buttonPrimary} ${THEME.buttonPrimaryHover} ${THEME.buttonPrimaryActive} text-white font-medium text-lg py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                {isOrdering ? '전송 중...' : '주문 접수'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function OrderHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    const savedIds = JSON.parse(localStorage.getItem('party_order_ids') || '[]');
    if (savedIds.length > 0) {
      try {
        const res = await api.post('/api/orders/batch', { orderIds: savedIds });
        setHistory(res.data);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#2D2B26]/40 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div
        variants={modalVariants}
        initial="hidden" animate="visible" exit="exit"
        className={`relative ${THEME.bg} w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl z-10 max-h-[80vh] flex flex-col`}
      >
        <div className={`p-5 border-b ${THEME.border} flex justify-between items-center ${THEME.card}`}>
          <h2 className={`text-lg font-title font-bold ${THEME.textMain} flex items-center gap-2`}>
            주문 내역
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F2F0ED] rounded-full text-[#8E8B86]"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className={`text-center py-10 ${THEME.textMuted}`}>로딩 중...</div>
          ) : history.length === 0 ? (
            <div className={`text-center py-10 ${THEME.textMuted}`}>
              <p>이전 주문 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(order => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`${THEME.card} p-4 rounded-xl border ${THEME.border} shadow-sm relative overflow-hidden`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.status === 'completed' ? 'bg-[#5B9A8B]' : 'bg-[#E5C07B]'}`} />
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <span className={`text-xs font-mono ${THEME.textMuted}`}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${order.status === 'completed' ? 'bg-[#5B9A8B]/10 text-[#5B9A8B]' : 'bg-[#E5C07B]/10 text-[#B89655]'}`}>
                      {order.status === 'pending' ? '제조 중' : '준비 완료'}
                    </span>
                  </div>
                  <div className="pl-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm items-center">
                        <span className={`font-medium ${THEME.textMain}`}>{item.name}</span>
                        <span className={`${THEME.textMuted} text-xs`}>x{item.quantity}</span>
                      </div>
                    ))}
                    {order.requestMessage && (
                      <p className={`text-xs ${THEME.textMuted} bg-[#F9F8F6] p-2 rounded-lg mt-2 border ${THEME.border}`}>
                        {order.requestMessage}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Page ---

export default function UserPage() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // UI States
  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    const res = await api.get('/api/bar/menu');
    setMenu(res.data);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const current = prev[item.id] || { ...item, quantity: 0 };
      return { ...prev, [item.id]: { ...current, quantity: current.quantity + 1 } };
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { ...current, quantity: current.quantity - 1 } };
    });
  };

  const updateCartQuantity = (itemId, delta) => {
    if (delta > 0) {
      const item = cart[itemId] || menu.find(m => m.id === itemId);
      addToCart(item);
    } else {
      removeFromCart(itemId);
    }
  };

  const totalQuantity = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);

  const placeOrder = async (userName, requestMessage) => {
    if (totalQuantity === 0) return;
    setIsOrdering(true);
    const items = Object.values(cart).map(item => ({
      menuId: item.id,
      name: item.name,
      quantity: item.quantity
    }));

    try {
      const res = await api.post('/api/bar/orders', { items, userName, requestMessage });
      const savedIds = JSON.parse(localStorage.getItem('party_order_ids') || '[]');
      savedIds.push(res.data.id);
      localStorage.setItem('party_order_ids', JSON.stringify(savedIds));

      setCart({});
      setCartOpen(false);
      alert(`${userName}님의 주문이 접수되었습니다!`);
    } catch (e) {
      alert('주문 접수 중 오류가 발생했습니다.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className={`pb-32 max-w-md mx-auto ${THEME.bg} min-h-screen shadow-2xl relative`}>
      {/* Header */}
      <header className={`p-6 sticky top-0 z-10 flex justify-between items-center bg-[#F9F8F6]/80 backdrop-blur-md border-b ${THEME.border} transition-all`}>
        <div>
          <h1 className={`text-2xl font-title font-bold ${THEME.textMain} flex items-center gap-2 tracking-tight`}>
            바
          </h1>
          <p className={`text-xs ${THEME.textMuted} font-medium uppercase tracking-widest ml-0.5`}>메뉴</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setHistoryOpen(true)}
          className={`p-2.5 ${THEME.card} border ${THEME.border} shadow-sm rounded-xl text-[#8E8B86] hover:${THEME.accent} hover:border-[#D97757]/30 transition-colors`}
        >
          <Clock size={18} strokeWidth={2} />
        </motion.button>
      </header >

      {/* Menu List */}
      <motion.div
        key={menu.length}
        className="p-5 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {
          menu.length === 0 ? (
            <div className={`text-center py-20 ${THEME.textMuted}`}>
              <p className="mb-2">등록된 메뉴가 없습니다.</p>
              <p className="text-xs">바텐더에게 메뉴 추가를 요청해보세요!</p>
            </div>
          ) : (
            menu.map(item => {
              const quantity = cart[item.id]?.quantity || 0;
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedItem(item)}
                  className={`${THEME.card} p-4 rounded-xl shadow-sm border ${THEME.border} flex gap-4 items-center cursor-pointer hover:shadow-lg transition-shadow duration-200`}
                >
                  {/* Image */}
                  <div className="w-20 h-20 bg-[#F2F0ED] rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D3D0CB]">
                        <Beer size={24} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 py-1">
                    <h3 className={`font-title font-bold text-lg ${THEME.textMain} truncate tracking-tight mb-0.5`}>{item.name}</h3>
                    <p className={`${THEME.textMuted} text-sm mb-2 line-clamp-1`}>{item.description}</p>
                    <span className={`inline-block ${THEME.bg} border ${THEME.border} ${THEME.textMuted} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}>
                      {item.finalAbv}% ABV
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {quantity > 0 ? (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center bg-[#F2F0ED] rounded-lg p-1"
                      >
                        <button onClick={() => addToCart(item)} className="p-1.5 hover:bg-white rounded-md text-[#D97757] transition-colors">
                          <Plus size={14} />
                        </button>
                        <span className={`font-bold text-sm py-0.5 w-6 text-center ${THEME.textMain}`}>{quantity}</span>
                        <button onClick={() => removeFromCart(item.id)} className="p-1.5 hover:bg-white rounded-md text-[#8E8B86] transition-colors">
                          <Minus size={14} />
                        </button>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className={`${THEME.buttonPrimary} ${THEME.buttonPrimaryHover} ${THEME.buttonPrimaryActive} text-white p-2.5 rounded-xl transition-all`}
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </motion.div >
              );
            })
          )
        }
      </motion.div >

      {/* Admin Link */}
      < motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="p-4 flex justify-center mt-4 opacity-50 hover:opacity-100 transition-opacity"
      >
        <button
          onClick={() => navigate('/fuckyou')}
          className={`flex items-center gap-2 px-5 py-2 ${THEME.textMuted} text-xs font-medium hover:text-[#D97757] transition-colors`}
        >
          <Key size={14} /> 관리자 페이지로 이동
        </button>
      </motion.div >

      {/* Floating Order Bar */}
      <AnimatePresence>
        {totalQuantity > 0 && (
          <motion.div
            variants={floatingButtonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover="hover"
            className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-30"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setCartOpen(true)}
              className={`w-full ${THEME.buttonPrimary} ${THEME.buttonPrimaryHover} ${THEME.buttonPrimaryActive} text-white font-medium text-lg py-4 rounded-2xl flex justify-between items-center px-6`}
            >
              <div className="flex items-center gap-3">
                <motion.span
                  key={totalQuantity}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className={`${THEME.accentBg} text-white px-2.5 py-1 rounded-lg text-xs font-bold`}
                >
                  {totalQuantity}
                </motion.span>
                <span className="text-white/80 text-sm">장바구니 보기</span>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-[#EA580C]">주문하기 <ChevronDown size={16} className="rotate-180" /></span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Sheets */}
      < AnimatePresence >
        {selectedItem && (
          <MenuDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            cartQuantity={cart[selectedItem?.id]?.quantity || 0}
          />
        )}
      </AnimatePresence >

      <CartSheet
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onPlaceOrder={placeOrder}
        isOrdering={isOrdering}
        onUpdateQuantity={updateCartQuantity}
      />

      <OrderHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div >
  );
}