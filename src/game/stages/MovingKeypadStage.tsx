import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import type { StageComponentProps } from '../types';
import { vibrate } from '../utils/game';

const KEY_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '←'];
const SHUFFLE_INTERVAL_MS = 1500;

function shuffleKeys(): string[] {
  const arr = [...KEY_LABELS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function MovingKeypadStage({
  active,
  config,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const [typedValue, setTypedValue] = useState('');
  const [keyOrder, setKeyOrder] = useState<string[]>(() => [...KEY_LABELS]);
  const [isShaking, setIsShaking] = useState(false);
  const successRef = useRef(false);
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });

  const requiredAmount = config.targetAmount - config.startAmount;

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  useEffect(() => {
    successRef.current = false;
    setTypedValue('');
    setKeyOrder([...KEY_LABELS]);
    callbacksRef.current.onUpdateAmount(config.startAmount);
  }, [config.id, config.startAmount]);

  useEffect(() => {
    if (!active) return undefined;

    const id = setInterval(() => {
      if (successRef.current) return;
      setIsShaking(true);
      setTimeout(() => {
        setKeyOrder(shuffleKeys());
        setIsShaking(false);
      }, 130);
    }, SHUFFLE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [active]);

  const handleKeyPress = (key: string) => {
    if (!active || successRef.current) return;

    vibrate(18);

    if (key === '←') {
      const next = typedValue.slice(0, -1);
      const num = next ? parseInt(next, 10) : 0;
      setTypedValue(next);
      callbacksRef.current.onUpdateAmount(config.startAmount + num);
      return;
    }

    if (typedValue === '' && (key === '0' || key === '00')) return;
    const next = typedValue + key;
    const num = parseInt(next, 10);
    if (num > requiredAmount) return;

    setTypedValue(next);
    callbacksRef.current.onUpdateAmount(config.startAmount + num);

    if (num === requiredAmount) {
      successRef.current = true;
      vibrate([50, 30, 80]);
      setTimeout(() => callbacksRef.current.onSuccess(), 120);
    }
  };

  const displayNum = typedValue ? parseInt(typedValue, 10) : 0;
  const progressPct = Math.round((displayNum / requiredAmount) * 100);

  return (
    <div className="moving-keypad-stage">
      <div className="moving-keypad-display">
        <span className="moving-keypad-display__hint">
          정확히 {requiredAmount.toLocaleString('ko-KR')}원을 입력하세요
        </span>
        <strong
          className={[
            'moving-keypad-display__amount',
            !typedValue ? 'moving-keypad-display__amount--empty' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {typedValue ? `${displayNum.toLocaleString('ko-KR')}원` : '금액을 입력하세요'}
        </strong>
        <div className="moving-keypad-display__progress-row">
          <div className="moving-keypad-display__bar">
            <div
              className="moving-keypad-display__bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="moving-keypad-display__pct">{progressPct}%</span>
        </div>
      </div>

      <div
        className={[
          'moving-keypad__grid',
          isShaking ? 'moving-keypad__grid--shaking' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {keyOrder.map((key) => (
          <motion.button
            key={key}
            className="moving-keypad__key"
            layout
            onClick={() => handleKeyPress(key)}
            transition={{ damping: 20, mass: 0.7, stiffness: 300, type: 'spring' }}
            type="button"
            whileTap={{ scale: 0.9 }}
          >
            {key === '←' ? '⌫' : key}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
