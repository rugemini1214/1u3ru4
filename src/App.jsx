import React, { useState, useEffect, useRef } from 'react';

// ⚠️ 注意：在您的電腦上開發或部屬時，請【取消註解】下面這一行，以啟用 PWA 自動更新功能
// import { useRegisterSW } from 'virtual:pwa-register/react';

// ⚠️ 預覽環境專用 Mock (部屬時請刪除這段 Mock，並使用上面的 import)
const useRegisterSW = () => ({
  needRefresh: [false, () => {}],
  updateServiceWorker: () => {}
});

import { 
  Plus, 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  Check, 
  Indent, 
  Outdent, 
  Calendar, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  X, 
  Bookmark, 
  Download, 
  Upload,
  RotateCcw,
  CheckSquare,
  RefreshCw,
  Edit2,
  Folder, 
  Minus,
  Type 
} from 'lucide-react';

/**
 * 版本編號與全域設定
 */
const APP_VERSION = "v2.5";

// 定義色系
const COLOR_PALETTE = [
  { id: 'default', label: '預設', text: '#374151', bg: 'transparent', bgLabel: '無' }, 
  { id: 'red',     label: '紅',   text: '#ef4444', bg: '#fee2e2' }, 
  { id: 'green',   label: '綠',   text: '#16a34a', bg: '#dcfce7' }, 
  { id: 'blue',    label: '藍',   text: '#2563eb', bg: '#dbeafe' }, 
];

const FONTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+TC:wght@400;700&display=swap');
  
  /* 鎖定 html, body 防止彈性捲動 */
  html, body, #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
    overscroll-behavior: none;
    position: fixed; /* 強制固定 */
  }

  body {
    font-family: 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', sans-serif;
    background-color: #f9fafb;
  }

  /* Title Font */
  .handwriting-title {
    font-family: 'Dancing Script', cursive;
    letter-spacing: 0.5px;
  }

  /* Rich Text Editor */
  .editor-content {
    min-height: 50vh;
    outline: none;
    line-height: 1.7;
    font-size: 1.15rem; /* 預設字體加大 */
  }
  
  /* 定義 execCommand 產生的 font size 對應大小 */
  font[size="1"] { font-size: 0.85rem; } /* 小 */
  font[size="3"] { font-size: 1.15rem; } /* 標準 (同預設) */
  font[size="4"] { font-size: 1.4rem; font-weight: bold; } /* 大 */
  font[size="5"] { font-size: 1.75rem; font-weight: bold; border-bottom: 2px solid #fdba74; } /* 特大 (加底線強調) */

  .editor-content blockquote {
    margin-left: 1.5rem;
    padding-left: 0.5rem;
    border-left: 3px solid #fdba74;
    font-size: 0.95em; 
    color: #6b7280;
  }

  .link-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #ffedd5;
    color: #ea580c;
    border-radius: 4px;
    padding: 0 4px;
    margin: 0 2px;
    text-decoration: none;
    font-size: 0.8em;
    vertical-align: middle;
    height: 1.4em;
    width: 1.4em;
  }

  .divider-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0;
    opacity: 0.5;
  }
  .divider-line {
    height: 2px;
    background-color: #e5e7eb;
    width: 100%;
    border-radius: 2px;
  }
  
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  .pinned-note {
    border-left: 4px solid #f97316 !important; 
    background-color: white !important;
  }
  
  .sticky-memo textarea {
    background-color: transparent;
    line-height: 1.6em;
    font-size: 1rem;
  }

  .checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .checklist-item:last-child { border-bottom: none; }
`;

export default function App() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  // --- State ---
  const [view, setView] = useState('categories'); 
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [memo, setMemo] = useState(''); 
  
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [sortBy, setSortBy] = useState('time'); 
  
  const [categorySearch, setCategorySearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  
  // New Category States
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('general'); // 'general' | 'form' | 'divider'
  
  const fileInputRef = useRef(null); 

  useEffect(() => {
    const savedCategories = localStorage.getItem('litenote_categories');
    const savedNotes = localStorage.getItem('litenote_notes');
    const savedMemo = localStorage.getItem('litenote_memo');
    
    if (savedCategories) {
      let parsed = JSON.parse(savedCategories);
      
      // v2.5 資料結構遷移：將 [表單] 前綴移除，改用 type 欄位
      // 這樣以後改名就不會影響功能
      const migrated = parsed.map(c => {
        // 如果已經有 type，直接回傳
        if (c.type) return c;

        // 如果是舊的表單命名方式
        if (c.name.includes('[表單]')) {
          return { 
            ...c, 
            name: c.name.replace('[表單]', '').trim(), // 移除前綴文字
            type: 'form' // 標記為表單類型
          };
        }
        
        // 如果是分隔線
        if (c.name === '---') {
          return { ...c, type: 'divider' };
        }

        // 預設
        return { ...c, type: 'general' };
      });

      setCategories(migrated);
    } else {
      setCategories([]);
    }

    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedMemo) setMemo(savedMemo);
  }, []);

  useEffect(() => { localStorage.setItem('litenote_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('litenote_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('litenote_memo', memo); }, [memo]);

  // 新的檢查方式：直接看 type 欄位
  const isFormCategory = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat && cat.type === 'form';
  };

  // --- Handlers ---

  const handleExport = () => {
    const data = { version: APP_VERSION, categories, notes, memo, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `litenote_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowSettingsModal(false);
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.categories && data.notes) {
          if (window.confirm('還原將會覆蓋現有資料，確定繼續嗎？')) {
            // Import 時也做一次檢查/遷移，避免舊備份蓋掉新結構
            const migratedCategories = data.categories.map(c => {
               if (c.type) return c;
               if (c.name.includes('[表單]')) return { ...c, name: c.name.replace('[表單]', '').trim(), type: 'form' };
               if (c.name === '---') return { ...c, type: 'divider' };
               return { ...c, type: 'general' };
            });
            
            setCategories(migratedCategories);
            setNotes(data.notes);
            if (data.memo) setMemo(data.memo);
            alert('資料還原成功！');
            setShowSettingsModal(false);
          }
        } else { alert('無效的備份檔案格式。'); }
      } catch (err) { alert('讀取檔案失敗。'); }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleCreateCategory = () => {
    let finalName = newCategoryName.trim();
    if (newCategoryType === 'divider') {
      finalName = '---';
    } else {
      if (!finalName) return; 
      // 不再需要手動加 [表單] 前綴
    }
    
    const newCat = { 
      id: Date.now().toString(), 
      name: finalName,
      type: newCategoryType // 直接儲存類型
    };
    
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    setNewCategoryType('general');
    setShowNewCategoryModal(false);
  };

  const handleRenameCategory = (id, oldName) => {
    const newName = window.prompt("修改分類名稱：", oldName);
    if (newName && newName.trim() !== "") {
      setCategories(categories.map(c => c.id === id ? { ...c, name: newName } : c));
    }
  };

  const handleDeleteCategory = (id, e) => {
    e.stopPropagation();
    if (window.confirm('確定刪除此分類及其所有筆記嗎？')) {
      setCategories(categories.filter(c => c.id !== id));
      setNotes(notes.filter(n => n.categoryId !== id));
    }
  };

  const moveCategory = (index, direction, e) => {
    e.stopPropagation();
    const newCategories = [...categories];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      setCategories(newCategories);
    }
  };

  const handleCreateNote = () => {
    const isForm = isFormCategory(activeCategoryId);
    const newNote = {
      id: Date.now().toString(),
      categoryId: activeCategoryId,
      title: isForm ? '未命名表單' : '未命名筆記',
      content: isForm ? JSON.stringify([]) : '', 
      type: isForm ? 'checklist' : 'text', 
      isPinned: false, 
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setView('editor');
  };

  const handleUpdateNote = (id, updates) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('確定刪除此項目？')) {
      setNotes(notes.filter(n => n.id !== id));
      setView('notes');
    }
  };

  // --- Render Views ---

  const renderCategories = () => {
    return (
      <div className="flex flex-col h-full bg-gray-50 w-full overflow-hidden">
        <header className="bg-white p-5 pb-3 shadow-sm sticky top-0 z-10 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-4xl font-bold text-orange-600 handwriting-title pt-2">litenote</h1>
            <div className="flex gap-2">
               <button onClick={() => { setCategorySearch(''); setShowSearchModal(true); }} className="w-10 h-10 rounded-full bg-white text-gray-400 hover:bg-gray-50 flex items-center justify-center border border-transparent hover:border-gray-100"><Search size={20} /></button>
               <button onClick={() => setShowSettingsModal(true)} className="w-10 h-10 rounded-full bg-white text-gray-400 hover:bg-gray-50 flex items-center justify-center border border-transparent hover:border-gray-100"><Settings size={20} /></button>
               <button onClick={() => setShowNewCategoryModal(true)} className="w-10 h-10 bg-orange-500 text-white rounded-full hover:bg-orange-600 shadow-lg shadow-orange-200 flex items-center justify-center"><Plus size={24} /></button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 w-full">
          <div className="bg-yellow-100 p-3 rounded-xl border border-yellow-200 shadow-sm mb-4 sticky-memo transform rotate-[0.5deg]">
            <textarea 
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="長期注意事項 / 備忘錄..."
              className="w-full bg-transparent border-none outline-none resize-none text-gray-700 text-base h-24 placeholder:text-yellow-700/30"
              spellCheck="false"
            />
          </div>

          {isManageMode && (
             <div className="bg-orange-50 p-2 mb-2 rounded-lg text-xs text-center text-orange-600 border border-orange-100">管理模式開啟：可修改、排序與刪除分類</div>
          )}

          {categories.map((cat, index) => {
            if (cat.type === 'divider' || cat.name === '---') { // Check both type and name for legacy
              return (
                 <div key={cat.id} className="relative py-1">
                    <div className="divider-item"><div className="divider-line"></div></div>
                    {isManageMode && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 bg-white/90 p-1 rounded-full shadow-sm z-10">
                          <button onClick={(e) => moveCategory(index, -1, e)} className="p-1 text-gray-400 hover:text-orange-500"><ArrowUp size={16}/></button>
                          <button onClick={(e) => moveCategory(index, 1, e)} className="p-1 text-gray-400 hover:text-orange-500"><ArrowDown size={16}/></button>
                          <button onClick={(e) => handleDeleteCategory(cat.id, e)} className="p-1 text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    )}
                 </div>
              );
            }

            const count = notes.filter(n => n.categoryId === cat.id).length;
            const isForm = cat.type === 'form';
            
            return (
              <div 
                key={cat.id}
                onClick={() => { setActiveCategoryId(cat.id); setView('notes'); }}
                className={`relative bg-white p-4 rounded-2xl shadow-sm border ${isForm ? 'border-l-4 border-l-orange-400 border-gray-100' : 'border-orange-100'} flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer hover:shadow-md min-h-[4rem]`}
              >
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    {/* 直接顯示乾淨的名稱，不再需要切字串 */}
                    {cat.name}
                    {isForm && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 rounded">表單</span>}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">{count} 個項目</p>
                </div>
                
                {isManageMode && (
                  <div className="flex items-center gap-1 bg-white pl-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); handleRenameCategory(cat.id, cat.name); }} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full mr-1"><Edit2 size={18}/></button>
                    <div className="flex flex-col mr-2 border-r pr-2 border-gray-100">
                      <button onClick={(e) => moveCategory(index, -1, e)} disabled={index === 0} className="p-1 hover:bg-orange-50 rounded text-gray-400 hover:text-orange-500 disabled:opacity-30"><ArrowUp size={16}/></button>
                      <button onClick={(e) => moveCategory(index, 1, e)} disabled={index === categories.length - 1} className="p-1 hover:bg-orange-50 rounded text-gray-400 hover:text-orange-500 disabled:opacity-30"><ArrowDown size={16}/></button>
                    </div>
                    <button onClick={(e) => handleDeleteCategory(cat.id, e)} className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-full"><Trash2 size={18}/></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNoteList = () => {
    const activeCat = categories.find(c => c.id === activeCategoryId);
    const activeCatName = activeCat?.name;
    const isForm = activeCat?.type === 'form';

    let filtered = notes.filter(n => n.categoryId === activeCategoryId);
    const currentNotes = filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return sortBy === 'time' ? b.updatedAt - a.updatedAt : a.title.localeCompare(b.title);
    });

    return (
      <div className="flex flex-col h-full bg-gray-50 w-full overflow-hidden"> 
        <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button onClick={() => setView('categories')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={26} /></button>
            <h1 className="text-2xl font-bold text-gray-800 truncate tracking-wide pt-1">{activeCatName}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={handleCreateNote}
              className={`w-9 h-9 text-white rounded-full shadow-md flex items-center justify-center active:scale-90 transition-transform ${isForm ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 w-full">
          {currentNotes.length === 0 ? (
            <div className="text-center text-gray-300 mt-20">
              <p className="handwriting-title text-3xl mb-2">Empty...</p>
              <p className="text-sm">點擊右上角新增{isForm ? '表單' : '筆記'}</p>
            </div>
          ) : (
            currentNotes.map(note => {
               if (note.title === '---') {
                 return <div key={note.id} className="relative group py-1" onClick={() => { setActiveNoteId(note.id); setView('editor'); }}><div className="divider-item"><div className="divider-line"></div></div></div>;
               }
               return (
                <div 
                  key={note.id}
                  onClick={() => { setActiveNoteId(note.id); setView('editor'); }}
                  className={`bg-white p-4 rounded-xl shadow-sm border-b-2 border-transparent hover:border-orange-200 active:bg-orange-50 transition-all cursor-pointer ${note.isPinned ? 'pinned-note' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className={`font-bold truncate text-lg flex-1 ${note.isPinned ? 'text-orange-900' : 'text-gray-800'}`}>
                      {isForm && <CheckSquare size={16} className="inline mr-2 text-orange-500 mb-0.5" />}
                      {note.title || '未命名'}
                    </h3>
                    <p className="text-[10px] text-gray-300 font-mono ml-2 shrink-0">
                      {new Date(note.updatedAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderEditor = () => {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return null;

    if (note.type === 'checklist' || isFormCategory(note.categoryId)) {
      return (
        <ChecklistEditor 
          note={note} 
          onUpdate={(updates) => handleUpdateNote(note.id, updates)}
          onBack={() => setView('notes')}
          onDelete={() => handleDeleteNote(note.id)}
        />
      );
    }

    return (
      <RichTextEditor 
        note={note} 
        onUpdate={(updates) => handleUpdateNote(note.id, updates)}
        onBack={() => setView('notes')}
        onDelete={() => handleDeleteNote(note.id)}
      />
    );
  };

  return (
    <div className="fixed inset-0 w-full h-full max-w-md mx-auto bg-white flex flex-col shadow-2xl overflow-hidden">
      <style>{FONTS_CSS}</style>
      
      {needRefresh && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-500">
           <button onClick={() => updateServiceWorker(true)} className="bg-gray-800 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 hover:bg-gray-700">
             <RefreshCw size={18} className="animate-spin-slow"/>
             <span>發現新版本，點擊更新</span>
           </button>
        </div>
      )}

      {/* Main Content View with strict overflow handling */}
      <div className="flex-1 overflow-hidden relative w-full">
        {view === 'categories' && renderCategories()}
        {view === 'notes' && renderNoteList()}
        {view === 'editor' && renderEditor()}
      </div>

      {showSearchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
           <div className="bg-white w-full h-[85vh] sm:h-auto sm:w-[90%] sm:max-w-xs sm:rounded-3xl rounded-t-3xl p-6 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">搜尋</h3>
                <button onClick={() => setShowSearchModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input autoFocus type="text" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="關鍵字..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-base outline-none"/>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                 {notes.filter(n => (n.title.toLowerCase().includes(categorySearch.toLowerCase()) || n.content.includes(categorySearch.toLowerCase())) && categorySearch).map(note => (
                   <div key={note.id} onClick={() => { setActiveCategoryId(note.categoryId); setActiveNoteId(note.id); setView('editor'); setShowSearchModal(false); }} className="bg-white p-4 rounded-xl border border-gray-100 active:scale-[0.98]">
                      <h3 className="font-bold text-gray-800">{note.title || '未命名'}</h3>
                   </div>
                 ))}
                 {!categorySearch && <div className="text-center text-gray-300 mt-10">輸入文字搜尋</div>}
              </div>
           </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
           <div className="bg-white w-full sm:w-[90%] sm:max-w-xs sm:rounded-3xl rounded-t-3xl p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">設定</h3>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
              </div>
              <div className="space-y-3">
                <button onClick={() => setIsManageMode(!isManageMode)} className="w-full p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-700 font-bold">管理分類</span>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isManageMode ? 'bg-orange-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${isManageMode ? 'translate-x-4' : ''}`}></div></div>
                </button>
                <div className="h-[1px] bg-gray-100 my-2"></div>
                <button onClick={handleExport} className="w-full p-4 bg-orange-50 rounded-xl flex items-center gap-3 text-orange-700 font-bold"><Download size={20} />備份資料 (下載)</button>
                <button onClick={handleImportClick} className="w-full p-4 bg-gray-100 rounded-xl flex items-center gap-3 text-gray-700 font-bold"><Upload size={20} />還原資料 (讀取)</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
              </div>
              <div className="mt-6 text-center text-xs text-gray-300">LiteNote {APP_VERSION}</div>
           </div>
        </div>
      )}

      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-[90%] max-w-xs shadow-2xl overflow-hidden">
            <h3 className="text-xl font-bold mb-4 text-gray-800">新增分類</h3>
            
            {/* 類型選擇器 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button 
                onClick={() => setNewCategoryType('general')}
                className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${newCategoryType === 'general' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'}`}
              >
                <Folder size={24} />
                <span className="text-xs font-bold">一般</span>
              </button>
              <button 
                onClick={() => setNewCategoryType('form')}
                className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${newCategoryType === 'form' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'}`}
              >
                <CheckSquare size={24} />
                <span className="text-xs font-bold">表單</span>
              </button>
              <button 
                onClick={() => setNewCategoryType('divider')}
                className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${newCategoryType === 'divider' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'}`}
              >
                <Minus size={24} />
                <span className="text-xs font-bold">分隔線</span>
              </button>
            </div>

            {newCategoryType !== 'divider' ? (
              <input 
                autoFocus
                type="text" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={newCategoryType === 'form' ? "表單名稱..." : "分類名稱..."}
                className="w-full p-4 bg-gray-50 border-none rounded-xl mb-4 text-lg outline-none focus:ring-2 focus:ring-orange-200"
              />
            ) : (
              <div className="w-full p-4 bg-gray-50 rounded-xl mb-4 text-center text-gray-400 text-sm">
                將建立一條視覺分隔線
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowNewCategoryModal(false)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-50 rounded-xl">取消</button>
              <button onClick={handleCreateCategory} className="flex-1 py-3 text-white bg-orange-500 font-bold rounded-xl shadow-lg shadow-orange-200">建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const RichTextEditor = ({ note, onUpdate, onBack, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const contentRef = useRef(null);

  useEffect(() => { if (isEditing && contentRef.current) contentRef.current.innerHTML = note.content; }, [isEditing]);

  const toggleMode = () => {
    if (isEditing) onUpdate({ title, content: contentRef.current ? contentRef.current.innerHTML : note.content });
    setIsEditing(!isEditing);
  };

  const handleTogglePin = () => onUpdate({ isPinned: !note.isPinned });
  // 防止失去焦點
  const execCmd = (e, cmd, val = null) => { 
    e.preventDefault(); 
    document.execCommand(cmd, false, val); 
  };
  
  // 字體大小循環：標準(3) -> 大(4) -> 特大(5) -> 小(1) -> 標準(3)
  const FONT_SIZES = [3, 4, 5, 1];
  const [currentFontSizeIdx, setCurrentFontSizeIdx] = useState(0); // 0 corresponds to size 3

  const cycleFontSize = (e) => {
    e.preventDefault();
    const nextIdx = (currentFontSizeIdx + 1) % FONT_SIZES.length;
    setCurrentFontSizeIdx(nextIdx);
    document.execCommand('fontSize', false, FONT_SIZES[nextIdx]);
  };
  
  const processReadContent = (html) => {
    if (!html) return '<p class="text-gray-300 italic text-center mt-10">點擊右下角筆按鈕開始書寫...</p>';
    return html;
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      <header className="flex justify-between items-center p-2 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="p-3 text-gray-500 rounded-full hover:bg-gray-50"><ChevronLeft size={24} /></button>
        {isEditing ? (
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => onUpdate({title})} className="flex-1 mx-2 text-center font-bold text-xl border-b-2 border-orange-100 outline-none py-1 text-gray-700" placeholder="標題"/>
        ) : (
          <h2 className="flex-1 mx-4 text-center font-bold text-xl truncate text-gray-800">{title}</h2>
        )}
        <div className="flex gap-1">
          <button onClick={handleTogglePin} className={`p-3 rounded-full transition-colors ${note.isPinned ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:bg-gray-50'}`}><Bookmark size={20} fill={note.isPinned ? "currentColor" : "none"} /></button>
          <button onClick={onDelete} className="p-3 text-red-300 rounded-full hover:bg-red-50 hover:text-red-500"><Trash2 size={20} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 relative w-full">
        {isEditing ? (
          <div ref={contentRef} className="editor-content w-full h-full text-gray-700" contentEditable suppressContentEditableWarning placeholder="開始輸入..." />
        ) : (
          <div className="editor-content w-full h-full text-gray-700 prose prose-orange max-w-none" dangerouslySetInnerHTML={{ __html: processReadContent(note.content) }} />
        )}
      </div>

      <div className="p-2 border-t border-gray-100 bg-white/95 backdrop-blur safe-area-bottom pb-6">
        {isEditing ? (
          <div className="flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
             <div className="flex-1 overflow-x-auto hide-scrollbar flex items-center gap-3 pr-2">
                {/* Font Size & Indent */}
                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100 shrink-0">
                  <button onMouseDown={cycleFontSize} className="p-2 hover:bg-white rounded text-gray-600 w-10"><Type size={18}/></button>
                  <div className="w-[1px] bg-gray-200 mx-1"></div>
                  <button onMouseDown={(e) => execCmd(e, 'outdent')} className="p-2 hover:bg-white rounded text-gray-600"><Outdent size={18}/></button>
                  <div className="w-[1px] bg-gray-200 mx-1"></div>
                  <button onMouseDown={(e) => execCmd(e, 'indent')} className="p-2 hover:bg-white rounded text-gray-600"><Indent size={18}/></button>
                </div>
                
                <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
                
                {/* Text Color */}
                <div className="flex gap-2 shrink-0">
                  {COLOR_PALETTE.map(c => <button key={`txt-${c.id}`} onMouseDown={(e) => execCmd(e, 'foreColor', c.text)} className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-white shadow-sm text-sm font-bold" style={{ color: c.text }}>A</button>)}
                </div>
                
                <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
                
                {/* Bg Color */}
                <div className="flex gap-2 shrink-0">
                  {COLOR_PALETTE.map(c => <button key={`bg-${c.id}`} onMouseDown={(e) => execCmd(e, 'hiliteColor', c.bg)} className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm relative" style={{ backgroundColor: c.bg === 'transparent' ? '#fff' : c.bg }} title={c.label}>
                    {c.bg === 'transparent' && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[1px] bg-red-400 rotate-45 transform scale-75"></div></div>}
                  </button>)}
                </div>
             </div>
             <button onClick={toggleMode} className="p-3 bg-orange-500 text-white rounded-xl shadow-md shrink-0 active:scale-95 transition-transform"><Check size={20} /></button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button onClick={toggleMode} className="w-14 h-14 bg-orange-500 text-white rounded-full shadow-xl shadow-orange-200 hover:bg-orange-600 active:scale-90 transition-transform flex items-center justify-center"><Edit3 size={24} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChecklistEditor = ({ note, onUpdate, onBack, onDelete }) => {
  const [items, setItems] = useState(() => {
    try {
      const parsed = JSON.parse(note.content);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  
  const [isEditing, setIsEditing] = useState(items.length === 0);
  const [title, setTitle] = useState(note.title);
  const [newItemText, setNewItemText] = useState('');

  const save = (newItems) => {
    setItems(newItems);
    onUpdate({ content: JSON.stringify(newItems) });
  };

  const handleToggleCheck = (index) => {
    if (isEditing) return;
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    save(newItems);
  };

  const handleResetChecks = () => {
    if (window.confirm('確定要重置所有勾選項目嗎？')) {
      const newItems = items.map(item => ({ ...item, checked: false }));
      save(newItems);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItems = [...items, { text: newItemText, checked: false }];
    save(newItems);
    setNewItemText('');
  };

  const handleDeleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    save(newItems);
  };

  const handleTitleBlur = () => onUpdate({ title });
  const handleTogglePin = () => onUpdate({ isPinned: !note.isPinned });

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
      <header className="flex justify-between items-center p-2 border-b border-gray-100 bg-orange-50/30 shrink-0">
        <button onClick={onBack} className="p-3 text-gray-500 rounded-full hover:bg-gray-50"><ChevronLeft size={24} /></button>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} className="flex-1 mx-2 text-center font-bold text-xl border-b-2 border-orange-100 outline-none py-1 text-gray-800 bg-transparent" placeholder="表單名稱"/>
        <div className="flex gap-1">
          <button onClick={handleTogglePin} className={`p-3 rounded-full transition-colors ${note.isPinned ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:bg-gray-50'}`}><Bookmark size={20} fill={note.isPinned ? "currentColor" : "none"} /></button>
          <button onClick={onDelete} className="p-3 text-red-300 rounded-full hover:bg-red-50 hover:text-red-500"><Trash2 size={20} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24 w-full">
        {items.length === 0 && !isEditing && (
           <div className="text-center text-gray-400 mt-20">沒有檢查項目<br/>點擊右下角設定新增</div>
        )}

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className={`checklist-item ${item.checked ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
              <div 
                onClick={() => handleToggleCheck(index)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${item.checked ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white'}`}
              >
                {item.checked && <Check size={14} strokeWidth={4} />}
              </div>
              
              <div className="flex-1 pt-0.5 text-lg text-gray-700 leading-snug" onClick={() => handleToggleCheck(index)}>
                {item.text}
              </div>

              {isEditing && (
                <button onClick={() => handleDeleteItem(index)} className="p-1 text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <form onSubmit={handleAddItem} className="mt-4 flex gap-2 animate-in fade-in">
            <input 
              autoFocus
              type="text" 
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="輸入新項目..."
              className="flex-1 p-3 bg-gray-50 rounded-xl outline-none border border-gray-200 focus:border-orange-400 text-base"
            />
            <button type="submit" className="p-3 bg-orange-100 text-orange-600 rounded-xl font-bold"><Plus size={24}/></button>
          </form>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-white/95 backdrop-blur safe-area-bottom flex justify-between items-center pb-6">
        {!isEditing ? (
           <button onClick={handleResetChecks} className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl flex items-center gap-2 text-sm font-bold">
             <RotateCcw size={18} /> 重置
           </button>
        ) : (
           <div className="text-xs text-gray-400 px-2">設定模式</div>
        )}

        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-bold transition-all active:scale-95 bg-orange-500 text-white`}
        >
          {isEditing ? <><Check size={20}/> 完成設定</> : <><Settings size={20}/> 設定項目</>}
        </button>
      </div>
    </div>
  );
};