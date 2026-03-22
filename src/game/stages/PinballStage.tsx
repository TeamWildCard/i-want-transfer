import { Button } from '@toss/tds-mobile';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { StageComponentProps } from '../types';
import { clamp, vibrate } from '../utils/game';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 320;

interface Ball {
  active: boolean;
  r: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface Bumper {
  color: string;
  cooldown: number;
  r: number;
  value: number;
  x: number;
  y: number;
}

interface Spark {
  color: string;
  life: number;
  vx: number;
  vy: number;
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

function createBumpers(): Bumper[] {
  return [
    { color: '#F97316', cooldown: 0, r: 34, value: 100, x: 120, y: 150 },
    { color: '#0EA5E9', cooldown: 0, r: 32, value: 100, x: 280, y: 112 },
    { color: '#8B5CF6', cooldown: 0, r: 34, value: 100, x: 440, y: 150 },
    { color: '#10B981', cooldown: 0, r: 30, value: 100, x: 198, y: 238 },
    { color: '#EF4444', cooldown: 0, r: 30, value: 100, x: 362, y: 238 },
  ];
}

function createBall(): Ball {
  return {
    active: false,
    r: 16,
    vx: 0,
    vy: 0,
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 52,
  };
}

export function PinballStage({
  active,
  config,
  totalAmount,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });
  const amountRef = useRef(config.startAmount);
  const chargeRef = useRef(0);
  const chargingRef = useRef(false);
  const wallHapticCooldownRef = useRef(0);
  const successRef = useRef(false);
  const sceneRef = useRef<{
    ball: Ball;
    bumpers: Bumper[];
    sparks: Spark[];
  }>({
    ball: createBall(),
    bumpers: createBumpers(),
    sparks: [],
  });
  const [chargeDisplay, setChargeDisplay] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  const drawScene = useCallback((chargeValue: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const scene = sceneRef.current;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bg = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bg.addColorStop(0, '#F9FBFF');
    bg.addColorStop(1, '#E4EEFF');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(49, 130, 246, 0.08)';
    drawRoundedRect(ctx, 22, 24, CANVAS_WIDTH - 44, CANVAS_HEIGHT - 48, 28);
    ctx.fill();

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.lineWidth = 8;
    drawRoundedRect(ctx, 22, 24, CANVAS_WIDTH - 44, CANVAS_HEIGHT - 48, 28);
    ctx.stroke();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
    drawRoundedRect(ctx, CANVAS_WIDTH / 2 - 42, CANVAS_HEIGHT - 124, 84, 74, 20);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 26px Apple SD Gothic Neo, Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('3,000원', CANVAS_WIDTH / 2, 52);
    ctx.font = '500 16px Apple SD Gothic Neo, Pretendard, sans-serif';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.56)';
    ctx.fillText('범퍼를 맞춰 정확히 도달하세요', CANVAS_WIDTH / 2, 76);

    scene.bumpers.forEach((bumper) => {
      ctx.beginPath();
      ctx.fillStyle = `${bumper.color}${bumper.cooldown > 0 ? 'EE' : 'CC'}`;
      ctx.arc(bumper.x, bumper.y, bumper.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.arc(bumper.x, bumper.y, bumper.r - 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 18px Apple SD Gothic Neo, Pretendard, sans-serif';
      ctx.fillText('+100', bumper.x, bumper.y + 6);
    });

    scene.sparks.forEach((spark) => {
      ctx.beginPath();
      ctx.fillStyle = spark.color;
      ctx.globalAlpha = spark.life;
      ctx.arc(spark.x, spark.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    const ball = scene.ball;
    ctx.beginPath();
    ctx.fillStyle = '#0F172A';
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(ball.x - 4, ball.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    const powerHeight = 110 * chargeValue;
    ctx.fillStyle = 'rgba(49, 130, 246, 0.12)';
    drawRoundedRect(ctx, 46, CANVAS_HEIGHT - 158, 16, 110, 8);
    ctx.fill();
    ctx.fillStyle = '#3182F6';
    drawRoundedRect(ctx, 46, CANVAS_HEIGHT - 48 - powerHeight, 16, powerHeight, 8);
    ctx.fill();
  }, []);

  useEffect(() => {
    amountRef.current = totalAmount;
  }, [totalAmount]);

  useEffect(() => {
    successRef.current = false;
    amountRef.current = config.startAmount;
    chargeRef.current = 0;
    chargingRef.current = false;
    wallHapticCooldownRef.current = 0;
    sceneRef.current = {
      ball: createBall(),
      bumpers: createBumpers(),
      sparks: [],
    };
    callbacksRef.current.onUpdateAmount(config.startAmount);
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

      const scene = sceneRef.current;
      const ball = scene.ball;

      if (chargingRef.current && !ball.active) {
        chargeRef.current = clamp(chargeRef.current + dt * 0.9, 0, 1);
        setChargeDisplay(chargeRef.current);
      }

      wallHapticCooldownRef.current = Math.max(0, wallHapticCooldownRef.current - dt);
      scene.bumpers.forEach((bumper) => {
        bumper.cooldown = Math.max(0, bumper.cooldown - dt);
      });
      scene.sparks = scene.sparks
        .map((spark) => ({
          ...spark,
          life: spark.life - dt * 2.2,
          x: spark.x + spark.vx * dt,
          y: spark.y + spark.vy * dt,
        }))
        .filter((spark) => spark.life > 0);

      if (ball.active) {
        ball.vy += 860 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x <= 40 + ball.r || ball.x >= CANVAS_WIDTH - 40 - ball.r) {
          ball.x = clamp(ball.x, 40 + ball.r, CANVAS_WIDTH - 40 - ball.r);
          ball.vx *= -0.92;

          if (wallHapticCooldownRef.current <= 0) {
            wallHapticCooldownRef.current = 0.14;
            vibrate(50);
          }
        }

        if (ball.y <= 42 + ball.r) {
          ball.y = 42 + ball.r;
          ball.vy *= -0.88;

          if (wallHapticCooldownRef.current <= 0) {
            wallHapticCooldownRef.current = 0.14;
            vibrate(50);
          }
        }

        scene.bumpers.forEach((bumper) => {
          const dx = ball.x - bumper.x;
          const dy = ball.y - bumper.y;
          const distance = Math.hypot(dx, dy);
          const minDistance = ball.r + bumper.r;

          if (distance >= minDistance || bumper.cooldown > 0) {
            return;
          }

          const nx = distance === 0 ? 0 : dx / distance;
          const ny = distance === 0 ? -1 : dy / distance;
          const overlap = minDistance - distance + 1;
          const projectedVelocity = ball.vx * nx + ball.vy * ny;

          ball.x += nx * overlap;
          ball.y += ny * overlap;
          ball.vx -= 2 * projectedVelocity * nx;
          ball.vy -= 2 * projectedVelocity * ny;
          ball.vx += nx * 120;
          ball.vy += ny * 120;

          bumper.cooldown = 0.18;
          vibrate(50);

          scene.sparks.push(
            ...Array.from({ length: 8 }, (_, index) => ({
              color: bumper.color,
              life: 1,
              vx: Math.cos((Math.PI * 2 * index) / 8) * 120,
              vy: Math.sin((Math.PI * 2 * index) / 8) * 120,
              x: bumper.x,
              y: bumper.y,
            })),
          );

          if (!successRef.current) {
            const nextAmount = clamp(
              amountRef.current + bumper.value,
              config.startAmount,
              config.targetAmount,
            );
            amountRef.current = nextAmount;
            callbacksRef.current.onUpdateAmount(nextAmount);

            if (nextAmount >= config.targetAmount) {
              successRef.current = true;
              ball.active = false;
              chargeRef.current = 0;
              setChargeDisplay(0);
              callbacksRef.current.onSuccess();
            }
          }
        });

        if (ball.y >= CANVAS_HEIGHT + 32) {
          scene.ball = createBall();
          chargeRef.current = 0;
          setChargeDisplay(0);
        }
      }

      drawScene(chargeRef.current);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [active, config.startAmount, config.targetAmount, drawScene]);

  const handleChargeStart = () => {
    if (!active || successRef.current || sceneRef.current.ball.active) {
      return;
    }

    chargingRef.current = true;
  };

  const handleChargeEnd = () => {
    if (!chargingRef.current || successRef.current || sceneRef.current.ball.active) {
      return;
    }

    chargingRef.current = false;
    const power = Math.max(0.18, chargeRef.current);

    sceneRef.current.ball = {
      active: true,
      r: 16,
      vx: (power - 0.5) * 360,
      vy: -(560 + power * 520),
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 56,
    };

    chargeRef.current = 0;
    setChargeDisplay(0);
    vibrate(18);
  };

  return (
    <div className="stage-slot-game">
      <div className="pinball-stage pinball-stage--compact">
        <canvas
          className="pinball-stage__canvas"
          height={CANVAS_HEIGHT}
          ref={canvasRef}
          width={CANVAS_WIDTH}
        />

        <div className="pinball-stage__controls">
          <Button
            color="primary"
            display="full"
            onPointerCancel={handleChargeEnd}
            onPointerDown={handleChargeStart}
            onPointerLeave={handleChargeEnd}
            onPointerUp={handleChargeEnd}
            size="large"
          >
            {chargeDisplay > 0
              ? `발사 준비 ${Math.round(chargeDisplay * 100)}%`
              : 'Launch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
