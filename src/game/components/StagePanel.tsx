import type { ReactNode } from 'react';

import { clamp } from '../utils/game';

interface StagePanelProps {
  children: ReactNode;
  description: string;
  footer?: string;
  progress: number;
  stats?: string;
}

export function StagePanel({
  children,
  description,
  footer,
  progress,
  stats,
}: StagePanelProps) {
  const safeProgress = clamp(progress, 0, 1);

  return (
    <section className="stage-panel">
      <div className="stage-panel__top">
        <p className="stage-panel__description">{description}</p>
        <div className="stage-panel__stats">
          {stats ? <span>{stats}</span> : <span>실시간 반영</span>}
          <span>{Math.round(safeProgress * 100)}%</span>
        </div>
      </div>

      <div aria-hidden="true" className="stage-meter">
        <div
          className="stage-meter__fill"
          style={{ width: `${safeProgress * 100}%` }}
        />
      </div>

      <div className="stage-panel__body">{children}</div>
      {footer ? <p className="stage-panel__footer">{footer}</p> : null}
    </section>
  );
}
