import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Search, 
  ShoppingCart
} from 'lucide-react';
import { PantryItem, Category } from '../types';

interface PantryViewProps {
  items: PantryItem[];
  onSaveItem: (item: PantryItem) => void;
  onDeleteItem: (id: string) => void;
  onAutoRestockLow: (items: PantryItem[]) => void;
  onOpenVoice: () => void;
}

export const PantryView: React.FC<PantryViewProps> = ({
  items = [],
  onSaveItem,
  onDeleteItem,
  onAutoRestockLow,
  onOpenVoice
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'expiring' | 'low' | 'good'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>('Pantry');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('pack');
  const [newItemRemaining, setNewItemRemaining] = useState(100);

  const { lowOrExpiringItems, expiringCount, lowCount, goodCount } = useMemo(() => {
    const lowOrExpiring = items.filter(
      i => i.status === 'expiring_soon' || i.status === 'running_low' || i.status === 'critically_low'
    );
    const expiring = items.filter(i => i.status === 'expiring_soon').length;
    const low = items.filter(i => i.status === 'running_low' || i.status === 'critically_low').length;
    const good = items.filter(i => i.status === 'good').length;

    return {
      lowOrExpiringItems: lowOrExpiring,
      expiringCount: expiring,
      lowCount: low,
      goodCount: good
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedFilter === 'expiring') return item.status === 'expiring_soon';
      if (selectedFilter === 'low') return item.status === 'running_low' || item.status === 'critically_low';
      if (selectedFilter === 'good') return item.status === 'good';
      return true;
    });
  }, [items, searchQuery, selectedFilter]);

  const handleCreatePantryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    let status: PantryItem['status'] = 'good';
    if (newItemRemaining <= 25) status = 'critically_low';
    else if (newItemRemaining <= 50) status = 'running_low';

    const newItem: PantryItem = {
      id: `pantry-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQty || 1,
      unit: newItemUnit || 'pack',
      estimatedRemaining: newItemRemaining,
      status,
      lastUpdated: Date.now(),
      averageConsumptionRate: 'Tracked manually'
    };

    onSaveItem(newItem);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemRemaining(100);
    setIsAddingItem(false);
  };

  const handleUpdateRemaining = (item: PantryItem, newRemaining: number) => {
    let status: PantryItem['status'] = 'good';
    let predictedRunout = item.predictedRunoutDate;

    if (newRemaining <= 20) {
      status = 'critically_low';
      predictedRunout = 'In 1-2 days';
    } else if (newRemaining <= 45) {
      status = 'running_low';
      predictedRunout = 'In 4-5 days';
    } else {
      predictedRunout = 'Well stocked';
    }

    onSaveItem({
      ...item,
      estimatedRemaining: newRemaining,
      status,
      predictedRunoutDate: predictedRunout,
      lastUpdated: Date.now()
    });
  };

  return (
    <div id="pantry-view-container" className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#708271] uppercase tracking-[0.2em] opacity-80">
            Inventory & Consumption AI
          </span>
          <h1 className="text-3xl font-serif italic text-[#353535]">
            Pantry Tracker
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {lowOrExpiringItems.length > 0 && (
            <button
              id="pantry-auto-restock-btn"
              onClick={() => onAutoRestockLow(lowOrExpiringItems)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#708271] text-white text-xs font-semibold hover:bg-[#5e705f] shadow-xs active:scale-95 transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Restock Low Items ({lowOrExpiringItems.length})</span>
            </button>
          )}

          <button
            id="pantry-add-item-trigger-btn"
            onClick={() => setIsAddingItem(true)}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-white border border-black/5 text-xs font-semibold text-[#353535] hover:bg-[#FAF9F6] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#708271]" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-black/5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-60 text-[#353535]">Total Tracked</span>
            <Package className="w-4 h-4 text-[#708271]" />
          </div>
          <p className="text-3xl font-serif italic text-[#353535]">{items.length}</p>
          <p className="text-[11px] opacity-60 text-[#353535]">Pantry staples & ingredients</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#D4A373]/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#D4A373]">Expiring Soon</span>
            <Clock className="w-4 h-4 text-[#D4A373]" />
          </div>
          <p className="text-3xl font-serif italic text-[#353535]">
            {expiringCount}
          </p>
          <p className="text-[11px] opacity-60 text-[#353535]">Perishables needing early use</p>
        </div>

        <div className="p-5 rounded-3xl bg-red-50/70 border border-red-200/50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-900">Running Low</span>
            <AlertTriangle className="w-4 h-4 text-red-700" />
          </div>
          <p className="text-3xl font-serif italic text-[#353535]">
            {lowCount}
          </p>
          <p className="text-[11px] opacity-70 text-red-800">Below 50% remaining threshold</p>
        </div>
      </div>

      {isAddingItem && (
        <form onSubmit={handleCreatePantryItem} className="p-5 rounded-3xl bg-white border border-[#708271] shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#353535]">Add New Pantry Item</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              id="pantry-item-name-input"
              type="text"
              placeholder="Item name (e.g., Olive Oil, Basmati Rice)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="px-3.5 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl focus:outline-none focus:border-[#708271]"
              autoFocus
            />

            <select
              id="pantry-item-category-select"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as Category)}
              className="px-3 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl focus:outline-none focus:border-[#708271]"
            >
              <option value="Produce">Produce</option>
              <option value="Dairy">Dairy</option>
              <option value="Pantry">Pantry</option>
              <option value="Bakery">Bakery</option>
              <option value="Meat & Seafood">Meat & Seafood</option>
              <option value="Snacks">Snacks</option>
              <option value="Beverages">Beverages</option>
              <option value="Household">Household</option>
              <option value="Personal Care">Personal Care</option>
            </select>

            <div className="flex items-center space-x-2">
              <input
                id="pantry-item-qty-input"
                type="number"
                min="1"
                value={newItemQty}
                onChange={(e) => setNewItemQty(parseInt(e.target.value, 10))}
                className="w-16 px-3 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl"
              />
              <input
                id="pantry-item-unit-input"
                type="text"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                placeholder="Unit (e.g., bottle, kg)"
                className="flex-1 px-3 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs opacity-60 text-[#353535]">Initial Remaining: {newItemRemaining}%</span>
            <div className="flex items-center space-x-2">
              <button
                id="pantry-save-new-btn"
                type="submit"
                className="px-4 py-2 bg-[#708271] text-white text-xs font-semibold rounded-xl hover:bg-[#5e705f]"
              >
                Save to Database
              </button>
              <button
                id="pantry-cancel-new-btn"
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="px-3 py-2 bg-[#E2E8CE]/60 text-[#353535] text-xs font-medium rounded-xl hover:bg-[#E2E8CE]"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'expiring', label: `Expiring Soon (${expiringCount})` },
            { id: 'low', label: `Running Low (${lowCount})` },
            { id: 'good', label: `Well Stocked (${goodCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              id={`pantry-filter-${tab.id}`}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                selectedFilter === tab.id
                  ? 'bg-[#353535] text-white shadow-xs'
                  : 'bg-white text-[#353535]/70 border border-black/5 hover:border-[#708271]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#708271] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="pantry-search-input"
            type="text"
            placeholder="Search pantry items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-3.5 py-1.5 text-xs bg-white border border-black/5 rounded-xl focus:outline-none focus:border-[#708271] shadow-xs"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-black/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] text-[#708271] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#353535]">No Items Found</h3>
          <p className="text-xs opacity-60 text-[#353535] max-w-sm mx-auto">
            Add items manually above or scan a grocery receipt to populate your pantry automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isExpiring = item.status === 'expiring_soon';
            const isLow = item.status === 'running_low' || item.status === 'critically_low';

            return (
              <div
                key={item.id}
                id={`pantry-card-${item.id}`}
                className="p-4 rounded-3xl bg-white border border-black/5 shadow-xs flex flex-col justify-between space-y-3 hover:border-[#708271]/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      {item.image ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={item.image} 
                          alt={item.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-black/5 shrink-0" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#E2E8CE] text-[#708271] flex items-center justify-center font-bold text-xs shrink-0">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#353535] truncate">{item.name}</h4>
                        <p className="text-[11px] opacity-60 text-[#353535] truncate">
                          {item.quantity} {item.unit} • {item.category}
                        </p>
                      </div>
                    </div>

                    <button
                      id={`pantry-delete-btn-${item.id}`}
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 opacity-40 hover:opacity-100 hover:text-red-600 rounded-lg transition-colors"
                      title="Remove from Pantry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isExpiring 
                        ? 'bg-[#D4A373]/20 text-[#D4A373]'
                        : isLow 
                        ? 'bg-red-100 text-red-900'
                        : 'bg-[#E2E8CE] text-[#708271]'
                    }`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    {item.predictedRunoutDate && (
                      <span className="text-[10px] opacity-60 text-[#353535]">
                        Runout: {item.predictedRunoutDate}
                      </span>
                    )}
                  </div>

                  {item.averageConsumptionRate && (
                    <p className="text-[11px] opacity-60 text-[#353535] italic truncate">
                      "{item.averageConsumptionRate}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-black/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] opacity-60 text-[#353535]">
                    <span>Stock Level:</span>
                    <span className="font-bold opacity-100 text-[#353535]">{item.estimatedRemaining}%</span>
                  </div>
                  <input
                    id={`pantry-slider-${item.id}`}
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={item.estimatedRemaining}
                    onChange={(e) => handleUpdateRemaining(item, parseInt(e.target.value, 10))}
                    className="w-full accent-[#708271] cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};