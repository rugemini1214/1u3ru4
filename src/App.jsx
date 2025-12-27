import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  Check, 
  Indent,
  Outdent,
  SortAsc,
  Calendar,
  Search,
  ArrowUp,
  ArrowDown,
  Settings,
  X,
  Bookmark,
  Download,
  Upload
} from 'lucide-react';

/**
 * 版本編號與全域設定
 */
const APP_VERSION = "v1.8";

// 定義色系：實用四色 (黑、紅、綠、藍)
const COLOR_PALETTE = [
  { id: 'default', label: '預設', text: '#374151', bg: 'transparent', bgLabel: '無' }, 
  { id: 'red',     label: '紅',   text: '#ef4444', bg: '#fee2e2' }, 
  { id: 'green',   label: '綠',   text: '#16a34a', bg: '#dcfce7' }, 
  { id: 'blue',    label: '藍',   text: '#2563eb', bg: '#dbeafe' }, 
];

const FONTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+TC:wght@400;700&display=swap');
  
  body {
    font-family: 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', sans-serif;
    background-color: #f9fafb; /* 冷灰白背景 */
    overscroll-behavior-y: none;
  }

  /* 優雅成熟的手寫標題字體 */
  .handwriting-title {
    font-family: 'Dancing Script', cursive;
    letter-spacing: 0.5px;
  }

  /* 編輯器樣式重置與設定 */
  .editor-content {
    min-height: 50vh;
    outline: none;
    line-height: 1.7;
    font-size: 1.05rem;
  }
  
  /* 縮排樣式 */
  .editor-content blockquote {
    margin-left: 1.5rem;
    padding-left: 0.5rem;
    border-left: 3px solid #fdba74;
    font-size: 0.9em;
    color: #6b7280;
  }

  /* 隱藏連結樣式 */
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

  /* 自定義分隔線樣式 */
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
  
  /* 隱藏 Scrollbar 但保留功能 */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* 置頂筆記樣式 */
  .pinned-note {
    border-left: 4px solid #f97316 !important; 
    background-color: white !important;
  }
  
  /* 便利貼樣式 (移除線條，純淨背景) */
  .sticky-memo textarea {
    background-color: transparent;
    line-height: 1.6em;
  }
`;

export default function App() {
  // --- State ---
  const [view, setView] = useState('categories'); // 'categories', 'notes', 'editor'
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [memo, setMemo] = useState(''); 
  
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [sortBy, setSortBy] = useState('time'); 
  
  // Search & Filter
  const [categorySearch, setCategorySearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false); // New Search Modal State
  
  // Settings & Management
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const fileInputRef = useRef(null); 

  // Create Category Modal
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Initialize Data
  useEffect(() => {
    const savedCategories = localStorage.getItem('litenote_categories');
    const savedNotes = localStorage.getItem('litenote_notes');
    const savedMemo = localStorage.getItem('litenote_memo');
    
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      const initialCats = [
        { id: 'cat-1', name: '隨手記' },
        { id: 'cat-2', name: '---' }, 
        { id: 'cat-3', name: '待辦事項' }
      ];
      setCategories(initialCats);
      localStorage.setItem('litenote_categories', JSON.stringify(initialCats));
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
    if (categories.length > 0) localStorage.setItem('litenote_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('litenote_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('litenote_memo', memo);
  }, [memo]);

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
      } catch (err) {
        alert('讀取檔案失敗。');
      }
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
    const newNote = {
      id: Date.now().toString(),
      categoryId: activeCategoryId,
      title: '未命名筆記',
      content: '', 
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
    if (window.confirm('確定刪除此筆記？')) {
      setNotes(notes.filter(n => n.id !== id));
      setView('notes');
    }
  };

  const getFilteredAndSortedNotes = () => {
    let filtered = notes.filter(n => n.categoryId === activeCategoryId);
    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      if (sortBy === 'time') {
        return b.updatedAt - a.updatedAt;
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  };

  const getGlobalSearchResults = () => {
    if (!categorySearch.trim()) return [];
    const lowerQ = categorySearch.toLowerCase();
    return notes.filter(n => {
      const plainContent = n.content.replace(/<[^>]+>/g, '');
      return n.title.toLowerCase().includes(lowerQ) || plainContent.toLowerCase().includes(lowerQ);
    });
  };

  // --- Render Helpers ---
  const Divider = () => (
    <div className="divider-item">
      <div className="divider-line"></div>
    </div>
  );

  // --- Render Views ---

  const renderCategories = () => {
    // Normal category filter (for the list below) - always show all unless filtered by something else
    // Since search is now in a modal, the main list just shows all.
    const displayCategories = categories;

    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <header className="bg-white p-5 pb-3 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center mb-2">
            {/* Title: No Version Number here */}
            <h1 className="text-4xl font-bold text-orange-600 handwriting-title pt-2">
              litenote
            </h1>
            
            <div className="flex gap-2">
               {/* Search Button (Opens Modal) */}
               <button 
                onClick={() => { setCategorySearch(''); setShowSearchModal(true); }}
                className="w-10 h-10 rounded-full bg-white text-gray-400 hover:bg-gray-50 flex items-center justify-center transition-all border border-transparent hover:border-gray-100"
              >
                <Search size={20} />
              </button>

              {/* Settings Button */}
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-10 h-10 rounded-full bg-white text-gray-400 hover:bg-gray-50 flex items-center justify-center transition-all border border-transparent hover:border-gray-100"
              >
                <Settings size={20} />
              </button>

              {/* Add Category Button */}
              <button 
                onClick={() => setShowNewCategoryModal(true)}
                className="w-10 h-10 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* Sticky Memo */}
          <div className="bg-yellow-100 p-3 rounded-xl border border-yellow-200 shadow-sm mb-4 sticky-memo transform rotate-[0.5deg]">
            <textarea 
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="長期注意事項 / 備忘錄..."
              className="w-full bg-transparent border-none outline-none resize-none text-gray-700 text-sm h-24 placeholder:text-yellow-700/30"
              spellCheck="false"
            />
          </div>

          {/* Management Mode Banner */}
          {isManageMode && (
             <div className="bg-orange-50 p-2 mb-2 rounded-lg text-xs text-center text-orange-600 border border-orange-100 animate-in fade-in">
                管理模式開啟：可排序與刪除分類
             </div>
          )}

          {/* Category List */}
          {displayCategories.map((cat, index) => {
            if (cat.name === '---') {
              return (
                 <div key={cat.id} className="relative py-1">
                    <Divider />
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
            return (
              <div 
                key={cat.id}
                onClick={() => { setActiveCategoryId(cat.id); setView('notes'); }}
                className="relative bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer hover:shadow-md min-h-[4rem]"
              >
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{cat.name}</h3>
                  <p className="text-xs text-orange-400 font-medium">{count} 則筆記</p>
                </div>
                
                {isManageMode && (
                  <div className="flex items-center gap-1 animate-in slide-in-from-right duration-200 bg-white pl-2">
                    <div className="flex flex-col mr-2 border-r pr-2 border-gray-100">
                      <button 
                        onClick={(e) => moveCategory(index, -1, e)} 
                        className="p-1 hover:bg-orange-50 rounded text-gray-400 hover:text-orange-500 disabled:opacity-30"
                        disabled={index === 0}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button 
                        onClick={(e) => moveCategory(index, 1, e)} 
                        className="p-1 hover:bg-orange-50 rounded text-gray-400 hover:text-orange-500 disabled:opacity-30"
                        disabled={index === displayCategories.length - 1}
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
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
    const activeCatName = categories.find(c => c.id === activeCategoryId)?.name;
    const currentNotes = getFilteredAndSortedNotes();

    return (
      <div className="flex flex-col h-full bg-gray-50"> 
        <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button onClick={() => setView('categories')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <ChevronLeft size={26} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 truncate handwriting-title tracking-wide pt-1">{activeCatName}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => setSortBy(prev => prev === 'time' ? 'title' : 'time')}
              className="flex items-center gap-1 text-xs bg-orange-50 px-3 py-2 rounded-full text-orange-600 font-medium hover:bg-orange-100 transition-colors"
            >
              {sortBy === 'time' ? <Calendar size={14}/> : <SortAsc size={14}/>}
              {sortBy === 'time' ? '依時間' : '依標題'}
            </button>
            <button 
              onClick={handleCreateNote}
              className="w-9 h-9 bg-orange-500 text-white rounded-full shadow-md flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentNotes.length === 0 ? (
            <div className="text-center text-gray-300 mt-20">
              <p className="handwriting-title text-3xl mb-2">Empty...</p>
              <p className="text-sm">點擊右上角新增筆記</p>
            </div>
          ) : (
            currentNotes.map(note => {
               if (note.title === '---') {
                 return (
                   <div key={note.id} className="relative group py-1" onClick={() => { setActiveNoteId(note.id); setView('editor'); }}>
                     <Divider />
                   </div>
                 );
               }
               
               return (
                <div 
                  key={note.id}
                  onClick={() => { setActiveNoteId(note.id); setView('editor'); }}
                  className={`bg-white p-4 rounded-xl shadow-sm border-b-2 border-transparent hover:border-orange-200 active:bg-orange-50 transition-all cursor-pointer ${note.isPinned ? 'pinned-note' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className={`font-bold truncate text-lg flex-1 ${note.isPinned ? 'text-orange-900' : 'text-gray-800'}`}>
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

    return (
      <Editor 
        note={note} 
        onUpdate={(updates) => handleUpdateNote(note.id, updates)}
        onBack={() => setView('notes')}
        onDelete={() => handleDeleteNote(note.id)}
      />
    );
  };

  const globalSearchResults = getGlobalSearchResults();

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white relative overflow-hidden flex flex-col shadow-2xl">
      <style>{FONTS_CSS}</style>
      
      <div className="flex-1 overflow-hidden relative">
        {view === 'categories' && renderCategories()}
        {view === 'notes' && renderNoteList()}
        {view === 'editor' && renderEditor()}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
           <div className="bg-white w-full h-[85vh] sm:h-auto sm:w-[90%] sm:max-w-xs sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">搜尋</h3>
                <button onClick={() => setShowSearchModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
              </div>

              {/* Modal Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  autoFocus
                  type="text" 
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="輸入關鍵字..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-base focus:ring-2 focus:ring-orange-200 outline-none"
                />
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                 {categorySearch.trim() === '' ? (
                    <div className="text-center text-gray-300 mt-10 text-sm">輸入文字以搜尋分類或筆記</div>
                 ) : (
                    <>
                      {/* 1. Categories Match */}
                      {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => {
                         if(cat.name === '---') return null;
                         const count = notes.filter(n => n.categoryId === cat.id).length;
                         return (
                            <div 
                              key={cat.id}
                              onClick={() => { setActiveCategoryId(cat.id); setView('notes'); setShowSearchModal(false); }}
                              className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center"
                            >
                              <span className="font-bold text-gray-800">{cat.name}</span>
                              <span className="text-xs text-orange-400">{count}</span>
                            </div>
                         )
                      })}

                      {/* 2. Notes Match */}
                      {globalSearchResults.map(note => (
                         <div 
                            key={note.id}
                            onClick={() => { 
                              setActiveCategoryId(note.categoryId); 
                              setActiveNoteId(note.id); 
                              setView('editor'); 
                              setShowSearchModal(false);
                            }}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer hover:border-orange-200"
                          >
                            <h3 className="font-bold text-gray-800 mb-1">{note.title || '未命名'}</h3>
                            <div className="flex justify-between items-center mt-2">
                               <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                 {categories.find(c => c.id === note.categoryId)?.name || '未知分類'}
                               </span>
                               <span className="text-[10px] text-gray-300">
                                 {new Date(note.updatedAt).toLocaleDateString()}
                               </span>
                            </div>
                         </div>
                      ))}

                      {globalSearchResults.length === 0 && categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                        <div className="text-center text-gray-400 mt-10 text-sm">無相符結果</div>
                      )}
                    </>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200">
           <div className="bg-white w-full sm:w-[90%] sm:max-w-xs sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">設定</h3>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setIsManageMode(!isManageMode)}
                  className="w-full p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Edit3 size={20} className="text-gray-600"/>
                    <span className="text-gray-700 font-bold">管理分類 (排序/刪除)</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isManageMode ? 'bg-orange-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${isManageMode ? 'translate-x-4' : ''}`}></div>
                  </div>
                </button>
                
                <div className="h-[1px] bg-gray-100 my-2"></div>

                {/* Backup Button (Orange Style) */}
                <button 
                  onClick={handleExport}
                  className="w-full p-4 bg-orange-50 rounded-xl flex items-center gap-3 text-orange-700 font-bold hover:bg-orange-100 transition-colors"
                >
                  <Download size={20} />
                  備份資料 (下載)
                </button>

                {/* Restore Button (Orange Style/Gray) */}
                <button 
                  onClick={handleImportClick}
                  className="w-full p-4 bg-gray-100 rounded-xl flex items-center gap-3 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                >
                  <Upload size={20} />
                  還原資料 (讀取)
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".json" 
                  className="hidden" 
                />
              </div>

              <div className="mt-6 text-center text-xs text-gray-300">
                LiteNote {APP_VERSION}
              </div>
           </div>
        </div>
      )}

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl transform scale-100">
            <h3 className="text-xl font-bold mb-1 text-gray-800">新增分類</h3>
            <p className="text-xs text-gray-400 mb-4">輸入 "---" 建立分隔線</p>
            <input 
              autoFocus
              type="text" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="分類名稱..."
              className="w-full p-4 bg-gray-50 border-none rounded-xl mb-4 focus:ring-2 focus:ring-orange-400 outline-none text-lg"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewCategoryModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">取消</button>
              <button onClick={handleCreateCategory} className="flex-1 py-3 text-white bg-orange-500 font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all">建立</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 富文字編輯器元件
 */
const Editor = ({ note, onUpdate, onBack, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.innerHTML = note.content;
    }
  }, [isEditing]);

  const toggleMode = () => {
    if (isEditing) {
      onUpdate({ 
        title, 
        content: contentRef.current ? contentRef.current.innerHTML : note.content 
      });
    }
    setIsEditing(!isEditing);
  };

  const handleTogglePin = () => {
    const newStatus = !note.isPinned;
    onUpdate({ isPinned: newStatus });
  };

  const handleTitleBlur = () => {
    onUpdate({ title });
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (contentRef.current) contentRef.current.focus();
  };

  const processReadContent = (html) => {
    if (!html) return '<p class="text-gray-300 italic text-center mt-10">點擊右下角筆按鈕開始書寫...</p>';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const walk = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];
    
    while(node = walk.nextNode()) {
       if (node.textContent.match(/https?:\/\/[^\s]+/)) {
         nodesToReplace.push(node);
       }
    }

    nodesToReplace.forEach(node => {
      const span = document.createElement('span');
      const newHtml = node.textContent.replace(
        /(https?:\/\/[^\s]+)/g, 
        `<a href="$1" target="_blank" rel="noopener noreferrer" class="link-icon" onclick="event.stopPropagation()">🔗</a>`
      );
      span.innerHTML = newHtml;
      node.parentNode.replaceChild(span, node);
    });

    return tempDiv.innerHTML;
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex justify-between items-center p-2 border-b border-gray-100">
        <button onClick={onBack} className="p-3 text-gray-500 rounded-full hover:bg-gray-50">
          <ChevronLeft size={24} />
        </button>
        
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="flex-1 mx-2 text-center font-bold text-xl border-b-2 border-orange-100 focus:border-orange-400 outline-none py-1 text-gray-700"
            placeholder="標題"
          />
        ) : (
          <h2 className="flex-1 mx-4 text-center font-bold text-xl truncate text-gray-800">{title}</h2>
        )}

        <div className="flex gap-1">
          {/* Pin Toggle Button */}
          <button 
             onClick={handleTogglePin}
             className={`p-3 rounded-full transition-colors ${note.isPinned ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:bg-gray-50'}`}
          >
             <Bookmark size={20} fill={note.isPinned ? "currentColor" : "none"} />
          </button>

          <button onClick={onDelete} className="p-3 text-red-300 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        {isEditing ? (
          <div
            ref={contentRef}
            className="editor-content w-full h-full text-gray-700"
            contentEditable
            suppressContentEditableWarning
            placeholder="開始輸入..."
          />
        ) : (
          <div 
            className="editor-content w-full h-full text-gray-700 prose prose-orange max-w-none"
            dangerouslySetInnerHTML={{ __html: processReadContent(note.content) }}
            /* 移除 onClick={() => setIsEditing(true)} 以防止誤觸 */
          />
        )}
      </div>

      {/* Toolbar */}
      <div className="p-2 border-t border-gray-100 bg-white/95 backdrop-blur safe-area-bottom">
        {isEditing ? (
          <div className="flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
            
            {/* Scrollable Area */}
            <div className="flex-1 overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-3 pr-2">
                
                {/* Group 1: Indent */}
                <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100 shrink-0">
                  <button onClick={() => execCmd('outdent')} className="p-2 hover:bg-white rounded text-gray-600"><Outdent size={18}/></button>
                  <div className="w-[1px] bg-gray-200 mx-1"></div>
                  <button onClick={() => execCmd('indent')} className="p-2 hover:bg-white rounded text-gray-600"><Indent size={18}/></button>
                </div>

                <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>

                {/* Group 2: Text Colors (A) */}
                <div className="flex gap-2 shrink-0">
                   {COLOR_PALETTE.map(c => (
                     <button
                       key={`text-${c.id}`}
                       onClick={() => execCmd('foreColor', c.text)}
                       className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center hover:scale-110 transition-transform bg-white shadow-sm"
                       style={{ color: c.text }}
                       title={`文字：${c.label}`}
                     >
                       <span className="font-bold text-base">A</span>
                     </button>
                   ))}
                </div>

                <div className="w-[1px] h-8 bg-gray-200 shrink-0"></div>

                {/* Group 3: BG Colors (Circle) */}
                <div className="flex gap-2 shrink-0">
                   {COLOR_PALETTE.map(c => (
                     <button
                       key={`bg-${c.id}`}
                       onClick={() => execCmd('hiliteColor', c.bg)}
                       className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm relative"
                       style={{ backgroundColor: c.bg === 'transparent' ? '#fff' : c.bg }}
                       title={`底色：${c.bgLabel || c.label}`}
                     >
                        {/* 如果是透明，畫一個斜線表示無 */}
                        {c.bg === 'transparent' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-[1px] bg-red-400 rotate-45 transform scale-75"></div>
                          </div>
                        )}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            {/* Fixed Done Button: Orange */}
            <button 
              onClick={toggleMode}
              className="p-3 bg-orange-500 text-white rounded-xl shadow-md shrink-0 active:scale-95 transition-transform hover:bg-orange-600"
            >
              <Check size={20} />
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button 
              onClick={toggleMode}
              className="w-14 h-14 bg-orange-500 text-white rounded-full shadow-xl shadow-orange-200 hover:bg-orange-600 active:scale-90 transition-transform flex items-center justify-center"
            >
              <Edit3 size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};