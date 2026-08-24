import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Mic, 
  TrendingDown,
  ShoppingBag,
  Edit2,
  X
} from 'lucide-react';
import { ShoppingList, ShoppingItem, Category } from '../types';
import { DEMO_PRODUCTS } from '../data/products';
import { optimizeShoppingList } from '../lib/substitutes';

interface ListsViewProps {
  lists: ShoppingList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onCreateList: (title: string, budget?: number) => void;
  onDeleteList: (id: string) => void;
  onUpdateListTitle?: (listId: string, newTitle: string, newBudget?: number) => void;
  onToggleItem: (listId: string, itemId: string) => void;
  onAddItem: (listId: string, item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteItem: (listId: string, itemId: string) => void;
  onOpenVoice: () => void;
  onMoveCompletedToPantry: (listId: string) => void;
}

export const ListsView: React.FC<ListsViewProps> = ({
  lists = [],
  activeListId,
  onSelectList,
  onCreateList,
  onDeleteList,
  onUpdateListTitle,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onOpenVoice,
  onMoveCompletedToPantry
}) => {
  const [viewMode, setViewMode] = useState<'plan' | 'active'>('plan');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListBudget, setNewListBudget] = useState('');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editBudgetValue, setEditBudgetValue] = useState('');
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>('Pantry');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('pack');
  const [newItemPrice, setNewItemPrice] = useState(100);

  const activeList = useMemo(
    () => lists.find(l => l.id === activeListId) || lists[0] || null,
    [lists, activeListId]
  );

  const { completedCount, totalCount, progressPct, totalEstimated } = useMemo(() => {
    if (!activeList?.items) {
      return { completedCount: 0, totalCount: 0, progressPct: 0, totalEstimated: 0 };
    }
    const completed = activeList.items.filter(i => i.completed).length;
    const total = activeList.items.length;
    const pct = total > 0 ? (completed / total) * 100 : 0;
    const estimated = activeList.items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
    return { completedCount: completed, totalCount: total, progressPct: pct, totalEstimated: estimated };
  }, [activeList]);

  const basketOptimization = useMemo(
    () => (activeList?.items ? optimizeShoppingList(activeList.items) : null),
    [activeList]
  );

  const categoriesInList = useMemo(
    () => Array.from(new Set(activeList?.items?.map(i => i.category) || [])),
    [activeList]
  );

  const handleToggle = (itemId: string) => {
    if (!activeList) return;
    onToggleItem(activeList.id, itemId);

    const currentItem = activeList.items.find(i => i.id === itemId);
    if (currentItem && !currentItem.completed && completedCount + 1 === totalCount) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleCreateNewList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    onCreateList(newListTitle.trim(), newListBudget ? parseInt(newListBudget, 10) : undefined);
    setNewListTitle('');
    setNewListBudget('');
    setIsCreatingList(false);
  };

  const handleStartEdit = () => {
    if (!activeList) return;
    setEditTitleValue(activeList.title);
    setEditBudgetValue(activeList.budget ? String(activeList.budget) : '');
    setIsEditingTitle(true);
  };

  const handleSaveTitleEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeList || !editTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const parsedBudget = editBudgetValue ? parseInt(editBudgetValue, 10) : undefined;
    onUpdateListTitle?.(activeList.id, editTitleValue.trim(), parsedBudget);
    setIsEditingTitle(false);
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeList) return;

    const matched = DEMO_PRODUCTS.find(p => p.name.toLowerCase().includes(newItemName.toLowerCase()));

    onAddItem(activeList.id, {
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQty || 1,
      unit: newItemUnit || 'pack',
      estimatedPrice: matched ? matched.price : newItemPrice,
      brand: matched?.brand,
      image: matched?.image,
      completed: false,
      source: 'manual'
    });

    setNewItemName('');
    setNewItemQty(1);
  };

  return (
    <div id="lists-view-container" className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <span className="text-[11px] font-bold text-[#708271] uppercase tracking-[0.2em] opacity-80">
            Shopping Manager
          </span>
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitleEdit} className="flex flex-wrap items-center gap-2 mt-1">
              <input
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                placeholder="List Title"
                className="px-3 py-1.5 bg-white border border-[#708271] rounded-xl text-lg font-serif italic text-[#353535] focus:outline-none shadow-xs"
                autoFocus
              />
              <input
                type="number"
                value={editBudgetValue}
                onChange={(e) => setEditBudgetValue(e.target.value)}
                placeholder="Budget ₹"
                className="w-24 px-3 py-1.5 bg-white border border-black/15 rounded-xl text-xs font-semibold text-[#353535] focus:outline-none"
              />
              <button
                type="submit"
                className="p-2 bg-[#708271] text-white rounded-xl hover:bg-[#5e705f] shadow-xs"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="p-2 bg-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-300"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-serif italic text-[#353535]">
                {activeList?.title || 'My Shopping Lists'}
              </h1>
              {activeList && (
                <button
                  onClick={handleStartEdit}
                  className="p-1.5 text-neutral-400 hover:text-[#353535] hover:bg-black/5 rounded-lg transition-colors"
                  title="Rename List"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-[#E2E8CE]/60 p-1 rounded-xl flex items-center">
            <button
              id="list-mode-plan-btn"
              onClick={() => setViewMode('plan')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'plan'
                  ? 'bg-white text-[#353535] shadow-xs'
                  : 'text-[#353535]/60 hover:text-[#353535]'
              }`}
            >
              Plan Mode
            </button>
            <button
              id="list-mode-active-btn"
              onClick={() => setViewMode('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                viewMode === 'active'
                  ? 'bg-[#708271] text-white shadow-xs'
                  : 'text-[#353535]/60 hover:text-[#353535]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>In-Store Active</span>
            </button>
          </div>

          <button
            id="list-voice-btn"
            onClick={onOpenVoice}
            className="p-2 rounded-xl bg-white border border-black/5 text-[#708271] hover:bg-[#FAF9F6] shadow-xs"
            title="Voice Assistant"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {lists.map((list) => {
          const isSelected = list.id === activeList?.id;
          const completed = list.items.filter(i => i.completed).length;
          return (
            <button
              key={list.id}
              id={`list-tab-${list.id}`}
              onClick={() => {
                onSelectList(list.id);
                setIsEditingTitle(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center space-x-2 border ${
                isSelected
                  ? 'bg-[#353535] text-white border-[#353535] shadow-xs'
                  : 'bg-white text-[#353535]/70 border-black/5 hover:border-[#708271]'
              }`}
            >
              <span className="truncate max-w-[140px]">{list.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-[#E2E8CE]/60 text-[#708271]'
              }`}>
                {completed}/{list.items.length}
              </span>
            </button>
          );
        })}

        <button
          id="list-create-new-tab-btn"
          onClick={() => setIsCreatingList(true)}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-dashed border-black/20 text-[#708271] hover:bg-[#FAF9F6] shrink-0 flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New List</span>
        </button>
      </div>

      {isCreatingList && (
        <form onSubmit={handleCreateNewList} className="p-4 rounded-2xl bg-white border border-[#708271] shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <input
            id="new-list-title-input"
            type="text"
            placeholder="List Title (e.g., Weekly Groceries, Dinner Party)"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl focus:outline-none focus:border-[#708271]"
            autoFocus
          />
          <input
            id="new-list-budget-input"
            type="number"
            placeholder="Budget Cap ₹ (Optional)"
            value={newListBudget}
            onChange={(e) => setNewListBudget(e.target.value)}
            className="w-full sm:w-36 px-3.5 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl focus:outline-none focus:border-[#708271]"
          />
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              id="new-list-save-btn"
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2 bg-[#708271] text-white text-xs font-semibold rounded-xl hover:bg-[#5e705f]"
            >
              Create
            </button>
            <button
              id="new-list-cancel-btn"
              type="button"
              onClick={() => setIsCreatingList(false)}
              className="px-3 py-2 bg-[#E2E8CE]/60 text-[#353535] text-xs font-medium rounded-xl hover:bg-[#E2E8CE]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {activeList ? (
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-black/5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs opacity-60 text-[#353535]">Checklist Progress</p>
              <h3 className="text-base font-bold text-[#353535]">
                {completedCount} of {totalCount} items picked ({Math.round(progressPct)}%)
              </h3>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs opacity-60 text-[#353535]">Estimated Basket Total</p>
                <p className="text-lg font-bold text-[#708271]">₹{totalEstimated}</p>
              </div>
              {activeList.budget && (
                <div className="text-right border-l border-black/5 pl-4">
                  <p className="text-xs opacity-60 text-[#353535]">Budget Target</p>
                  <p className="text-lg font-bold text-[#D4A373]">₹{activeList.budget}</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-[#FAF9F6] border border-black/5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                progressPct === 100 ? 'bg-emerald-500' : 'bg-[#708271]'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {basketOptimization && basketOptimization.totalSavings > 0 && viewMode === 'plan' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-emerald-700" />
                <span>
                  <strong>AI Budget Optimizer:</strong> {basketOptimization.itemSwaps.length} smart substitutions available to save <strong>₹{basketOptimization.totalSavings}</strong>.
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-10 text-center rounded-3xl bg-white border border-black/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] text-[#708271] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#353535]">No Shopping List Found</h3>
          <p className="text-xs opacity-60 text-[#353535] max-w-sm mx-auto">
            Create a list or speak to the voice assistant to add items instantly.
          </p>
        </div>
      )}

      {viewMode === 'plan' && activeList && (
        <div className="space-y-6">
          <form onSubmit={handleAddItemSubmit} className="p-4 rounded-3xl bg-white border border-black/5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-[#708271]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#353535]">Add Item to Checklist</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                id="add-item-name-input"
                type="text"
                placeholder="Item name (e.g., Almond Milk, Penne)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="sm:col-span-2 px-3.5 py-2 text-xs bg-[#FAF9F6] border border-black/10 rounded-xl focus:outline-none focus:border-[#708271]"
              />

              <select
                id="add-item-category-select"
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

              <button
                id="add-item-submit-btn"
                type="submit"
                disabled={!newItemName.trim()}
                className="px-4 py-2 bg-[#708271] disabled:bg-neutral-300 text-white text-xs font-semibold rounded-xl hover:bg-[#5e705f] transition-colors"
              >
                Add Item
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {activeList.items.length === 0 ? (
              <p className="text-xs opacity-50 py-8 text-center bg-white rounded-2xl border border-black/5">
                No items in this list yet. Type above or tap the microphone to add items.
              </p>
            ) : (
              activeList.items.map((item) => (
                <div
                  key={item.id}
                  id={`plan-item-row-${item.id}`}
                  className={`p-3.5 rounded-2xl bg-white border transition-all flex items-center justify-between gap-3 ${
                    item.completed 
                      ? 'border-black/5 bg-[#FAF9F6]/60 opacity-60' 
                      : 'border-black/5 hover:border-[#708271]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <button
                      id={`toggle-item-checkbox-${item.id}`}
                      onClick={() => handleToggle(item.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                        item.completed 
                          ? 'bg-[#708271] border-[#708271] text-white' 
                          : 'border-neutral-300 hover:border-[#708271]'
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {item.image && (
                      <img 
                        referrerPolicy="no-referrer"
                        src={item.image} 
                        alt={item.name} 
                        className="w-9 h-9 rounded-lg object-cover border border-black/5 shrink-0" 
                      />
                    )}

                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${
                        item.completed ? 'line-through opacity-60 text-[#353535]' : 'text-[#353535]'
                      }`}>
                        {item.name}
                      </p>
                      <p className="text-[11px] opacity-60 text-[#353535] truncate">
                        {item.quantity} {item.unit} • {item.category} {item.brand ? `• ${item.brand}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#353535]">₹{item.estimatedPrice}</p>
                      {item.source === 'plan' && (
                        <span className="text-[9px] font-semibold text-[#708271] bg-[#708271]/10 px-1.5 py-0.5 rounded">
                          Goal Item
                        </span>
                      )}
                    </div>

                    <button
                      id={`delete-item-btn-${item.id}`}
                      onClick={() => onDeleteItem(activeList.id, item.id)}
                      className="p-1.5 opacity-50 hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onDeleteList(activeList.id)}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete List</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === 'active' && activeList && (
        <div className="space-y-6">
          <div className="p-3 bg-[#E2E8CE]/60 rounded-2xl text-xs text-[#708271] font-semibold flex items-center justify-between">
            <span>🛒 In-Store Mode: Grouped by aisle with large 1-touch targets.</span>
            {completedCount > 0 && (
              <button
                id="move-to-pantry-btn"
                onClick={() => onMoveCompletedToPantry(activeList.id)}
                className="px-3 py-1.5 bg-[#708271] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#5e705f]"
              >
                Transfer Completed to Pantry
              </button>
            )}
          </div>

          {categoriesInList.length === 0 ? (
            <p className="text-xs opacity-50 py-8 text-center bg-white rounded-2xl border border-black/5">
              Your shopping list is currently empty.
            </p>
          ) : (
            categoriesInList.map((category) => {
              const categoryItems = activeList.items.filter(i => i.category === category);
              return (
                <div key={category} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 text-[#353535] px-1">
                    Aisle: {category} ({categoryItems.length})
                  </h3>

                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        id={`active-item-target-${item.id}`}
                        onClick={() => handleToggle(item.id)}
                        className={`min-h-[52px] p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between gap-4 ${
                          item.completed
                            ? 'bg-[#FAF9F6] border-black/5 opacity-60'
                            : 'bg-white border-black/5 shadow-xs hover:border-[#708271] active:scale-[0.99]'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                            item.completed
                              ? 'bg-[#708271] border-[#708271] text-white'
                              : 'border-neutral-300 bg-[#FAF9F6]'
                          }`}>
                            {item.completed && <Check className="w-5 h-5" />}
                          </div>

                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${
                              item.completed ? 'line-through opacity-60 text-[#353535]' : 'text-[#353535]'
                            }`}>
                              {item.name}
                            </p>
                            <p className="text-xs opacity-60 text-[#353535]">
                              {item.quantity} {item.unit} {item.brand ? `• ${item.brand}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-[#353535]">₹{item.estimatedPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};