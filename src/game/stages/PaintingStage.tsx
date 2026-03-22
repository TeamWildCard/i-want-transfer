import { Button } from '@toss/tds-mobile';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { StageComponentProps } from '../types';
import { clamp, vibrate } from '../utils/game';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 320;
const WORLD_WIDTH = 1180;
const SHEET_TOP = 30;
const SHEET_BOTTOM = 260;
const STONE_RADIUS = 14;
const START_X = 90;
const START_Y = 146;
const HOUSE_X = 940;
const HOUSE_Y = 146;
const TARGET_RADIUS = 24;
const RESET_DELAY_MS = 900;

interface StoneState {
  active: boolean;
  spin: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

function createStone(): StoneState {
  return {
    active: false,
    spin: 0,
    vx: 0,
    vy: 0,
    x: START_X,
    y: START_Y,
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

export function PaintingStage({
  active,
  config,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });
  const stoneRef = useRef<StoneState>(createStone());
  const cameraXRef = useRef(0);
  const successRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const holdRef = useRef({
    active: false,
    elapsed: 0,
    pointerId: null as number | null,
    power: 0,
    spin: 0,
    spinDir: 1 as -1 | 1,
  });
  const [chargeDisplay, setChargeDisplay] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  const resetStone = useCallback(() => {
    stoneRef.current = createStone();
    holdRef.current.active = false;
    holdRef.current.elapsed = 0;
    holdRef.current.pointerId = null;
    holdRef.current.power = 0;
    holdRef.current.spin = 0;
    holdRef.current.spinDir = 1;
    setChargeDisplay(0);
  }, []);

  const evaluateAmount = (distance: number) => {
    if (distance <= TARGET_RADIUS) {
      return 3000;
    }
    if (distance <= 44) {
      return 2400;
    }
    if (distance <= 66) {
      return 1700;
    }
    if (distance <= 92) {
      return 900;
    }
    return 0;
  };

  const drawScene = useCallback((charge: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const stone = stoneRef.current;
    const cameraX = cameraXRef.current;
    const hold = holdRef.current;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bg.addColorStop(0, '#F8FCFF');
    bg.addColorStop(1, '#EAF4FF');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
    drawRoundedRect(ctx, 16, 14, CANVAS_WIDTH - 32, CANVAS_HEIGHT - 28, 28);
    ctx.fill();

    const sheetX = 24 - cameraX;
    ctx.fillStyle = '#F7FBFF';
    drawRoundedRect(ctx, sheetX, SHEET_TOP, WORLD_WIDTH - 48, SHEET_BOTTOM - SHEET_TOP, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 64, 175, 0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let x = 80; x < WORLD_WIDTH - 70; x += 70) {
      const screenX = x - cameraX;
      if (screenX < -20 || screenX > CANVAS_WIDTH + 20) {
        continue;
      }
      ctx.strokeStyle = x % 140 === 0 ? 'rgba(37, 99, 235, 0.18)' : 'rgba(15, 23, 42, 0.06)';
      ctx.lineWidth = x % 140 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(screenX, SHEET_TOP + 10);
      ctx.lineTo(screenX, SHEET_BOTTOM - 10);
      ctx.stroke();
    }

    const houseScreenX = HOUSE_X - cameraX;
    const rings = [
      { color: '#0EA5E9', radius: 92 },
      { color: '#EF4444', radius: 66 },
      { color: '#FFFFFF', radius: 44 },
      { color: '#2563EB', radius: 24 },
    ];
    for (const ring of rings) {
      ctx.beginPath();
      ctx.fillStyle = ring.color;
      ctx.arc(houseScreenX, HOUSE_Y, ring.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(houseScreenX - 110, HOUSE_Y);
    ctx.lineTo(houseScreenX + 110, HOUSE_Y);
    ctx.moveTo(houseScreenX, HOUSE_Y - 110);
    ctx.lineTo(houseScreenX, HOUSE_Y + 110);
    ctx.stroke();

    const stoneX = stone.x - cameraX;
    ctx.beginPath();
    ctx.fillStyle = '#0F172A';
    ctx.arc(stoneX, stone.y, STONE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.arc(stoneX, stone.y, STONE_RADIUS - 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(stoneX, stone.y - 1);
    ctx.rotate(stone.spin);
    ctx.fillStyle = '#22C55E';
    drawRoundedRect(ctx, -8, -2, 16, 4, 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    drawRoundedRect(ctx, 34, 34, 18, 112, 8);
    ctx.fill();
    ctx.fillStyle = '#3182F6';
    drawRoundedRect(ctx, 34, 146 - charge * 112, 18, charge * 112, 8);
    ctx.fill();

    if (hold.active && !stone.active) {
      ctx.fillStyle = hold.spinDir > 0 ? 'rgba(14, 165, 233, 0.68)' : 'rgba(239, 68, 68, 0.68)';
      ctx.font = '700 13px Pretendard, Apple SD Gothic Neo, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(hold.spinDir > 0 ? '오른쪽 컬' : '왼쪽 컬', 62, 50);
    }
  }, []);

  useEffect(() => {
    successRef.current = false;
    callbacksRef.current.onUpdateAmount(config.startAmount);
    cameraXRef.current = 0;
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    stoneRef.current = createStone();
    holdRef.current.active = false;
    holdRef.current.elapsed = 0;
    holdRef.current.pointerId = null;
    holdRef.current.power = 0;
    holdRef.current.spin = 0;
    holdRef.current.spinDir = 1;
    window.setTimeout(() => setChargeDisplay(0), 0);
    drawScene(0);
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
      const stone = stoneRef.current;

      if (hold.active && !stone.active) {
        hold.elapsed += dt;
        hold.power = clamp(hold.elapsed * 0.62, 0, 1);
        if (Math.floor(hold.elapsed * 3.2) % 2 === 1) {
          hold.spinDir = -1;
        } else {
          hold.spinDir = 1;
        }
        setChargeDisplay(hold.power);
      }

      if (stone.active) {
        stone.spin += stone.vx * dt * 0.012;
        stone.vx = Math.max(0, stone.vx - (180 + stone.vx * 0.68) * dt);
        stone.vy *= 0.8;
        stone.x += stone.vx * dt;
        stone.y = START_Y;

        if (stone.vx <= 18) {
          stone.active = false;
          const distance = Math.hypot(stone.x - HOUSE_X, stone.y - HOUSE_Y);
          const landedAmount = evaluateAmount(distance);
          callbacksRef.current.onUpdateAmount(landedAmount);

          if (landedAmount === 3000 && !successRef.current) {
            successRef.current = true;
            callbacksRef.current.onSuccess();
            vibrate([18, 34, 18]);
          } else {
            vibrate(12);
            if (resetTimeoutRef.current !== null) {
              window.clearTimeout(resetTimeoutRef.current);
            }
            resetTimeoutRef.current = window.setTimeout(() => {
              resetTimeoutRef.current = null;
              resetStone();
              drawScene(0);
            }, RESET_DELAY_MS);
          }
        }
      }

      const targetCameraX = stone.active
        ? clamp(stone.x - 170, 0, WORLD_WIDTH - CANVAS_WIDTH)
        : resetTimeoutRef.current !== null || successRef.current
          ? clamp(stone.x - 170, 0, WORLD_WIDTH - CANVAS_WIDTH)
          : 0;
      cameraXRef.current += (targetCameraX - cameraXRef.current) * Math.min(1, dt * 7);

      drawScene(hold.power);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [active, drawScene, resetStone]);

  const handleChargeStart = () => {
    if (
      !active ||
      successRef.current ||
      stoneRef.current.active ||
      resetTimeoutRef.current !== null
    ) {
      return;
    }
    const hold = holdRef.current;
    hold.active = true;
    hold.elapsed = 0;
    hold.power = 0;
    hold.spin = 0;
    hold.spinDir = 1;
  };

  const handleChargeEnd = () => {
    const hold = holdRef.current;
    if (!hold.active || successRef.current || stoneRef.current.active) {
      return;
    }
    hold.active = false;
    hold.spin = hold.spinDir * (0.5 + hold.power * 0.7);

    stoneRef.current = {
      active: true,
      spin: hold.spin,
      vx: 320 + hold.power * 820,
      vy: 0,
      x: START_X,
      y: START_Y,
    };

    setChargeDisplay(0);
    hold.power = 0;
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
      <div className="curling-stage curling-stage--compact">
        <canvas
          className="curling-stage__canvas"
          height={CANVAS_HEIGHT}
          ref={canvasRef}
          width={CANVAS_WIDTH}
        />
        <div className="curling-stage__controls">
          <Button
            color="primary"
            display="full"
            onPointerCancel={handleChargeEnd}
            onPointerDown={handleChargeStart}
            onPointerLeave={handleChargeEnd}
            onPointerUp={handleChargeEnd}
            size="large"
          >
            {chargeDisplay > 0 ? `스윕 ${Math.round(chargeDisplay * 100)}%` : '스톤 밀기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
