import React, { useState, useEffect } from 'react';
import { Terminal, Search, Copy, Book, Sparkles, Plus, History, Settings, Loader2 } from 'lucide-react';
import { PromptTemplate, Category, HistoryItem, AppSettings, AppTheme } from './types';

const CATEGORIES: Category[] = ['All', 'Agentic Workflows', 'Data Parsing', 'Image Gen', 'Code Assist', 'Creative Writing', 'General'];

const COLORS: AppTheme[] = [
  { name: 'Indigo', primary: '#4f46e5', container: '#e0e7ff', onContainer: '#4338ca' },
  { name: 'Rose', primary: '#e11d48', container: '#ffe4e6', onContainer: '#be123c' },
  { name: 'Emerald', primary: '#059669', container: '#d1fae5', onContainer: '#047857' },
  { name: 'Amber', primary: '#d97706', container: '#fef3c7', onContainer: '#b45309' },
  { name: 'Slate', primary: '#475569', container: '#f1f5f9', onContainer: '#334155' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'library' | 'history' | 'settings'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [prompts, setPrompts] = useState<PromptTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('prompt_lab_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
      
      // Default dummy data if empty
      const initial: PromptTemplate[] = [
        {
          id: '1',
          title: 'JSON Schema Extractor',
          optimizedPrompt: 'Act as an expert data engineer. Extract all relevant entities from the provided unstructured text and format them strictly according to the following JSON schema. Do not include any conversational filler...',
          category: 'Data Parsing',
          createdAt: Date.now()
        },
        {
          id: '2',
          title: 'React Component Generator',
          optimizedPrompt: 'Generate a functional React component using TypeScript and Tailwind CSS based on the following requirements. Include comprehensive prop interfaces, default values, and handle potential loading states gracefully. Ensure the code is production-ready...',
          category: 'Code Assist',
          createdAt: Date.now()
        },
        {
          id: '3',
          title: 'Cyberpunk Cityscape Image Prompt',
          optimizedPrompt: 'A hyper-realistic, 8k resolution digital rendering of a sprawling cyberpunk metropolis at night. Neon signs reflecting in rain-slicked streets. Volumetric fog rolling through towering brutalist skyscrapers. Cinematic lighting with deep blues and vibrant magenta accents, shot on 35mm lens...',
          category: 'Image Gen',
          createdAt: Date.now()
        },
        {
          id: '4',
          title: 'Multi-Agent Debate Protocol',
          optimizedPrompt: "You will orchestrate a debate between three distinct personas: a skeptical pragmatist, an unbounded visionary, and a rigorous analytical evaluator. Present a complex problem to them, and facilitate a multi-turn discussion where they critique each other's assumptions before reaching a synthesized conclusion...",
          category: 'Agentic Workflows',
          createdAt: Date.now()
        }
      ];
      return initial;
    } catch {
      return [];
    }
  });

  // Optimizer state
  const [draftPrompt, setDraftPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<PromptTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('prompt_lab_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { theme: COLORS[0], saveHistory: true };
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('prompt_lab_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('prompt_lab_favorites', JSON.stringify(prompts));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem('prompt_lab_settings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--app-primary', settings.theme.primary);
    document.documentElement.style.setProperty('--app-primary-container', settings.theme.container);
    document.documentElement.style.setProperty('--app-on-primary-container', settings.theme.onContainer);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('prompt_lab_history', JSON.stringify(history));
  }, [history]);

  const handleOptimize = async () => {
    if (!draftPrompt.trim()) return;
    setIsOptimizing(true);
    setError(null);
    setOptimizedResult(null);

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftPrompt }),
      });

      if (!res.ok) {
        throw new Error('Failed to optimize prompt');
      }

      const data = await res.json();
      const resultObj = {
        id: crypto.randomUUID(),
        title: data.title || 'Optimized Prompt',
        optimizedPrompt: data.optimizedPrompt,
        category: data.category || 'General',
        createdAt: Date.now(),
      };
      
      setOptimizedResult(resultObj);
      
      if (settings.saveHistory) {
        setHistory(prev => [{
          id: crypto.randomUUID(),
          draftPrompt: draftPrompt,
          optimizedResult: resultObj,
          timestamp: Date.now()
        }, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during optimization.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const saveToLibrary = () => {
    if (optimizedResult) {
      setPrompts(prev => [optimizedResult, ...prev]);
      setDraftPrompt('');
      setOptimizedResult(null);
      setActiveTab('library');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.optimizedPrompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-background text-on-background font-sans min-h-screen flex flex-col items-center">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full bg-surface text-primary border-b border-outline-variant flex items-center justify-between px-4 h-16 z-50">
        <button className="text-on-surface-variant hover:bg-surface-variant/50 transition-colors p-2 rounded-full flex items-center justify-center">
          <Terminal size={24} />
        </button>
        <h1 className="font-sans font-bold text-xl tracking-tighter text-primary">PROMPT_LAB</h1>
        <button className="text-on-surface-variant hover:bg-surface-variant/50 transition-colors p-2 rounded-full flex items-center justify-center">
          <Search size={24} />
        </button>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[960px] mt-16 pb-24 px-4 flex flex-col gap-6 pt-6 flex-1">
        
        {/* Navigation Tabs (Desktop mainly, but acts as section switcher) */}
        <div className="hidden md:flex w-full mb-2 bg-surface-container-low rounded-xl p-1 border border-outline-variant">
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'explore' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Optimize
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'library' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Library
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'settings' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Settings
          </button>
        </div>

        {activeTab === 'library' && (
          <>
            {/* Search Bar Area */}
            <section className="w-full">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-variant border border-outline-variant rounded-xl py-3 pl-12 pr-4 text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm" 
                  placeholder="Search prompts..." 
                  type="text" 
                />
              </div>
            </section>

            {/* Category Pills (Horizontal Scroll) */}
            <section className="w-full overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
              <div className="flex gap-2 min-w-max">
                {CATEGORIES.map(category => (
                  <button 
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full font-semibold text-xs transition-colors shrink-0 ${activeCategory === category ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant border border-outline-variant hover:bg-surface-variant'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {/* Prompt Cards Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {filteredPrompts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-on-surface-variant">
                  <Book size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No saved prompts found.</p>
                  <p className="text-sm mt-2">Go to the Optimize tab to create some!</p>
                </div>
              ) : (
                filteredPrompts.map(prompt => (
                  <article key={prompt.id} className="bg-surface border border-outline-variant shadow-sm rounded-xl p-6 flex flex-col gap-4 relative group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="font-semibold text-lg text-on-surface flex-1">{prompt.title}</h2>
                      <button 
                        onClick={() => copyToClipboard(prompt.optimizedPrompt)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border border-outline-variant hover:bg-surface-variant hover:text-primary text-on-surface-variant p-2 rounded-lg flex items-center justify-center shrink-0" 
                        title="Copy to Clipboard"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                    <p className="font-mono text-sm text-on-surface-variant flex-1 whitespace-pre-wrap line-clamp-4">{prompt.optimizedPrompt}</p>
                    <div className="flex justify-between items-end mt-2">
                      <span className="bg-primary-container text-on-primary-container border border-primary/20 font-semibold text-xs px-2 py-1 rounded-full">
                        {prompt.category}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}

        {activeTab === 'explore' && (
          <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mb-16">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-on-surface mb-2">AI Prompt Engineer</h2>
              <p className="text-on-surface-variant text-sm">Enter a basic idea or keyword, and we'll engineer an optimized prompt for better generative results.</p>
            </div>

            <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col gap-4">
              <textarea
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
                placeholder="e.g., Make a cool cyberpunk city picture..."
                className="w-full min-h-[120px] bg-surface-variant border border-outline-variant rounded-xl p-4 text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm resize-y"
              />
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing || !draftPrompt.trim()}
                className="w-full bg-primary hover:brightness-110 shadow-lg shadow-primary/30 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOptimizing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isOptimizing ? 'Optimizing...' : 'Engineer Prompt'}
              </button>
            </div>

            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {optimizedResult && (
              <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-semibold text-lg text-primary">{optimizedResult.title}</h3>
                  <span className="bg-primary-container text-on-primary-container border border-primary/20 font-semibold text-xs px-2 py-1 rounded-full">
                    {optimizedResult.category}
                  </span>
                </div>
                
                <div className="bg-surface-variant border border-outline-variant rounded-xl p-6 relative group">
                  <p className="font-mono text-sm text-on-surface-variant whitespace-pre-wrap">{optimizedResult.optimizedPrompt}</p>
                  <button 
                    onClick={() => copyToClipboard(optimizedResult.optimizedPrompt)}
                    className="absolute top-2 right-2 bg-surface text-on-surface-variant hover:text-primary border border-outline-variant p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center shadow-sm"
                    title="Copy to Clipboard"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <button 
                  onClick={saveToLibrary}
                  className="w-full bg-surface-variant border border-outline-variant hover:bg-surface-container-high text-on-surface font-bold py-3 text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  Save to Library
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-6 w-full mb-16">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-on-surface">Activity History</h2>
                <p className="text-on-surface-variant text-sm">Your previously optimized prompts.</p>
              </div>
              <button 
                onClick={() => setHistory([])}
                className="text-sm border border-outline-variant hover:bg-error-container text-on-surface-variant hover:text-on-error-container px-4 py-2 rounded-lg transition-colors"
              >
                Clear History
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {history.length === 0 ? (
                 <div className="py-12 text-center text-on-surface-variant">
                  <History size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No history found.</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="bg-surface border border-outline-variant shadow-sm rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start text-xs text-on-surface-variant">
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="bg-surface-variant border border-outline-variant p-3 rounded-lg">
                      <p className="text-sm line-clamp-2 text-on-surface-variant">{item.draftPrompt}</p>
                    </div>
                    {item.optimizedResult && (
                      <div className="flex justify-between items-start gap-4 mt-2">
                        <p className="font-mono text-sm text-on-surface flex-1 whitespace-pre-wrap">{item.optimizedResult.optimizedPrompt}</p>
                        <button 
                          onClick={() => copyToClipboard(item.optimizedResult!.optimizedPrompt)}
                          className="text-on-surface-variant hover:text-primary p-2 rounded-lg bg-surface border border-outline-variant shadow-sm"
                          title="Copy to Clipboard"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mb-16">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-on-surface mb-2">Settings</h2>
              <p className="text-on-surface-variant text-sm">Customize your Prompt Lab experience.</p>
            </div>
            
            <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col gap-8">
              
              <div>
                <h3 className="font-semibold text-lg text-on-surface mb-4">App Theme Color</h3>
                <div className="flex flex-wrap gap-4">
                  {COLORS.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSettings(s => ({ ...s, theme: color }))}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${settings.theme.name === color.name ? 'border-outline shadow-md scale-110 object-cover' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: color.primary }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-outline-variant pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-on-surface">Save History</h3>
                    <p className="text-sm text-on-surface-variant">Automatically save generative optimizations to history.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.saveHistory}
                      onChange={(e) => setSettings(s => ({ ...s, saveHistory: e.target.checked }))}
                    />
                    <div className="w-14 h-7 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="border-t border-outline-variant pt-6">
                <h3 className="font-semibold text-lg text-error mb-4">Danger Zone</h3>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setHistory([])}
                    className="w-full text-left px-4 py-3 border border-error-container text-error hover:bg-error-container rounded-xl font-semibold transition-colors"
                  >
                    Clear History
                  </button>
                  <button 
                    onClick={() => setPrompts([])}
                    className="w-full text-left px-4 py-3 border border-error-container text-error hover:bg-error-container rounded-xl font-semibold transition-colors"
                  >
                    Clear Library (Saved Templates)
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-4 bg-surface-container-lowest border-t border-outline-variant shadow-lg rounded-t-xl pb-safe">
        <button 
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center justify-center transition-all ${activeTab === 'explore' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Sparkles size={20} />
          <span className="font-semibold text-[10px] mt-1">Optimize</span>
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center justify-center transition-all ${activeTab === 'library' ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Book size={20} />
          <span className="font-semibold text-[10px] mt-1">Library</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center transition-all ${activeTab === 'history' ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <History size={20} />
          <span className="font-semibold text-[10px] mt-1">History</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center transition-all ${activeTab === 'settings' ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Settings size={20} />
          <span className="font-semibold text-[10px] mt-1">Settings</span>
        </button>
      </nav>
    </div>
  );
}

