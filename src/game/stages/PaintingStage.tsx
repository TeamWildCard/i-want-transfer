import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { StagePanel } from '../components/StagePanel';
import type { StageComponentProps } from '../types';
import { clamp, formatCurrency, normalizeProgress, vibrate } from '../utils/game';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 320;
const DRAW_TEXT = '3000';

export function PaintingStage({
  active,
  config,
  totalAmount,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });
  const lastPublishedAmountRef = useRef(config.startAmount);
  const lastVibrateAtRef = useRef(0);
  const successRef = useRef(false);
  const [coverage, setCoverage] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!canvas || !drawCanvas || !maskCanvas) {
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

    ctx.strokeStyle = 'rgba(49, 130, 246, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 20; x < CANVAS_WIDTH; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    ctx.drawImage(maskCanvas, 0, 0);
    ctx.fillStyle = 'rgba(49, 130, 246, 0.07)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.font = '900 190px Apple SD Gothic Neo, Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.lineWidth = 10;
    ctx.strokeText(DRAW_TEXT, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 6);

    ctx.save();
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(drawCanvas, 0, 0);
    ctx.restore();
  }, []);

  const publishCoverage = (nextCoverage: number) => {
    setCoverage(nextCoverage);

    const nextAmount = clamp(
      config.startAmount +
        Math.round((config.targetAmount - config.startAmount) * nextCoverage),
      config.startAmount,
      config.targetAmount,
    );

    if (nextAmount !== lastPublishedAmountRef.current) {
      lastPublishedAmountRef.current = nextAmount;
      callbacksRef.current.onUpdateAmount(nextAmount);
    }

    if (nextCoverage >= 0.95 && !successRef.current) {
      successRef.current = true;
      callbacksRef.current.onUpdateAmount(config.targetAmount);
      callbacksRef.current.onSuccess();
    }
  };

  const updateCoverage = () => {
    const drawCanvas = drawCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!drawCanvas || !maskCanvas) {
      return;
    }

    const drawCtx = drawCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!drawCtx || !maskCtx) {
      return;
    }

    const drawPixels = drawCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
    const maskPixels = maskCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;

    let fillablePixels = 0;
    let filledPixels = 0;

    for (let i = 3; i < maskPixels.length; i += 4) {
      if (maskPixels[i] > 0) {
        fillablePixels += 1;
        if (drawPixels[i] > 20) {
          filledPixels += 1;
        }
      }
    }

    publishCoverage(fillablePixels > 0 ? filledPixels / fillablePixels : 0);
  };

  const drawStroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) {
      return;
    }

    const drawCtx = drawCanvas.getContext('2d');
    if (!drawCtx) {
      return;
    }

    drawCtx.strokeStyle = '#3182F6';
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.lineWidth = 28;
    drawCtx.beginPath();
    drawCtx.moveTo(from.x, from.y);
    drawCtx.lineTo(to.x, to.y);
    drawCtx.stroke();
    renderScene();
    updateCoverage();
  };

  useEffect(() => {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = CANVAS_WIDTH;
    maskCanvas.height = CANVAS_HEIGHT;
    maskCanvasRef.current = maskCanvas;

    const drawCanvas = document.createElement('canvas');
    drawCanvas.width = CANVAS_WIDTH;
    drawCanvas.height = CANVAS_HEIGHT;
    drawCanvasRef.current = drawCanvas;

    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      maskCtx.fillStyle = '#0F172A';
      maskCtx.font = '900 190px Apple SD Gothic Neo, Pretendard, sans-serif';
      maskCtx.textAlign = 'center';
      maskCtx.textBaseline = 'middle';
      maskCtx.fillText(DRAW_TEXT, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 6);
    }

    successRef.current = false;
    lastPublishedAmountRef.current = config.startAmount;
    callbacksRef.current.onUpdateAmount(config.startAmount);
    renderScene();
  }, [config.id, config.startAmount, renderScene]);

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
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

    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPointRef.current) {
      return;
    }

    const nextPoint = getPoint(event);
    drawStroke(lastPointRef.current, nextPoint);
    lastPointRef.current = nextPoint;

    const now = performance.now();
    if (now - lastVibrateAtRef.current > 90) {
      lastVibrateAtRef.current = now;
      vibrate(8);
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) {
      return;
    }

    drawingRef.current = false;
    lastPointRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    updateCoverage();
  };

  return (
    <StagePanel
      description={config.description}
      footer={config.hint}
      progress={normalizeProgress(totalAmount, config.startAmount, config.targetAmount)}
      stats={`${Math.round(coverage * 100)}% 채움`}
    >
      <div className="painting-stage">
        <canvas
          className="painting-stage__canvas"
          height={CANVAS_HEIGHT}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          ref={canvasRef}
          width={CANVAS_WIDTH}
        />

        <div className="painting-stage__stats">
          <div className="painting-stage__chip">
            <span>현재 금액</span>
            <strong>{formatCurrency(totalAmount)}</strong>
          </div>
          <div className="painting-stage__chip">
            <span>성공 기준</span>
            <strong>95%</strong>
          </div>
        </div>
      </div>
    </StagePanel>
  );
}
