import { Button } from '@toss/tds-mobile';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { StageComponentProps } from '../types';
import { clamp, vibrate } from '../utils/game';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 320;
const FLOOR_Y = 232;
const AXIS_Y = 252;
const WORLD_AXIS_LEFT = 40;
const WORLD_AXIS_RIGHT = 2140;
const WORLD_MAX = 5000;
const TICK_STEP = 500;
const TARGET_MIN = 2910;
const TARGET_MAX = 3090;
const RESET_DELAY_MS = 820;
const GRAVITY = 2100;
const START_X = WORLD_AXIS_LEFT + 12;
const START_Y = FLOOR_Y;
const CAMERA_FOCUS_X = 192;
const CAMERA_MAX_X = WORLD_AXIS_RIGHT - (CANVAS_WIDTH - 24);
const MIN_POWER = 0.04;
const POWER_CHARGE_RATE = 0.42;
const ANGLE_BASE = -52;
const ANGLE_SWEEP = 14;
const SPEED_BASE = 820;
const SPEED_BY_POWER = 880;
const BOUNCE_Y_DAMP_FIRST = 0.56;
const BOUNCE_Y_DAMP_SECOND = 0.48;
const BOUNCE_X_DAMP = 0.88;

interface MissileState {
  active: boolean;
  bounces: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface TrailPoint {
  life: number;
  x: number;
  y: number;
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

function amountToX(amount: number) {
  return WORLD_AXIS_LEFT + (clamp(amount, 0, WORLD_MAX) / WORLD_MAX) * (WORLD_AXIS_RIGHT - WORLD_AXIS_LEFT);
}

function xToAmount(x: number) {
  return ((x - WORLD_AXIS_LEFT) / (WORLD_AXIS_RIGHT - WORLD_AXIS_LEFT)) * WORLD_MAX;
}

function createMissile(): MissileState {
  return {
    active: false,
    bounces: 0,
    vx: 0,
    vy: 0,
    x: START_X,
    y: START_Y,
  };
}

export function BalanceBarStage({
  active,
  config,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });
  const missileRef = useRef<MissileState>(createMissile());
  const trailRef = useRef<TrailPoint[]>([]);
  const cameraXRef = useRef(0);
  const successRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const landedAmountRef = useRef<number | null>(null);
  const [holdDisplay, setHoldDisplay] = useState(0);

  const holdRef = useRef({
    active: false,
    elapsed: 0,
    power: MIN_POWER,
    sweepDirection: 1,
    sweepNormalized: 0.08,
  });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  const resetMissile = useCallback(() => {
    missileRef.current = createMissile();
    trailRef.current = [];
    landedAmountRef.current = null;
    holdRef.current.active = false;
    holdRef.current.elapsed = 0;
    holdRef.current.power = MIN_POWER;
    holdRef.current.sweepDirection = 1;
    holdRef.current.sweepNormalized = 0.08;
    cameraXRef.current = 0;
    setHoldDisplay(0);
  }, []);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const hold = holdRef.current;
    const missile = missileRef.current;
    const cameraX = cameraXRef.current;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bg.addColorStop(0, '#F7FBFF');
    bg.addColorStop(1, '#E8F2FF');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    drawRoundedRect(ctx, 16, 14, CANVAS_WIDTH - 32, CANVAS_HEIGHT - 28, 28);
    ctx.fill();

    ctx.fillStyle = 'rgba(49, 130, 246, 0.08)';
    drawRoundedRect(ctx, 24, 22, CANVAS_WIDTH - 48, 36, 16);
    ctx.fill();
    ctx.fillStyle = '#1D4ED8';
    ctx.font = '700 15px Pretendard, Apple SD Gothic Neo, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('미사일 발사 후 바닥 3회 반사', 38, 40);

    const targetXMin = amountToX(TARGET_MIN);
    const targetXMax = amountToX(TARGET_MAX);
    ctx.fillStyle = 'rgba(37, 99, 235, 0.13)';
    drawRoundedRect(ctx, targetXMin - cameraX, AXIS_Y - 18, targetXMax - targetXMin, 20, 8);
    ctx.fill();

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(WORLD_AXIS_LEFT - cameraX, AXIS_Y);
    ctx.lineTo(WORLD_AXIS_RIGHT - cameraX, AXIS_Y);
    ctx.stroke();

    for (let mark = TICK_STEP; mark <= WORLD_MAX; mark += TICK_STEP) {
      const x = amountToX(mark) - cameraX;
      if (x < -30 || x > CANVAS_WIDTH + 30) {
        continue;
      }
      const isMajor = mark % 1000 === 0;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = isMajor ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x, AXIS_Y - (isMajor ? 14 : 10));
      ctx.lineTo(x, AXIS_Y + (isMajor ? 14 : 10));
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = `${isMajor ? '700 12px' : '600 11px'} Pretendard, Apple SD Gothic Neo, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(mark), x, AXIS_Y + 30);
    }

    if (hold.active && !missile.active) {
      const angleDeg = ANGLE_BASE + hold.sweepNormalized * ANGLE_SWEEP;
      const angleRad = (angleDeg * Math.PI) / 180;
      const speed = SPEED_BASE + hold.power * SPEED_BY_POWER;
      let simX = START_X;
      let simY = START_Y;
      let simVx = Math.cos(angleRad) * speed;
      let simVy = Math.sin(angleRad) * speed;
      let bounces = 0;

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([7, 9]);
      ctx.beginPath();
      ctx.moveTo(simX - cameraX, simY);

      for (let i = 0; i < 220; i += 1) {
        simVy += GRAVITY * 0.018;
        simX += simVx * 0.018;
        simY += simVy * 0.018;

        if (simY >= FLOOR_Y && simVy > 0) {
          simY = FLOOR_Y;
          bounces += 1;
          if (bounces >= 3) {
            ctx.lineTo(simX - cameraX, simY);
            break;
          }
          simVy = -Math.max(
            160,
            Math.abs(simVy) * (bounces === 1 ? BOUNCE_Y_DAMP_FIRST : BOUNCE_Y_DAMP_SECOND),
          );
          simVx *= BOUNCE_X_DAMP;
        }

        ctx.lineTo(simX - cameraX, simY);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    trailRef.current.forEach((point) => {
      ctx.beginPath();
      ctx.globalAlpha = point.life;
      ctx.fillStyle = '#60A5FA';
      ctx.arc(point.x - cameraX, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    const angleDeg = ANGLE_BASE + hold.sweepNormalized * ANGLE_SWEEP;
    const angleRad = (angleDeg * Math.PI) / 180;
    const launcherLength = 66;
    const launcherX = START_X - cameraX;
    const muzzleX = launcherX + Math.cos(angleRad) * launcherLength;
    const muzzleY = START_Y + Math.sin(angleRad) * launcherLength;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(launcherX, START_Y);
    ctx.lineTo(muzzleX, muzzleY);
    ctx.stroke();

    const drawX = missile.active ? missile.x - cameraX : START_X - cameraX;
    const drawY = missile.active ? missile.y : START_Y;
    const rotation = missile.active ? Math.atan2(missile.vy, missile.vx) : angleRad;
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(rotation);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#60A5FA';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-30, -7);
    ctx.lineTo(-30, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    drawRoundedRect(ctx, 30, 76, 16, 96, 8);
    ctx.fill();
    ctx.fillStyle = '#3182F6';
    drawRoundedRect(ctx, 30, 172 - hold.power * 96, 16, hold.power * 96, 8);
    ctx.fill();
  }, []);

  useEffect(() => {
    successRef.current = false;
    callbacksRef.current.onUpdateAmount(config.startAmount);
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    missileRef.current = createMissile();
    trailRef.current = [];
    landedAmountRef.current = null;
    cameraXRef.current = 0;
    holdRef.current.active = false;
    holdRef.current.elapsed = 0;
    holdRef.current.power = MIN_POWER;
    holdRef.current.sweepDirection = 1;
    holdRef.current.sweepNormalized = 0.08;
    window.setTimeout(() => setHoldDisplay(0), 0);
    drawScene();
  }, [config.id, config.startAmount, drawScene]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let frameId = 0;
    let lastFrame = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastFrame) / 1000, 0.033);
      lastFrame = now;

      const hold = holdRef.current;
      const missile = missileRef.current;

      if (hold.active && !missile.active) {
        hold.elapsed += dt;
        hold.power = clamp(MIN_POWER + hold.elapsed * POWER_CHARGE_RATE, MIN_POWER, 1);
        hold.sweepNormalized += dt * 1.06 * hold.sweepDirection;
        if (hold.sweepNormalized >= 1) {
          hold.sweepNormalized = 1;
          hold.sweepDirection = -1;
        }
        if (hold.sweepNormalized <= 0) {
          hold.sweepNormalized = 0;
          hold.sweepDirection = 1;
        }
        setHoldDisplay(hold.power);
      }

      trailRef.current = trailRef.current
        .map((point) => ({ ...point, life: point.life - dt * 1.9 }))
        .filter((point) => point.life > 0);

      if (missile.active) {
        missile.vy += GRAVITY * dt;
        missile.x += missile.vx * dt;
        missile.y += missile.vy * dt;

        if (Math.random() > 0.25) {
          trailRef.current.push({ life: 0.9, x: missile.x, y: missile.y });
        }

        if (missile.y >= FLOOR_Y && missile.vy > 0) {
          missile.y = FLOOR_Y;
          missile.bounces += 1;

          if (missile.bounces >= 3) {
            missile.active = false;
            missile.vx = 0;
            missile.vy = 0;

            const finalAmount = clamp(Math.round(xToAmount(missile.x)), 0, WORLD_MAX);
            const inTarget = finalAmount >= TARGET_MIN && finalAmount <= TARGET_MAX;
            landedAmountRef.current = finalAmount;
            callbacksRef.current.onUpdateAmount(finalAmount);

            if (inTarget && !successRef.current) {
              successRef.current = true;
              callbacksRef.current.onSuccess();
              vibrate([18, 32, 18]);
            } else {
              vibrate(12);
              if (resetTimeoutRef.current !== null) {
                window.clearTimeout(resetTimeoutRef.current);
              }
              resetTimeoutRef.current = window.setTimeout(() => {
                resetTimeoutRef.current = null;
                resetMissile();
                drawScene();
              }, RESET_DELAY_MS);
            }
          } else {
            missile.vy = -Math.max(
              160,
              Math.abs(missile.vy)
                * (missile.bounces === 1 ? BOUNCE_Y_DAMP_FIRST : BOUNCE_Y_DAMP_SECOND),
            );
            missile.vx *= BOUNCE_X_DAMP;
            vibrate(8);
          }
        }
      }

      const targetCameraX = missile.active || resetTimeoutRef.current !== null || successRef.current
        ? clamp(missile.x - CAMERA_FOCUS_X, 0, CAMERA_MAX_X)
        : 0;
      cameraXRef.current += (targetCameraX - cameraXRef.current) * Math.min(1, dt * 7.6);

      drawScene();
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [active, config.targetAmount, drawScene, resetMissile]);

  const handleHoldStart = () => {
    if (
      !active ||
      successRef.current ||
      missileRef.current.active ||
      resetTimeoutRef.current !== null
    ) {
      return;
    }
    const hold = holdRef.current;
    hold.active = true;
    hold.elapsed = 0;
    hold.power = MIN_POWER;
  };

  const handleHoldEnd = () => {
    const hold = holdRef.current;
    if (!hold.active || successRef.current || missileRef.current.active) {
      return;
    }
    hold.active = false;

    const angleDeg = ANGLE_BASE + hold.sweepNormalized * ANGLE_SWEEP;
    const angleRad = (angleDeg * Math.PI) / 180;
    const speed = SPEED_BASE + hold.power * SPEED_BY_POWER;

    missileRef.current = {
      active: true,
      bounces: 0,
      vx: Math.cos(angleRad) * speed,
      vy: Math.sin(angleRad) * speed,
      x: START_X,
      y: START_Y,
    };
    trailRef.current = [];
    landedAmountRef.current = null;
    setHoldDisplay(0);
    hold.power = MIN_POWER;
    vibrate(16);
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
        <canvas className="arc-stage__canvas" height={CANVAS_HEIGHT} ref={canvasRef} width={CANVAS_WIDTH} />
        <div className="arc-stage__controls">
          <Button
            color="primary"
            display="full"
            onPointerCancel={handleHoldEnd}
            onPointerDown={handleHoldStart}
            onPointerLeave={handleHoldEnd}
            onPointerUp={handleHoldEnd}
            size="large"
          >
            {holdDisplay > 0 ? `미사일 충전 ${Math.round(holdDisplay * 100)}%` : '미사일 발사'}
          </Button>
        </div>
      </div>
    </div>
  );
}
