
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'learn', icon: 'fa-house', label: 'APRENDER', color: 'text-[#1cb0f6]', activeColor: 'bg-[#ddf4ff] border-[#84d8ff]' },
    { id: 'practice', icon: 'fa-dumbbell', label: 'BATALHAR', color: 'text-[#58cc02]', activeColor: 'bg-[#d7ffb8] border-[#b8f28b]' },
    { id: 'leaderboard', icon: 'fa-ranking-star', label: 'LIGAS', color: 'text-[#ffc800]', activeColor: 'bg-[#fff4d7] border-[#ffdb84]' },
    { id: 'shop', icon: 'fa-bag-shopping', label: 'ARSENAL', color: 'text-[#ff4b4b]', activeColor: 'bg-[#ffdbdb] border-[#ffc1c1]' },
    { id: 'profile', icon: 'fa-circle-user', label: 'PERFIL', color: 'text-[#ce82ff]', activeColor: 'bg-[#f3e8ff] border-[#d8b4fe]' },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#e5e5e5] z-50 md:sticky md:top-0 md:h-screen md:w-72 md:border-r-2 md:border-t-0 p-4 md:px-6 md:py-8 flex md:flex-col items-center md:items-stretch overflow-y-auto">
      <div className="hidden md:flex items-center gap-4 mb-12 px-2">
        <div className="w-12 h-12 bg-[#1cb0f6] rounded-[18px] flex items-center justify-center shadow-[0_5px_0_0_#1899d6]">
          <i className="fa-solid fa-brain text-white text-2xl"></i>
        </div>
        <h1 className="text-xl font-[900] text-[#1cb0f6] tracking-tighter leading-none">MEDCORTEX<br/><span className="text-[12px] text-[#ff4b4b] tracking-[0.2em] font-black uppercase">ONE</span></h1>
      </div>

      <nav className="flex md:flex-col w-full justify-around md:justify-start gap-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              flex items-center gap-5 px-5 py-4 rounded-[20px] transition-all btn-duo group
              ${activeTab === item.id 
                ? `${item.activeColor} border-2 text-[#1cb0f6]` 
                : 'text-[#777] border-2 border-transparent hover:bg-gray-50 hover:border-gray-100'}
            `}
          >
            <div className={`transition-transform duration-200 group-hover:scale-110 ${activeTab === item.id ? 'scale-110' : ''}`}>
                <i className={`fa-solid ${item.icon} text-2xl ${activeTab === item.id ? item.color : 'text-[#afafaf]'}`}></i>
            </div>
            <span className={`hidden md:inline font-[900] text-sm tracking-widest ${activeTab === item.id ? 'text-inherit' : 'text-[#777]'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="hidden md:block mt-auto p-6 bg-gradient-to-br from-[#1cb0f6] to-[#16a2e4] rounded-[32px] text-white shadow-[0_6px_0_0_#1899d6] relative overflow-hidden group cursor-pointer active:translate-y-1 active:shadow-none transition-all">
        <div className="relative z-10">
            <p className="font-[900] text-[10px] uppercase tracking-[0.2em] mb-2 text-white/80">Acesso One</p>
            <p className="font-black text-lg leading-tight mb-2">Vença a Batalha com o MedCortex+</p>
            <button className="bg-white text-[#1cb0f6] w-full py-2 rounded-xl font-[900] text-[10px] uppercase tracking-widest shadow-sm">Assinar</button>
        </div>
        <i className="fa-solid fa-crown absolute -right-6 -bottom-6 text-white/10 text-8xl rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
      </div>
    </aside>
  );
};

export default Sidebar;
