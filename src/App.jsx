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
  RefreshCw
} from 'lucide-react';

/**
 * 版本編號與全域設定
 */
const APP_VERSION = "v2.0";

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
  html, body {
    height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
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
    font-size: 1.05rem;
  }
  
  .editor-content blockquote {
    margin-left: 1.5rem;
    padding-left: 0.5rem;
    border-left: 3px solid #fdba74;
    font-size: 0.9em;
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
  
  /* Sticky Memo: text-base prevents zoom on iOS */
  .sticky-memo textarea {
    background-color: transparent;
    line-height: 1.6em;
    font-size: 1rem; /* text-base */
  }

  /* Checklist Styles */
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
  // --- PWA Auto Update Hook ---
  // 使用上面定義的 hook (本地開發請記得切換回真實的 import)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // --- State ---
  const [view, setView] = useState('categories'); // 'categories', 'notes', 'editor'
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [memo, setMemo] = useState(''); 
  
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [sortBy, setSortBy] = useState('time'); 
  
  // Search
  const [categorySearch, setCategorySearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Modals & Mode
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const fileInputRef = useRef(null); 

  // Initialize Data
  useEffect(() => {
    const savedCategories = localStorage.getItem('litenote_categories');
    const savedNotes = localStorage.getItem('litenote_notes');
    const savedMemo = localStorage.getItem('litenote_memo');
    
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // 4. 清空預設分類，保持乾淨
      setCategories([]);
    }

    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }

    if (savedMemo) {
      setMemo(savedMemo);
    }
  }, []);

  // Persist Data
  useEffect(() => {
    localStorage.setItem('litenote_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('litenote_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('litenote_memo', memo);
  }, [memo]);

  // --- Helpers ---
  // 檢查是否為表單分類
  const isFormCategory = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat && cat.name.includes('[表單]');
  };

  // --- Handlers ---

  const handleExport = () => {
    const data = {
      version: APP_VERSION,
      categories,
      notes,
      memo,
      exportedAt: new Date().toISOString()
    };
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
            setCategories(data.categories);
            setNotes(data.notes);
            if (data.memo) setMemo(data.memo);
            alert('資料還原成功！');
            setShowSettingsModal(false);
          }
        } else {
          alert('無效的備份檔案格式。');
        }
      } catch (err) { alert('讀取檔案失敗。'); }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat = { id: Date.now().toString(), name: newCategoryName };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    setShowNewCategoryModal(false);
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
    // 檢查是否為表單模式
    const isForm = isFormCategory(activeCategoryId);
    
    const newNote = {
      id: Date.now().toString(),
      categoryId: activeCategoryId,
      title: isForm ? '未命名表單' : '未命名筆記',
      content: isForm ? JSON.stringify([]) : '', // 表單內容為 JSON Array 字串，一般筆記為 HTML
      type: isForm ? 'checklist' : 'text', // 標記類型
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

  // 1. Categories View
  const renderCategories = () => {
    const displayCategories = categories;

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <header className="bg-white p-5 pb-3 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-4xl font-bold text-orange-600 handwriting-title pt-2">litenote</h1>
            <div className="flex gap-2">
               <button onClick={() => { setCategorySearch(''); setShowSearchModal(true); }} className="w-10 h-10 rounded-full bg-white text-gray-400 hover:bg-gray-50 flex items-center justify-center border border-transparent hover:border-gray-100"><Search size={20} /></button>
               <button onClick={() => setShowSettingsModal(true)} className="w-10 h-10 rounded-full bg-white text-gray-400 hover:bg-gray-50 flex items-center justify-center border border-transparent hover:border-gray-100"><Settings size={20} /></button>
               <button onClick={() => setShowNewCategoryModal(true)} className="w-10 h-10 bg-orange-500 text-white rounded-full hover:bg-orange-600 shadow-lg shadow-orange-200 flex items-center justify-center"><Plus size={24} /></button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
          {/* Sticky Memo */}
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
             <div className="bg-orange-50 p-2 mb-2 rounded-lg text-xs text-center text-orange-600 border border-orange-100">管理模式開啟：可排序與刪除分類</div>
          )}

          {displayCategories.length === 0 && (
            <div className="text-center text-gray-400 mt-10 text-sm">
              點擊右上角 "+" 新增分類<br/>
              命名為 <b>[表單]</b> 可啟用檢核表模式
            </div>
          )}

          {displayCategories.map((cat, index) => {
            if (cat.name === '---') {
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
            const isForm = cat.name.includes('[表單]');
            
            return (
              <div 
                key={cat.id}
                onClick={() => { setActiveCategoryId(cat.id); setView('notes'); }}
                className={`relative bg-white p-4 rounded-2xl shadow-sm border ${isForm ? 'border-l-4 border-l-blue-400 border-gray-100' : 'border-orange-100'} flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer hover:shadow-md min-h-[4rem]`}
              >
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    {cat.name}
                    {isForm && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded">表單</span>}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">{count} 個項目</p>
                </div>
                
                {isManageMode && (
                  <div className="flex items-center gap-1 bg-white pl-2">
                    <div className="flex flex-col mr-2 border-r pr-2 border-gray-100">
                      <button onClick={(e) => moveCategory(index, -1, e)} disabled={index === 0} className="p-1 hover:bg-orange-50 rounded text-gray-400 hover:text-orange-500 disabled:opacity-30"><ArrowUp size={16}/></button>
                      <button onClick={(e) => moveCategory(index, 1, e)} disabled={index === displayCategories.length - 1} className="p-1 hover:bg-orange-50 rounded text-gray-400 hover:text-orange-500 disabled:opacity-30"><ArrowDown size={16}/></button>
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

  // 2. Note List View
  const renderNoteList = () => {
    const activeCat = categories.find(c => c.id === activeCategoryId);
    const activeCatName = activeCat?.name;
    const isForm = isFormCategory(activeCategoryId);

    let filtered = notes.filter(n => n.categoryId === activeCategoryId);
    const currentNotes = filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return sortBy === 'time' ? b.updatedAt - a.updatedAt : a.title.localeCompare(b.title);
    });

    return (
      <div className="flex flex-col h-full bg-gray-50"> 
        <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button onClick={() => setView('categories')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft size={26} /></button>
            <h1 className="text-2xl font-bold text-gray-800 truncate handwriting-title tracking-wide pt-1">{activeCatName}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={handleCreateNote}
              className={`w-9 h-9 text-white rounded-full shadow-md flex items-center justify-center active:scale-90 transition-transform ${isForm ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
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
                      {isForm && <CheckSquare size={16} className="inline mr-2 text-blue-500 mb-0.5" />}
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

  // 3. Editor View (Handles both Text and Form)
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

  // --- Main Layout ---
  // 固定 inset-0 防止在 iOS 上可以上下拉動露出底色
  return (
    <div className="fixed inset-0 w-full h-full max-w-md mx-auto bg-white flex flex-col shadow-2xl overflow-hidden">
      <style>{FONTS_CSS}</style>
      
      {/* PWA Update Toast */}
      {needRefresh && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-500">
           <button 
             onClick={() => updateServiceWorker(true)}
             className="bg-gray-800 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 hover:bg-gray-700"
           >
             <RefreshCw size={18} className="animate-spin-slow"/>
             <span>發現新版本，點擊更新</span>
           </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {view === 'categories' && renderCategories()}
        {view === 'notes' && renderNoteList()}
        {view === 'editor' && renderEditor()}
      </div>

      {/* Modals ... (Search, Settings, New Category) */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
           <div className="bg-white w-full h-[85vh] sm:h-auto sm:w-[90%] sm:max-w-xs sm:rounded-3xl rounded-t-3xl p-6 flex flex-col">
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
           <div className="bg-white w-full sm:w-[90%] sm:max-w-xs sm:rounded-3xl rounded-t-3xl p-6">
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="text-xl font-bold mb-1 text-gray-800">新增分類</h3>
            <p className="text-xs text-gray-400 mb-4">輸入 <b>[表單]</b> 可啟用檢核模式</p>
            <input autoFocus type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="分類名稱..." className="w-full p-4 bg-gray-50 border-none rounded-xl mb-4 text-lg outline-none"/>
            <div className="flex gap-3">
              <button onClick={() => setShowNewCategoryModal(false)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-50 rounded-xl">取消</button>
              <button onClick={handleCreateCategory} className="flex-1 py-3 text-white bg-orange-500 font-bold rounded-xl">建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 元件 1: 一般筆記編輯器 (HTML Rich Text)
 */
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
  const execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val); if(contentRef.current) contentRef.current.focus(); };
  
  const processReadContent = (html) => {
    if (!html) return '<p class="text-gray-300 italic text-center mt-10">點擊右下角筆按鈕開始書寫...</p>';
    // Simple URL linker logic would go here
    return html;
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      <header className="flex justify-between items-center p-2 border-b border-gray-100">
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

      <div className="flex-1 overflow-y-auto p-6 relative">
        {isEditing ? (
          <div ref={contentRef} className="editor-content w-full h-full text-gray-700" contentEditable suppressContentEditableWarning placeholder="開始輸入..." />
        ) : (
          <div className="editor-content w-full h-full text-gray-700 prose prose-orange max-w-none" dangerouslySetInnerHTML={{ __html: processReadContent(note.content) }} />
        )}
      </div>

      <div className="p-2 border-t border-gray-100 bg-white/95 backdrop-blur safe-area-bottom">
        {isEditing ? (
          <div className="flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
             <div className="flex-1 overflow-x-auto hide-scrollbar flex items-center gap-3 pr-2">
                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100 shrink-0">
                  <button onClick={() => execCmd('outdent')} className="p-2 hover:bg-white rounded text-gray-600"><Outdent size={18}/></button>
                  <div className="w-[1px] bg-gray-200 mx-1"></div>
                  <button onClick={() => execCmd('indent')} className="p-2 hover:bg-white rounded text-gray-600"><Indent size={18}/></button>
                </div>
                <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>
                {COLOR_PALETTE.map(c => <button key={c.id} onClick={() => execCmd('foreColor', c.text)} className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-white shadow-sm text-sm font-bold" style={{ color: c.text }}>A</button>)}
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

/**
 * 元件 2: 表單/檢核表編輯器 (Checklist Editor)
 */
const ChecklistEditor = ({ note, onUpdate, onBack, onDelete }) => {
  // 解析 JSON 內容，如果是空的或舊格式，初始化為空陣列
  const [items, setItems] = useState(() => {
    try {
      const parsed = JSON.parse(note.content);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  
  const [isEditing, setIsEditing] = useState(items.length === 0); // 如果沒內容，預設進入編輯模式
  const [title, setTitle] = useState(note.title);
  const [newItemText, setNewItemText] = useState('');

  // 儲存邏輯
  const save = (newItems) => {
    setItems(newItems);
    onUpdate({ content: JSON.stringify(newItems) });
  };

  const handleToggleCheck = (index) => {
    // 只有在非編輯模式下才能打勾
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
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      <header className="flex justify-between items-center p-2 border-b border-gray-100 bg-blue-50/30">
        <button onClick={onBack} className="p-3 text-gray-500 rounded-full hover:bg-gray-50"><ChevronLeft size={24} /></button>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} className="flex-1 mx-2 text-center font-bold text-xl border-b-2 border-blue-100 outline-none py-1 text-gray-800 bg-transparent" placeholder="表單名稱"/>
        <div className="flex gap-1">
          <button onClick={handleTogglePin} className={`p-3 rounded-full transition-colors ${note.isPinned ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:bg-gray-50'}`}><Bookmark size={20} fill={note.isPinned ? "currentColor" : "none"} /></button>
          <button onClick={onDelete} className="p-3 text-red-300 rounded-full hover:bg-red-50 hover:text-red-500"><Trash2 size={20} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 && !isEditing && (
           <div className="text-center text-gray-400 mt-20">沒有檢查項目<br/>點擊右下角設定新增</div>
        )}

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className={`checklist-item ${item.checked ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
              <div 
                onClick={() => handleToggleCheck(index)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${item.checked ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 bg-white'}`}
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
              className="flex-1 p-3 bg-gray-50 rounded-xl outline-none border border-gray-200 focus:border-blue-400 text-base"
            />
            <button type="submit" className="p-3 bg-blue-100 text-blue-600 rounded-xl font-bold"><Plus size={24}/></button>
          </form>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-white/95 backdrop-blur safe-area-bottom flex justify-between items-center">
        {/* Reset Button (Only in View Mode) */}
        {!isEditing ? (
           <button onClick={handleResetChecks} className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl flex items-center gap-2 text-sm font-bold">
             <RotateCcw size={18} /> 重置
           </button>
        ) : (
           <div className="text-xs text-gray-400 px-2">設定模式</div>
        )}

        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-bold transition-all active:scale-95 ${isEditing ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}
        >
          {isEditing ? <><Check size={20}/> 完成設定</> : <><Settings size={20}/> 設定項目</>}
        </button>
      </div>
    </div>
  );
};