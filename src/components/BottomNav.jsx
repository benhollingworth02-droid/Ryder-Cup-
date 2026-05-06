export default function BottomNav({ tabs, activeTab, onTabChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gray-900/95 border-t border-gray-800 backdrop-blur-sm z-40">
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors active:scale-95 ${
              activeTab === tab.id
                ? 'text-green-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide leading-none ${
              activeTab === tab.id ? 'text-green-400' : 'text-gray-500'
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
