export interface QuestionContent {
  text: string;
  html?: string;
  delta?: any; 
}

export interface OptionContent {
  text: string;
  html?: string;
  delta?: any; 
}

export interface DraftQuestion {
  tempId: string;
  content: QuestionContent;
  options: Array<{
    tempOptionId: string;
    content: OptionContent;
    clipUrls?: string[];
  }>;
  page?: number;
  qNo?: number;
  clipUrls?: string[];
}