import { Button } from '@toss/tds-mobile';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { StageComponentProps } from '../types';
import { clamp, formatCurrency, vibrate } from '../utils/game';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 320;
const WORLD_WIDTH = 1120;
const TRACK_Y = 226;
const START_X = 74;
const CAMERA_FOCUS_X = 170;
const RESET_DELAY_MS = 920;
const TARGET_VALUE = 3000;
const SCORING_ZONES = [
  { color: '#93C5FD', radius: 32, value: 900, x: 260 },
  { color: '#60A5FA', radius: 34, value: 1600, x: 455 },
  { color: '#34D399', radius: 36, value: 2200, x: 640 },
  { color: '#2563EB', radius: 40, value: 3000, x: 812 },
  { color: '#FB923C', radius: 36, value: 1700, x: 982 },
];

interface BallState {
  active: boolean;
  vx: number;
  wobble: number;
  x: number;
}

function createBall(): BallState {
  return {
    active: false,
    vx: 0,
    wobble: 0,
    x: START_X,
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
  const ballRef = useRef(createBall());
  const cameraXRef = useRef(0);
  const chargeRef = useRef(0);
  const chargingRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const successRef = useRef(false);
  const [chargeDisplay, setChargeDisplay] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  const resetBall = useCallback(() => {
    ballRef.current = createBall();
    chargeRef.current = 0;
    chargingRef.current = false;
    setChargeDisplay(0);
  }, []);

  const drawScene = useCallback((chargeValue: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const background = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    background.addColorStop(0, '#FAFDFF');
    background.addColorStop(1, '#EAF3FF');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const laneTop = TRACK_Y - 28;
    const laneHeight = 56;
    const cameraX = cameraXRef.current;
    const ball = ballRef.current;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    drawRoundedRect(ctx, 18, 18, CANVAS_WIDTH - 36, CANVAS_HEIGHT - 36, 30);
    ctx.fill();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
    drawRoundedRect(ctx, 24, laneTop, CANVAS_WIDTH - 48, laneHeight, 28);
    ctx.fill();

    for (let worldX = 120; worldX <= WORLD_WIDTH - 70; worldX += 70) {
      const screenX = worldX - cameraX;
      if (screenX < -40 || screenX > CANVAS_WIDTH + 40) {
        continue;
      }

      ctx.strokeStyle = worldX % 140 === 0 ? 'rgba(37, 99, 235, 0.18)' : 'rgba(15, 23, 42, 0.08)';
      ctx.lineWidth = worldX % 140 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(screenX, laneTop - 18);
      ctx.lineTo(screenX, laneTop + laneHeight + 18);
      ctx.stroke();
    }

    SCORING_ZONES.forEach((zone) => {
      const screenX = zone.x - cameraX;
      if (screenX < -80 || screenX > CANVAS_WIDTH + 80) {
        return;
      }

      ctx.save();
      ctx.globalAlpha = zone.value === TARGET_VALUE ? 1 : 0.88;
      ctx.beginPath();
      ctx.fillStyle = `${zone.color}22`;
      ctx.arc(screenX, TRACK_Y, zone.radius + 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `${zone.color}44`;
      ctx.arc(screenX, TRACK_Y, zone.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.lineWidth = zone.value === TARGET_VALUE ? 5 : 3;
      ctx.strokeStyle = zone.value === TARGET_VALUE ? '#2563EB' : zone.color;
      ctx.arc(screenX, TRACK_Y, zone.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = `800 ${zone.value === TARGET_VALUE ? 22 : 18}px Pretendard, Apple SD Gothic Neo, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        formatCurrency(zone.value).replace('₩', ''),
        screenX,
        TRACK_Y - zone.radius - 26,
      );
      ctx.restore();
    });

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(36, TRACK_Y + 36);
    ctx.lineTo(CANVAS_WIDTH - 36, TRACK_Y + 36);
    ctx.stroke();

    const ballScreenX = ball.x - cameraX;
    const wobble = Math.sin(ball.wobble) * Math.min(8, ball.vx * 0.01);
    ctx.beginPath();
    ctx.fillStyle = '#0F172A';
    ctx.arc(ballScreenX, TRACK_Y + wobble, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(ballScreenX - 4, TRACK_Y - 4 + wobble, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    drawRoundedRect(ctx, 34, 38, 18, 118, 9);
    ctx.fill();
    ctx.fillStyle = '#3182F6';
    const barHeight = 118 * chargeValue;
    drawRoundedRect(ctx, 34, 156 - barHeight, 18, barHeight, 9);
    ctx.fill();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
    ctx.font = '700 16px Pretendard, Apple SD Gothic Neo, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('START', 34, TRACK_Y - 56);
  }, []);

  useEffect(() => {
    successRef.current = false;
    callbacksRef.current.onUpdateAmount(config.startAmount);
    cameraXRef.current = 0;
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    ballRef.current = createBall();
    chargeRef.current = 0;
    chargingRef.current = false;
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

      const ball = ballRef.current;
      if (chargingRef.current && !ball.active) {
        chargeRef.current = clamp(chargeRef.current + dt * 0.88, 0, 1);
        setChargeDisplay(chargeRef.current);
      }

      if (ball.active) {
        ball.x += ball.vx * dt;
        ball.vx = Math.max(0, ball.vx - (190 + ball.vx * 0.95) * dt);
        ball.wobble += dt * (5.5 + ball.vx * 0.012);

        if (ball.x >= WORLD_WIDTH - 42) {
          ball.x = WORLD_WIDTH - 42;
          ball.vx = 0;
        }

        if (ball.vx <= 12) {
          ball.active = false;
          const landedZone =
            SCORING_ZONES.find((zone) => Math.abs(zone.x - ball.x) <= zone.radius) ?? null;
          const landedValue = landedZone?.value ?? 0;
          callbacksRef.current.onUpdateAmount(landedValue);

          if (landedValue === TARGET_VALUE && !successRef.current) {
            successRef.current = true;
            vibrate([18, 36, 18]);
            callbacksRef.current.onSuccess();
          } else {
            vibrate(12);
            if (resetTimeoutRef.current !== null) {
              window.clearTimeout(resetTimeoutRef.current);
            }
            resetTimeoutRef.current = window.setTimeout(() => {
              resetBall();
              drawScene(0);
            }, RESET_DELAY_MS);
          }
        }
      } else {
        ball.wobble *= 0.92;
      }

      const targetCameraX = ball.active || resetTimeoutRef.current !== null || successRef.current
        ? clamp(ball.x - CAMERA_FOCUS_X, 0, WORLD_WIDTH - CANVAS_WIDTH)
        : 0;
      cameraXRef.current += (targetCameraX - cameraXRef.current) * Math.min(1, dt * 6.8);

      drawScene(chargeRef.current);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [active, drawScene, resetBall]);

  const handleChargeStart = () => {
    if (
      !active ||
      successRef.current ||
      ballRef.current.active ||
      resetTimeoutRef.current !== null
    ) {
      return;
    }

    chargingRef.current = true;
  };

  const handleChargeEnd = () => {
    if (!chargingRef.current || successRef.current || ballRef.current.active) {
      return;
    }

    chargingRef.current = false;
    const power = Math.max(0.12, chargeRef.current);
    ballRef.current = {
      active: true,
      vx: 220 + power * 920,
      wobble: 0,
      x: START_X,
    };
    chargeRef.current = 0;
    setChargeDisplay(0);
    vibrate(18);
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
            {chargeDisplay > 0 ? `밀기 ${Math.round(chargeDisplay * 100)}%` : '밀기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
