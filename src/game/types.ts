import type { ComponentType } from 'react';

export interface StageComponentProps {
  active: boolean;
  config: StageDefinition;
  totalAmount: number;
  onSuccess: () => void;
  onUpdateAmount: (nextTotalAmount: number) => void;
}

export interface StageDefinition {
  id: string;
  chapter: string;
  title: string;
  objective: string;
  description: string;
  hint: string;
  readyLabel: string;
  ctaLabel: string;
  startAmount: number;
  targetAmount: number;
  maxAmount?: number;
  durationSeconds: number;
  Component: ComponentType<StageComponentProps>;
}
