import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus, Save, X } from 'lucide-react';

function DraggableIngredient({ ingredient }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ingredient.id,
    data: ingredient,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition"
    >
      <div className="font-bold text-gray-800">{ingredient.name}</div>
      <div className="text-xs text-indigo-600 font-semibold">{ingredient.abv}% ABV</div>
    </div>
  );
}

function MixingBowl({ items, onRemove, onUpdateVolume }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'mixing-bowl',
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[300px] border-2 border-dashed rounded-xl p-4 transition-colors ${isOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}
    >
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <p>Drag ingredients here to mix</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
              <div className="flex-1">
                <span className="font-bold">{item.name}</span>
                <span className="text-xs text-gray-500 ml-2">({item.abv}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="ml"
                  className="w-20 p-1 border rounded text-right"
                  value={item.volume || ''}
                  onChange={(e) => onUpdateVolume(idx, e.target.value)}
                />
                <span className="text-sm text-gray-500">ml</span>
              </div>
              <button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminMenuBuilder() {
  const [ingredients, setIngredients] = useState([]);
  const [mixItems, setMixItems] = useState([]); // Ingredients in the bowl
  const [menuName, setMenuName] = useState('');
  const [menuDesc, setMenuDesc] = useState('');

  useEffect(() => {
    axios.get('/api/ingredients').then(res => setIngredients(res.data));
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && over.id === 'mixing-bowl') {
      const addedItem = { ...active.data.current, volume: 30 }; // Default 30ml
      setMixItems([...mixItems, addedItem]);
    }
  };

  const updateVolume = (index, vol) => {
    const newItems = [...mixItems];
    newItems[index].volume = Number(vol);
    setMixItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = [...mixItems];
    newItems.splice(index, 1);
    setMixItems(newItems);
  };

  // Calculate Final Stats
  const totalVolume = mixItems.reduce((acc, item) => acc + (item.volume || 0), 0);
  const totalAlcohol = mixItems.reduce((acc, item) => acc + ((item.volume || 0) * (item.abv / 100)), 0);
  const finalAbv = totalVolume > 0 ? (totalAlcohol / totalVolume) * 100 : 0;

  const saveMenu = async () => {
    if (!menuName || mixItems.length === 0) return;
    const menuData = {
      name: menuName,
      description: menuDesc,
      items: mixItems,
      finalAbv: parseFloat(finalAbv.toFixed(1)),
      totalVolume
    };
    await axios.post('/api/bar/menu', menuData);
    alert('Menu added!');
    setMixItems([]);
    setMenuName('');
    setMenuDesc('');
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Ingredients */}
        <div className="lg:col-span-1">
          <h3 className="font-bold text-gray-700 mb-4">Ingredients</h3>
          <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
            {ingredients.map(ing => (
              <DraggableIngredient key={ing.id} ingredient={ing} />
            ))}
          </div>
        </div>

        {/* Center: Mixing Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-gray-700 mb-4">Mixing Bowl</h3>
            <MixingBowl
              items={mixItems}
              onRemove={removeItem}
              onUpdateVolume={updateVolume}
            />
          </div>

          {/* Stats & Save */}
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider">Estimated Result</p>
                <div className="text-4xl font-bold text-yellow-400">{finalAbv.toFixed(1)}%</div>
                <div className="text-gray-400">{totalVolume}ml Total Volume</div>
              </div>
              <div className="w-1/2 space-y-3">
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  placeholder="Cocktail Name"
                  value={menuName}
                  onChange={e => setMenuName(e.target.value)}
                />
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm"
                  placeholder="Description (e.g. Refreshing & Sweet)"
                  value={menuDesc}
                  onChange={e => setMenuDesc(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={saveMenu}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition"
            >
              <Save size={20} /> Register to Menu
            </button>
          </div>
        </div>

      </div>
    </DndContext>
  );
}