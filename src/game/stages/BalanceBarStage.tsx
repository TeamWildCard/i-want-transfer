import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import type { StageComponentProps } from '../types';
import { clamp, formatCurrency, vibrate } from '../utils/game';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 320;
const BALL_RADIUS = 14;
const SLOT_FRAME_X = 22;
const SLOT_FRAME_WIDTH = CANVAS_WIDTH - SLOT_FRAME_X * 2;
const SLOT_HEIGHT = 62;
const SLOT_TOP = CANVAS_HEIGHT - SLOT_HEIGHT - 20;
const LAUNCH_POINT = { x: 84, y: SLOT_TOP - 26 };
const GRAVITY = 900;
const SLOT_VALUES = [500, 1100, 1800, 2400, 3000];
const TARGET_VALUE = 3000;
const RESET_DELAY_MS = 760;
const SLOT_COLORS = ['#C7D2FE', '#93C5FD', '#86EFAC', '#FDE68A', '#60A5FA'];

interface BallState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface AimState {
  active: boolean;
  pointerId: number | null;
  x: number;
  y: number;
}

function createBall(): BallState {
  return {
    active: false,
    x: LAUNCH_POINT.x,
    y: LAUNCH_POINT.y,
    vx: 0,
    vy: 0,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function BalanceBarStage({
  active,
  config,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const aimRef = useRef<AimState>({
    active: false,
    pointerId: null,
    x: LAUNCH_POINT.x + 72,
    y: LAUNCH_POINT.y - 72,
  });
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });
  const ballRef = useRef(createBall());
  const landedSlotRef = useRef<number | null>(null);
  const successRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  const resetBall = useCallback(() => {
    ballRef.current = createBall();
    landedSlotRef.current = null;
    aimRef.current.active = false;
    aimRef.current.pointerId = null;
  }, []);

  const getLaunchVelocity = (pointerX: number, pointerY: number) => ({
    vx: clamp(pointerX - LAUNCH_POINT.x, 24, 210) * 2.65,
    vy: clamp(pointerY - LAUNCH_POINT.y, -190, -22) * 2.6,
  });

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const slotWidth = SLOT_FRAME_WIDTH / SLOT_VALUES.length;
    const ball = ballRef.current;
    const aim = aimRef.current;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const background = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    background.addColorStop(0, '#F8FBFF');
    background.addColorStop(1, '#EAF3FF');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    drawRoundedRect(ctx, 20, 18, CANVAS_WIDTH - 40, SLOT_TOP - 8, 30);
    ctx.fill();

    ctx.strokeStyle = 'rgba(49, 130, 246, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 40; x < CANVAS_WIDTH - 20; x += 38) {
      ctx.beginPath();
      ctx.moveTo(x, 24);
      ctx.lineTo(x + 18, SLOT_TOP - 18);
      ctx.stroke();
    }

    SLOT_VALUES.forEach((value, index) => {
      const x = SLOT_FRAME_X + slotWidth * index;
      const isTarget = value === TARGET_VALUE;
      const isLanded = landedSlotRef.current === index;

      ctx.save();
      ctx.fillStyle = isTarget ? 'rgba(37, 99, 235, 0.16)' : 'rgba(255, 255, 255, 0.92)';
      drawRoundedRect(ctx, x + 4, SLOT_TOP, slotWidth - 8, SLOT_HEIGHT, 18);
      ctx.fill();

      ctx.strokeStyle = isLanded
        ? 'rgba(15, 23, 42, 0.24)'
        : isTarget
          ? 'rgba(37, 99, 235, 0.42)'
          : 'rgba(15, 23, 42, 0.08)';
      ctx.lineWidth = isTarget ? 3 : 1.5;
      ctx.stroke();

      ctx.fillStyle = SLOT_COLORS[index];
      drawRoundedRect(ctx, x + 12, SLOT_TOP + 10, slotWidth - 24, 12, 6);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = `800 ${isTarget ? 24 : 20}px Pretendard, Apple SD Gothic Neo, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        formatCurrency(value).replace('₩', ''),
        x + slotWidth / 2,
        SLOT_TOP + 38,
      );
      ctx.restore();
    });

    ctx.fillStyle = '#94A3B8';
    drawRoundedRect(ctx, 38, SLOT_TOP - 8, 76, 18, 9);
    ctx.fill();
    ctx.fillStyle = '#CBD5E1';
    drawRoundedRect(ctx, 54, SLOT_TOP + 8, 42, 20, 10);
    ctx.fill();

    if (aim.active && !ball.active) {
      const velocity = getLaunchVelocity(aim.x, aim.y);
      ctx.save();
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 9]);
      ctx.beginPath();

      let sampleX = LAUNCH_POINT.x;
      let sampleY = LAUNCH_POINT.y;
      const sampleVx = velocity.vx;
      let sampleVy = velocity.vy;

      ctx.moveTo(sampleX, sampleY);
      for (let step = 0; step < 26; step += 1) {
        sampleVy += GRAVITY * 0.055;
        sampleX += sampleVx * 0.055;
        sampleY += sampleVy * 0.055;
        ctx.lineTo(sampleX, sampleY);

        if (sampleY >= SLOT_TOP - BALL_RADIUS) {
          break;
        }
      }

      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(LAUNCH_POINT.x, LAUNCH_POINT.y);
      ctx.lineTo(aim.x, aim.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.fillStyle = '#0F172A';
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(ball.x - 4, ball.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  useEffect(() => {
    successRef.current = false;
    callbacksRef.current.onUpdateAmount(config.startAmount);
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    resetBall();
    drawScene();
  }, [config.id, config.startAmount, drawScene, resetBall]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let frameId = 0;
    let lastFrame = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastFrame) / 1000, 0.033);
      lastFrame = now;

      const ball = ballRef.current;
      if (ball.active) {
        ball.vy += GRAVITY * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x <= BALL_RADIUS + SLOT_FRAME_X) {
          ball.x = BALL_RADIUS + SLOT_FRAME_X;
          ball.vx *= -0.18;
        }

        if (ball.x >= CANVAS_WIDTH - SLOT_FRAME_X - BALL_RADIUS) {
          ball.x = CANVAS_WIDTH - SLOT_FRAME_X - BALL_RADIUS;
          ball.vx *= -0.18;
        }

        if (ball.y >= SLOT_TOP - BALL_RADIUS) {
          const slotWidth = SLOT_FRAME_WIDTH / SLOT_VALUES.length;
          const clampedX = clamp(ball.x, SLOT_FRAME_X, SLOT_FRAME_X + SLOT_FRAME_WIDTH - 1);
          const slotIndex = clamp(
            Math.floor((clampedX - SLOT_FRAME_X) / slotWidth),
            0,
            SLOT_VALUES.length - 1,
          );
          const landedValue = SLOT_VALUES[slotIndex];

          ball.active = false;
          ball.x = SLOT_FRAME_X + slotWidth * slotIndex + slotWidth / 2;
          ball.y = SLOT_TOP - BALL_RADIUS;
          ball.vx = 0;
          ball.vy = 0;
          landedSlotRef.current = slotIndex;
          callbacksRef.current.onUpdateAmount(landedValue);

          if (landedValue === TARGET_VALUE && !successRef.current) {
            successRef.current = true;
            vibrate([18, 40, 18]);
            callbacksRef.current.onSuccess();
          } else {
            vibrate(12);
            if (resetTimeoutRef.current !== null) {
              window.clearTimeout(resetTimeoutRef.current);
            }
            resetTimeoutRef.current = window.setTimeout(() => {
              resetBall();
              drawScene();
            }, RESET_DELAY_MS);
          }
        }
      }

      drawScene();

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [active, drawScene, resetBall]);

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH,
      y: ((event.clientY - bounds.top) / bounds.height) * CANVAS_HEIGHT,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!active) {
      return;
    }

    const point = getCanvasPoint(event);
    const distance = Math.hypot(point.x - LAUNCH_POINT.x, point.y - LAUNCH_POINT.y);
    if (
      distance > 74 ||
      ballRef.current.active ||
      successRef.current ||
      resetTimeoutRef.current !== null
    ) {
      return;
    }

    aimRef.current = {
      active: true,
      pointerId: event.pointerId,
      x: point.x,
      y: point.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    drawScene();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!aimRef.current.active || aimRef.current.pointerId !== event.pointerId) {
      return;
    }

    const point = getCanvasPoint(event);
    aimRef.current.x = clamp(point.x, LAUNCH_POINT.x + 18, CANVAS_WIDTH - 36);
    aimRef.current.y = clamp(point.y, 28, LAUNCH_POINT.y - 10);
    drawScene();
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!aimRef.current.active || aimRef.current.pointerId !== event.pointerId) {
      return;
    }

    const aim = aimRef.current;
    const distance = Math.hypot(aim.x - LAUNCH_POINT.x, aim.y - LAUNCH_POINT.y);
    if (distance > 18 && !successRef.current) {
      const velocity = getLaunchVelocity(aim.x, aim.y);
      ballRef.current = {
        active: true,
        x: LAUNCH_POINT.x,
        y: LAUNCH_POINT.y,
        vx: velocity.vx,
        vy: velocity.vy,
      };
      landedSlotRef.current = null;
      vibrate(16);
    }

    aimRef.current.active = false;
    aimRef.current.pointerId = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    drawScene();
  };

  useEffect(
    () => () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <div className="stage-slot-game">
      <div className="arc-stage arc-stage--compact">
        <canvas
          className="arc-stage__canvas"
          height={CANVAS_HEIGHT}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          ref={canvasRef}
          width={CANVAS_WIDTH}
        />
      </div>
    </div>
  );
}
