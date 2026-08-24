import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Compass, 
  Search, 
  Activity, 
  Mic, 
  Layers 
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab?: string;
  activeTab?: string;
  onNavigate?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  onOpenVoice: () => void;
  user?: UserProfile | null;
  unreadCount?: number;
  unreadRecommendationsCount?: number;
  activeListsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  activeTab,
  onNavigate,
  setActiveTab,
  onOpenVoice,
  user,
  unreadCount = 0,
  unreadRecommendationsCount = 0,
  activeListsCount = 0
}) => {
  const selectedTab = currentTab || activeTab || 'home';

  const handleNav = (tab: string) => {
    onNavigate?.(tab);
    setActiveTab?.(tab);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Layers },
    { id: 'lists', label: 'Shopping Lists', icon: ShoppingCart, badge: activeListsCount },
    { id: 'pantry', label: 'Pantry', icon: Package },
    { id: 'discover', label: 'Discover', icon: Compass, badge: unreadRecommendationsCount },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'activity', label: 'AI Activity', icon: Activity, hasDot: unreadCount > 0 },
  ];

  return (
    <>
      <header 
        id="app-header"
        className="h-20 px-4 sm:px-8 lg:px-10 flex items-center justify-between border-b border-black/5 bg-[#FAF9F6]/90 backdrop-blur-md sticky top-0 z-40"
      >
        <div 
          id="brand-logo-button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 bg-[#708271] rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#353535] leading-none">ShopSense</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 text-[#353535] mt-1 font-sans">
              Shop with intent
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = selectedTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`transition-colors relative py-1 flex items-center gap-1.5 ${
                  isActive 
                    ? 'text-[#708271] font-semibold after:content-[\'\'] after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-[#708271] after:rounded-full' 
                    : 'text-[#353535]/80 hover:text-[#353535]'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E2E8CE] text-[#708271]">
                    {item.badge}
                  </span>
                ) : null}
                {item.hasDot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4A373] shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            id="header-voice-btn"
            onClick={onOpenVoice}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#E2E8CE] text-[#708271] rounded-xl text-xs font-bold hover:bg-[#d6ddbd] transition-colors shadow-xs active:scale-95"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Plan</span>
          </button>

          <div 
            id="user-profile-header"
            onClick={() => handleNav('profile')}
            className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-black/[0.03] transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#353535] leading-tight">
                {user?.displayName || 'Ishaan Mittal'}
              </p>
              <p className="text-xs font-medium text-[#708271]">Intent Plan Active</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E2E8CE] border border-[#708271]/20 flex items-center justify-center text-[#708271] font-bold text-sm overflow-hidden shadow-xs">
              {user?.photoURL ? (
                <img 
                  referrerPolicy="no-referrer" 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.displayName?.charAt(0) || 'I'
              )}
            </div>
          </div>
        </div>
      </header>

      <nav 
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-black/5 z-40 flex items-center justify-around px-2 pb-1 shadow-lg"
      >
        <button
          id="mobile-nav-home"
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-xs transition-colors ${
            selectedTab === 'home' ? 'text-[#708271] font-bold' : 'text-[#353535]/60'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          id="mobile-nav-lists"
          onClick={() => handleNav('lists')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-xs relative transition-colors ${
            selectedTab === 'lists' ? 'text-[#708271] font-bold' : 'text-[#353535]/60'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Lists</span>
          {activeListsCount > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 bg-[#708271] rounded-full" />
          )}
        </button>

        <button
          id="mobile-nav-voice-fab"
          onClick={onOpenVoice}
          className="flex flex-col items-center justify-center -mt-6 w-12 h-12 rounded-full bg-[#708271] text-white shadow-lg shadow-[#708271]/30 active:scale-95 border-2 border-[#FAF9F6] transition-transform"
          aria-label="Voice Assistant"
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          id="mobile-nav-pantry"
          onClick={() => handleNav('pantry')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-xs transition-colors ${
            selectedTab === 'pantry' ? 'text-[#708271] font-bold' : 'text-[#353535]/60'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Pantry</span>
        </button>

        <button
          id="mobile-nav-discover"
          onClick={() => handleNav('discover')}
          className={`flex flex-col items-center justify-center w-14 py-1 text-xs transition-colors ${
            selectedTab === 'discover' ? 'text-[#708271] font-bold' : 'text-[#353535]/60'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Discover</span>
        </button>
      </nav>
    </>
  );
};