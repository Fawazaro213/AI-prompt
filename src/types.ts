export type Category = 'All' | 'Agentic Workflows' | 'Data Parsing' | 'Image Gen' | 'Code Assist' | 'Creative Writing' | 'General';

export interface PromptTemplate {
  id: string;
  title: string;
  optimizedPrompt: string;
  category: Category;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  draftPrompt: string;
  optimizedResult: PromptTemplate | null;
  timestamp: number;
}

export interface AppTheme {
  name: string;
  primary: string;
  container: string;
  onContainer: string;
}

export interface AppSettings {
  theme: AppTheme;
  saveHistory: boolean;
}

