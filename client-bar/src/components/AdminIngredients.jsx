import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [newIng, setNewIng] = useState({ name: '', abv: 0 });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    const res = await api.get('/api/bar/ingredients');
    setIngredients(res.data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newIng.name) return;
    await api.post('/api/bar/ingredients', newIng);
    setNewIng({ name: '', abv: 0 });
    fetchIngredients();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Ingredient Stock</h2>

      <form onSubmit={handleAdd} className="flex gap-4 mb-8 bg-gray-50 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Ingredient Name (e.g., Whiskey)"
          className="flex-1 p-3 border rounded-lg"
          value={newIng.name}
          onChange={e => setNewIng({ ...newIng, name: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="ABV %"
            className="w-24 p-3 border rounded-lg"
            value={newIng.abv}
            onChange={e => setNewIng({ ...newIng, abv: Number(e.target.value) })}
          />
          <span className="font-bold text-gray-500">%</span>
        </div>
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700">
          <Plus size={20} /> Add
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map(ing => (
          <div key={ing.id} className="flex justify-between items-center p-4 border rounded-xl bg-white shadow-sm">
            <div>
              <p className="font-bold text-lg">{ing.name}</p>
              <p className="text-gray-500">{ing.abv}% ABV</p>
            </div>
            {/* Delete functionality could be added here */}
          </div>
        ))}
      </div>
    </div>
  );
}