import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { DndContext, useDraggable, useDroppable, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Save, X, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';
import CompositionChart from './CompositionChart';

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

// --- Draggable Ingredient Card ---
function DraggableIngredient({ ingredient, onDelete }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ingredient.id,
    data: { type: 'ingredient', ...ingredient },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative flex items-center gap-3 p-3 ${THEME.card} border ${THEME.border} rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition hover:border-[#D97757]/30`}
    >
      <div className="w-12 h-12 rounded-lg bg-[#F2F0ED] overflow-hidden flex-shrink-0">
        {ingredient.image ? (
          <img src={ingredient.image} alt={ingredient.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${THEME.textMuted}`}><ImageIcon size={16} /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold ${THEME.textMain} truncate`}>{ingredient.name}</div>
        <div className={`text-xs ${THEME.accent} font-semibold`}>{ingredient.abv}% ABV</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(ingredient.id); }}
        className={`opacity-0 group-hover:opacity-100 p-2 ${THEME.textMuted} hover:text-[#D97757] transition`}
        aria-label={`${ingredient.name} 삭제`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// --- Sortable Menu Item ---
function SortableMenuItem({ menu, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: menu.id, data: { type: 'menu', ...menu } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm group">
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical size={20} />
      </div>
      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
        {menu.image ? (
          <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 truncate">{menu.name}</h4>
        <p className="text-sm text-gray-500 truncate">{menu.description}</p>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">{menu.finalAbv}% ABV</span>
      </div>
      <button
        onClick={() => onDelete(menu.id)}
        className="p-2 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

// --- Mixing Bowl Area ---
function MixingBowl({ items, onRemove, onUpdateVolume, totalVolume }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'mixing-bowl',
  });

  return (
    <div className="flex gap-4 h-full">
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[300px] overflow-y-auto border-2 border-dashed rounded-2xl p-4 transition-all duration-300 ${isOver ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 bg-gray-50/50'}`}
      >
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <div className="mb-2 p-4 bg-gray-100 rounded-full">
              <Plus size={32} className="text-gray-300" />
            </div>
            <p className="font-medium">여기로 재료를 드래그하세요</p>
            <p className="text-sm">믹싱을 시작하려면</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={14} /></div>
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-bold text-gray-800 block leading-tight">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.abv}% ABV</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                  <input
                    type="number"
                    placeholder="30"
                    className="w-12 bg-transparent text-right font-mono font-bold focus:outline-none"
                    value={item.volume || ''}
                    onChange={(e) => onUpdateVolume(idx, e.target.value)}
                    aria-label={`${item.name} 용량`}
                  />
                  <span className="text-xs text-gray-500 font-medium pr-1">ml</span>
                </div>
                <button onClick={() => onRemove(idx)} className="text-gray-400 hover:text-red-500 p-1" aria-label={`${item.name} 제거`}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-40 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center shadow-sm">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">구성</h4>
        <CompositionChart items={items} totalVolume={totalVolume} height={200} />
      </div>
    </div>
  );
}

export default function AdminMenuManager() {
  const [ingredients, setIngredients] = useState([]);
  const [mixItems, setMixItems] = useState([]);
  const [menuList, setMenuList] = useState([]); // Loaded Menu List

  // States
  const [newIng, setNewIng] = useState({ name: '', abv: 0, image: '' });
  const [isIngFormOpen, setIsIngFormOpen] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [menuDesc, setMenuDesc] = useState('');
  const [menuImage, setMenuImage] = useState('');

  useEffect(() => {
    fetchIngredients();
    fetchMenu();
  }, []);

  const fetchIngredients = async () => {
    const res = await api.get('/api/bar/ingredients');
    setIngredients(res.data);
  };

  const fetchMenu = async () => {
    const res = await api.get('/api/bar/menu');
    setMenuList(res.data);
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!newIng.name) return;
    await api.post('/api/bar/ingredients', newIng);
    setNewIng({ name: '', abv: 0, image: '' });
    setIsIngFormOpen(false);
    fetchIngredients();
  };

  const handleDeleteIngredient = async (id) => {
    if (!window.confirm('정말 이 재료를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/api/bar/ingredients/${id}`);
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      alert('재료 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteMenu = async (id) => {
    if (!window.confirm('정말 이 메뉴를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/api/bar/menu/${id}`);
      setMenuList(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      alert('메뉴 삭제 중 오류가 발생했습니다.');
    }
  };

  // --- Drag & Drop Logic ---
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    // 1. Ingredient -> Mixing Bowl
    if (active.data.current?.type === 'ingredient' && over.id === 'mixing-bowl') {
      const addedItem = { ...active.data.current, volume: 30 };
      setMixItems([...mixItems, addedItem]);
      return;
    }

    // 2. Menu Reordering
    if (active.data.current?.type === 'menu' && active.id !== over.id) {
      setMenuList((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newMenu = arrayMove(items, oldIndex, newIndex);

        // Sync with server
        api.put('/api/bar/menu/reorder', { menu: newMenu }).catch(err => console.error("Reorder failed", err));

        return newMenu;
      });
    }
  };

  const updateVolume = (index, vol) => {
    const newItems = [...mixItems];
    const val = vol === '' ? 0 : Number(vol);
    newItems[index].volume = isNaN(val) ? 0 : val;
    setMixItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = [...mixItems];
    newItems.splice(index, 1);
    setMixItems(newItems);
  };

  const totalVolume = mixItems.reduce((acc, item) => acc + (item.volume || 0), 0);
  const totalAlcohol = mixItems.reduce((acc, item) => acc + ((item.volume || 0) * (item.abv / 100)), 0);
  const finalAbv = totalVolume > 0 ? (totalAlcohol / totalVolume) * 100 : 0;

  const saveMenu = async () => {
    if (!menuName || mixItems.length === 0) return;
    const menuData = {
      name: menuName,
      description: menuDesc,
      image: menuImage,
      items: mixItems,
      finalAbv: parseFloat(finalAbv.toFixed(1)),
      totalVolume
    };
    await api.post('/api/bar/menu', menuData);
    alert('메뉴가 성공적으로 생성되었습니다!');
    setMixItems([]);
    setMenuName('');
    setMenuDesc('');
    setMenuImage('');
    fetchMenu(); // Refresh list
  };

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">

        {/* === 왼쪽 패널: 재료 라이브러리 === */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-gray-50 p-4 rounded-2xl h-full overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-lg">재료 창고</h3>
            <button
              onClick={() => setIsIngFormOpen(!isIngFormOpen)}
              className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              {isIngFormOpen ? '닫기' : '+ 새 재료'}
            </button>
          </div>

          {isIngFormOpen && (
            <form onSubmit={handleAddIngredient} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 space-y-3 animate-in fade-in slide-in-from-top-2">
              <input
                className="w-full p-2 border rounded-lg text-sm"
                placeholder="이름 (예: 위스키)"
                value={newIng.name}
                onChange={e => setNewIng({ ...newIng, name: e.target.value })}
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-24 p-2 border rounded-lg text-sm"
                  placeholder="도수 %"
                  value={newIng.abv}
                  onChange={e => setNewIng({ ...newIng, abv: Number(e.target.value) })}
                />
                <input
                  className="flex-1 p-2 border rounded-lg text-sm"
                  placeholder="이미지 URL"
                  value={newIng.image}
                  onChange={e => setNewIng({ ...newIng, image: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full bg-black text-white py-2 rounded-lg text-sm font-bold hover:bg-gray-800">재료 추가</button>
            </form>
          )}

          <motion.div
            className="flex-1 overflow-y-auto pr-2 space-y-2"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            {ingredients.map(ing => (
              <motion.div
                key={ing.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <DraggableIngredient ingredient={ing} onDelete={handleDeleteIngredient} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* === 오른쪽 패널: 작업대 & 메뉴 관리 === */}
        <div className="lg:col-span-7 flex flex-col h-full gap-4 overflow-y-auto pr-2">

          {/* 믹싱 영역 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                믹싱 작업대
              </div>
              {menuImage && (
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={menuImage} alt="메뉴 미리보기" className="w-full h-full object-cover" />
                </div>
              )}
            </h3>
            <MixingBowl items={mixItems} onRemove={removeItem} onUpdateVolume={updateVolume} totalVolume={totalVolume} />
          </div>

          {/* 결과 & 저장 영역 */}
          <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-xl">
            <div className="flex gap-6">
              <div className="flex-1 space-y-3">
                <input
                  className="w-full bg-gray-800 border-none rounded-lg px-3 py-2 text-white placeholder-gray-500 font-bold text-lg focus:ring-1 focus:ring-indigo-500"
                  placeholder="칵테일 이름"
                  value={menuName}
                  onChange={e => setMenuName(e.target.value)}
                />
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                    placeholder="설명"
                    value={menuDesc}
                    onChange={e => setMenuDesc(e.target.value)}
                  />
                  <input
                    className="w-1/3 bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                    placeholder="이미지 URL"
                    value={menuImage}
                    onChange={e => setMenuImage(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-right min-w-[100px]">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">ABV</p>
                <div className="text-4xl font-black text-yellow-400 leading-none">{finalAbv.toFixed(1)}<span className="text-lg text-yellow-600">%</span></div>
                <p className="text-gray-500 text-xs mt-1">{totalVolume}ml</p>
              </div>
            </div>

            <button
              onClick={saveMenu}
              disabled={mixItems.length === 0 || !menuName}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition"
            >
              <Save size={18} /> 메뉴 등록
            </button>
          </div>

          {/* 등록된 메뉴 관리 (Sortable List) */}
          <div className="mt-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-gray-500 rounded-full"></span>
              등록된 메뉴 ({menuList.length})
            </h3>
            <SortableContext items={menuList.map(m => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 pb-10">
                {menuList.map(menu => (
                  <SortableMenuItem key={menu.id} menu={menu} onDelete={handleDeleteMenu} />
                ))}
              </div>
            </SortableContext>
          </div>

        </div>

      </div>
    </DndContext>
  );
}