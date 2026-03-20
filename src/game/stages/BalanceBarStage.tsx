import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { StageComponentProps } from '../types';
import { clamp, formatCurrency, normalizeProgress, vibrate } from '../utils/game';
import { StagePanel } from '../components/StagePanel';

type Side = 'left' | 'right';

interface Controls {
  left: number;
  right: number;
}

interface VisualState {
  angleDeg: number;
  ballX: number;
  ballY: number;
}

const INITIAL_CONTROLS: Controls = { left: 0, right: 0 };
const INITIAL_VISUAL: VisualState = { angleDeg: 0, ballX: 0, ballY: 0 };

export function BalanceBarStage({
  active,
  config,
  totalAmount,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const [controls, setControls] = useState(INITIAL_CONTROLS);
  const [visual, setVisual] = useState(INITIAL_VISUAL);

  const controlsRef = useRef(INITIAL_CONTROLS);
  const dragRef = useRef<{
    pointerId: number;
    side: Side;
    startValue: number;
    startY: number;
  } | null>(null);
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });
  const publishedAmountRef = useRef(config.startAmount);
  const physicsRef = useRef({
    amount: config.startAmount,
    centerLatched: false,
    position: 0,
    solved: false,
    velocity: 0,
    wallCooldown: 0,
  });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let frameId = 0;
    let lastFrame = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastFrame) / 1000, 0.033);
      lastFrame = now;

      const trackHalf = 136;
      const maxAngle = Math.PI / 6;
      const beamHeightDelta = controlsRef.current.right - controlsRef.current.left;
      const angle = clamp(beamHeightDelta / 150, -1, 1) * maxAngle;
      const nextState = physicsRef.current;

      nextState.velocity += Math.sin(angle) * 820 * dt;
      nextState.velocity *= 0.992;
      nextState.position += nextState.velocity * dt;

      if (Math.abs(nextState.position) >= trackHalf) {
        nextState.position = Math.sign(nextState.position) * trackHalf;
        nextState.velocity *= -0.55;

        if (nextState.wallCooldown <= 0) {
          vibrate(10);
          nextState.wallCooldown = 0.16;
        }
      }

      nextState.wallCooldown = Math.max(0, nextState.wallCooldown - dt);

      const inCenter =
        Math.abs(nextState.position) <= 18 && Math.abs(nextState.velocity) <= 120;

      if (inCenter && !nextState.centerLatched) {
        vibrate(10);
        nextState.centerLatched = true;
      }

      if (!inCenter) {
        nextState.centerLatched = false;
      }

      if (inCenter && !nextState.solved) {
        nextState.amount = clamp(
          nextState.amount + 520 * dt,
          config.startAmount,
          config.targetAmount,
        );

        const roundedAmount = Math.round(nextState.amount);
        if (roundedAmount !== publishedAmountRef.current) {
          publishedAmountRef.current = roundedAmount;
          callbacksRef.current.onUpdateAmount(roundedAmount);
        }

        if (roundedAmount >= config.targetAmount) {
          nextState.solved = true;
          callbacksRef.current.onUpdateAmount(config.targetAmount);
          callbacksRef.current.onSuccess();
        }
      }

      setVisual({
        angleDeg: (angle * 180) / Math.PI,
        ballX: nextState.position * Math.cos(angle),
        ballY: nextState.position * Math.sin(angle),
      });

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [active, config.startAmount, config.targetAmount]);

  const updateSide = (side: Side, nextValue: number) => {
    const nextControls = {
      ...controlsRef.current,
      [side]: clamp(nextValue, -70, 70),
    };

    controlsRef.current = nextControls;
    setControls(nextControls);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!active) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const side: Side = event.clientX - bounds.left < bounds.width / 2 ? 'left' : 'right';

    dragRef.current = {
      pointerId: event.pointerId,
      side,
      startValue: controlsRef.current[side],
      startY: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const delta = dragRef.current.startY - event.clientY;
    updateSide(dragRef.current.side, dragRef.current.startValue + delta);
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <StagePanel
      description={config.description}
      footer={config.hint}
      progress={normalizeProgress(totalAmount, config.startAmount, config.targetAmount)}
      stats={`${formatCurrency(totalAmount)} / ${formatCurrency(config.targetAmount)}`}
    >
      <div
        className="balance-board"
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        <div className="balance-board__sky" />
        <div className="balance-zone" />

        <div className="balance-support balance-support--left">
          <span>왼쪽</span>
          <strong>{controls.left > 0 ? `+${Math.round(controls.left)}` : Math.round(controls.left)}</strong>
        </div>

        <div className="balance-support balance-support--right">
          <span>오른쪽</span>
          <strong>
            {controls.right > 0 ? `+${Math.round(controls.right)}` : Math.round(controls.right)}
          </strong>
        </div>

        <div
          className="balance-beam"
          style={{ transform: `translate(-50%, -50%) rotate(${visual.angleDeg}deg)` }}
        />
        <div
          className="balance-ball"
          style={{ transform: `translate(${visual.ballX}px, ${visual.ballY}px)` }}
        />
      </div>

      <div className="balance-legend">
        <div className="balance-legend__item">
          <span className="balance-legend__dot balance-legend__dot--center" />
          중앙 존에 구슬을 머물게 하면 금액이 차올라요.
        </div>
        <div className="balance-legend__item">
          <span className="balance-legend__dot balance-legend__dot--drag" />
          화면 왼쪽/오른쪽을 누른 채 위아래로 끌어 각 사이드를 조절하세요.
        </div>
      </div>
    </StagePanel>
  );
}
