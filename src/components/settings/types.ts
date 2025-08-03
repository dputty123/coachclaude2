export interface PromptTemplate {
  id: string;
  name: string;
  type: 'analysis' | 'preparation';
  content: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}