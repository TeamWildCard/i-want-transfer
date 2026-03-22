import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import type { StageComponentProps } from '../types';
import { clamp, vibrate } from '../utils/game';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 320;
const BALL_RADIUS = 11;
const PADDLE_Y = CANVAS_HEIGHT - 32;
const BLOCK_VALUE = 300;
const BLOCK_COLUMNS = 5;
const BLOCK_ROWS = 2;

interface Ball {
  r: number;
  serveAt: number;
  stuck: boolean;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface Block {
  active: boolean;
  color: string;
  height: number;
  value: number;
  width: number;
  x: number;
  y: number;
}

interface Paddle {
  height: number;
  width: number;
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

function createPaddle(): Paddle {
  return {
    height: 14,
    width: 112,
    x: CANVAS_WIDTH / 2,
    y: PADDLE_Y,
  };
}

function createBlocks(): Block[] {
  const gap = 10;
  const blockWidth = 94;
  const blockHeight = 34;
  const colors = ['#60A5FA', '#34D399', '#FBBF24', '#FB7185', '#A78BFA'];

  return Array.from({ length: BLOCK_COLUMNS * BLOCK_ROWS }, (_, index) => {
    const row = Math.floor(index / BLOCK_COLUMNS);
    const column = index % BLOCK_COLUMNS;
    const totalWidth = BLOCK_COLUMNS * blockWidth + (BLOCK_COLUMNS - 1) * gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    return {
      active: true,
      color: colors[column % colors.length],
      height: blockHeight,
      value: BLOCK_VALUE,
      width: blockWidth,
      x: startX + column * (blockWidth + gap),
      y: 42 + row * (blockHeight + 12),
    };
  });
}

function createBall(paddleX: number, serveAt: number): Ball {
  return {
    r: BALL_RADIUS,
    serveAt,
    stuck: true,
    vx: 0,
    vy: 0,
    x: paddleX,
    y: PADDLE_Y - BALL_RADIUS - 4,
  };
}

export function PinballStage({
  active,
  config,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });
  const amountRef = useRef(config.startAmount);
  const successRef = useRef(false);
  const serveDirectionRef = useRef(1);
  const dragPointerRef = useRef<number | null>(null);
  const sceneRef = useRef<{
    ball: Ball;
    blocks: Block[];
    paddle: Paddle;
  }>({
    ball: createBall(CANVAS_WIDTH / 2, 0),
    blocks: createBlocks(),
    paddle: createPaddle(),
  });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  const drawScene = useCallback(() => {
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

    scene.blocks.forEach((block) => {
      if (!block.active) {
        return;
      }

      ctx.fillStyle = `${block.color}22`;
      drawRoundedRect(ctx, block.x, block.y, block.width, block.height, 14);
      ctx.fill();

      ctx.fillStyle = block.color;
      drawRoundedRect(ctx, block.x, block.y, block.width, 12, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, block.x, block.y, block.width, block.height, 14);
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '800 18px Pretendard, Apple SD Gothic Neo, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('300', block.x + block.width / 2, block.y + block.height / 2 + 3);
    });

    const paddle = scene.paddle;
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(
      ctx,
      paddle.x - paddle.width / 2,
      paddle.y - paddle.height / 2,
      paddle.width,
      paddle.height,
      7,
    );
    ctx.fill();

    ctx.fillStyle = '#E2E8F0';
    drawRoundedRect(
      ctx,
      paddle.x - paddle.width / 2 + 12,
      paddle.y - paddle.height / 2 + 3,
      paddle.width - 24,
      4,
      2,
    );
    ctx.fill();

    const ball = scene.ball;
    ctx.beginPath();
    ctx.fillStyle = '#0F172A';
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(ball.x - 4, ball.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  useEffect(() => {
    successRef.current = false;
    amountRef.current = config.startAmount;
    serveDirectionRef.current = 1;
    const paddle = createPaddle();
    sceneRef.current = {
      ball: createBall(paddle.x, performance.now() + 500),
      blocks: createBlocks(),
      paddle,
    };
    callbacksRef.current.onUpdateAmount(config.startAmount);
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

      const scene = sceneRef.current;
      const ball = scene.ball;
      const paddle = scene.paddle;

      if (ball.stuck) {
        ball.x = paddle.x;
        ball.y = paddle.y - ball.r - 4;

        if (now >= ball.serveAt && !successRef.current) {
          ball.stuck = false;
          ball.vx = 190 * serveDirectionRef.current;
          ball.vy = -290;
          serveDirectionRef.current *= -1;
        }
      } else {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.vx = clamp(ball.vx, -380, 380);
        ball.vy = clamp(ball.vy, -420, 420);

        if (ball.x <= 34 + ball.r || ball.x >= CANVAS_WIDTH - 34 - ball.r) {
          ball.x = clamp(ball.x, 34 + ball.r, CANVAS_WIDTH - 34 - ball.r);
          ball.vx *= -1;
          vibrate(8);
        }

        if (ball.y <= 34 + ball.r) {
          ball.y = 34 + ball.r;
          ball.vy = Math.abs(ball.vy);
        }

        const paddleLeft = paddle.x - paddle.width / 2;
        const paddleRight = paddle.x + paddle.width / 2;
        const paddleTop = paddle.y - paddle.height / 2;
        const paddleBottom = paddle.y + paddle.height / 2;

        const intersectsPaddle =
          ball.x + ball.r >= paddleLeft &&
          ball.x - ball.r <= paddleRight &&
          ball.y + ball.r >= paddleTop &&
          ball.y - ball.r <= paddleBottom &&
          ball.vy > 0;

        if (intersectsPaddle) {
          const hitRatio = (ball.x - paddle.x) / (paddle.width / 2);
          ball.y = paddleTop - ball.r - 1;
          ball.vx = hitRatio * 300;
          ball.vy = -Math.max(240, Math.abs(ball.vy) * 0.96 + 18);
          vibrate(10);
        }

        for (const block of scene.blocks) {
          if (!block.active) {
            continue;
          }

          const intersectsBlock =
            ball.x + ball.r >= block.x &&
            ball.x - ball.r <= block.x + block.width &&
            ball.y + ball.r >= block.y &&
            ball.y - ball.r <= block.y + block.height;

          if (!intersectsBlock) {
            continue;
          }

          const overlapLeft = ball.x + ball.r - block.x;
          const overlapRight = block.x + block.width - (ball.x - ball.r);
          const overlapTop = ball.y + ball.r - block.y;
          const overlapBottom = block.y + block.height - (ball.y - ball.r);
          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          block.active = false;
          if (minOverlapX < minOverlapY) {
            ball.vx *= -1;
          } else {
            ball.vy *= -1;
          }

          const nextAmount = clamp(
            amountRef.current + block.value,
            config.startAmount,
            config.targetAmount,
          );
          amountRef.current = nextAmount;
          callbacksRef.current.onUpdateAmount(nextAmount);
          vibrate(14);

          if (nextAmount >= config.targetAmount && !successRef.current) {
            successRef.current = true;
            ball.stuck = true;
            ball.vx = 0;
            ball.vy = 0;
            callbacksRef.current.onSuccess();
          }
          break;
        }

        if (ball.y - ball.r > CANVAS_HEIGHT) {
          scene.ball = createBall(paddle.x, now + 480);
          vibrate(18);
        }
      }

      drawScene();
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [active, config.startAmount, config.targetAmount, drawScene]);

  const updatePaddle = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextX =
      ((event.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH;
    sceneRef.current.paddle.x = clamp(
      nextX,
      sceneRef.current.paddle.width / 2 + 34,
      CANVAS_WIDTH - sceneRef.current.paddle.width / 2 - 34,
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!active) {
      return;
    }

    dragPointerRef.current = event.pointerId;
    updatePaddle(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    drawScene();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragPointerRef.current !== event.pointerId) {
      return;
    }

    updatePaddle(event);
    drawScene();
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragPointerRef.current !== event.pointerId) {
      return;
    }

    dragPointerRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="stage-slot-game">
      <div className="breakout-stage breakout-stage--compact">
        <canvas
          className="breakout-stage__canvas"
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
