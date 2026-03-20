import { Button } from '@toss/tds-mobile';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { IntroSequence } from './game/components/IntroSequence';
import { ResultOverlay } from './game/components/ResultOverlay';
import { STAGES } from './game/config/stages';
import { useStageTimer } from './game/hooks/useStageTimer';
import { clamp, formatCountdown, formatCurrency } from './game/utils/game';
import './App.css';

type Phase = 'completed' | 'game-over' | 'intro' | 'playing';

function createInitialAmounts() {
  return Object.fromEntries(STAGES.map((stage) => [stage.id, stage.startAmount]));
}

function createInitialReadyState() {
  return Object.fromEntries(STAGES.map((stage) => [stage.id, false]));
}

const stageMotion = {
  center: { opacity: 1, x: 0 },
  enter: (direction: number) => ({ opacity: 0, x: `${direction * 18}%` }),
  exit: (direction: number) => ({ opacity: 0, x: `${direction * -18}%` }),
};

function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageAmounts, setStageAmounts] =
    useState<Record<string, number>>(createInitialAmounts);
  const [stageReady, setStageReady] =
    useState<Record<string, boolean>>(createInitialReadyState);
  const [stageDirection, setStageDirection] = useState(1);
  const [timerSeed, setTimerSeed] = useState(0);

  const currentStage = STAGES[currentStageIndex];
  const CurrentStageComponent = currentStage.Component;
  const currentAmount = stageAmounts[currentStage.id] ?? currentStage.startAmount;
  const isCurrentStageReady = Boolean(stageReady[currentStage.id]);

  const remainingSeconds = useStageTimer({
    active: phase === 'playing',
    durationSeconds: currentStage.durationSeconds,
    onExpire: () => {
      setPhase('game-over');
    },
    resetKey: `${currentStage.id}-${timerSeed}`,
  });

  const resetGame = (nextPhase: Phase) => {
    setCurrentStageIndex(0);
    setStageAmounts(createInitialAmounts());
    setStageReady(createInitialReadyState());
    setStageDirection(1);
    setTimerSeed((previousSeed) => previousSeed + 1);
    setPhase(nextPhase);
  };

  const handleStageAmountUpdate = (nextTotalAmount: number) => {
    const clampedAmount = clamp(
      nextTotalAmount,
      currentStage.startAmount,
      currentStage.targetAmount,
    );

    setStageAmounts((previousAmounts) => {
      if (previousAmounts[currentStage.id] === clampedAmount) {
        return previousAmounts;
      }

      return {
        ...previousAmounts,
        [currentStage.id]: clampedAmount,
      };
    });
  };

  const handleStageSuccess = () => {
    setStageReady((previousReady) => {
      if (previousReady[currentStage.id]) {
        return previousReady;
      }

      return {
        ...previousReady,
        [currentStage.id]: true,
      };
    });

    setStageAmounts((previousAmounts) => ({
      ...previousAmounts,
      [currentStage.id]: currentStage.targetAmount,
    }));
  };

  const handleAdvance = () => {
    if (!isCurrentStageReady) {
      return;
    }

    if (currentStageIndex === STAGES.length - 1) {
      setPhase('completed');
      return;
    }

    const nextStage = STAGES[currentStageIndex + 1];
    setStageDirection(1);
    setCurrentStageIndex((previousIndex) => previousIndex + 1);
    setStageAmounts((previousAmounts) => ({
      ...previousAmounts,
      [nextStage.id]: nextStage.startAmount,
    }));
    setTimerSeed((previousSeed) => previousSeed + 1);
  };

  if (phase === 'intro') {
    return (
      <div className="app-shell">
        <div className="ambient ambient--blue" />
        <div className="ambient ambient--orange" />
        <div className="phone-rig">
          <IntroSequence onComplete={() => resetGame('playing')} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient--blue" />
      <div className="ambient ambient--orange" />

      <div className="phone-rig">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="phone-device"
          initial={{ opacity: 0, y: 36 }}
          transition={{ duration: 0.45 }}
        >
          <div className="phone-notch" />

          <div className="phone-screen">
            <div className="phone-topbar">
              <span className="story-badge">따끈붕어빵 미션</span>
              <span className="timer-badge">{formatCountdown(remainingSeconds)}</span>
            </div>

            <section className="transfer-card">
              <span className="transfer-card__label">받는 사람</span>
              <strong className="transfer-card__recipient">따끈붕어빵 사장님</strong>
              <p className="transfer-card__question">얼마나 옮길까요?</p>
              <div className="transfer-card__amount">{formatCurrency(currentAmount)}</div>
            </section>

            <div className="stage-tabs">
              {STAGES.map((stage, index) => {
                const isDone =
                  index < currentStageIndex ||
                  (phase === 'completed' && index <= currentStageIndex);
                const isActive = index === currentStageIndex;
                const isReady = isActive && isCurrentStageReady;

                return (
                  <div
                    className={[
                      'stage-tab',
                      isActive ? 'stage-tab--active' : '',
                      isDone ? 'stage-tab--done' : '',
                      isReady ? 'stage-tab--ready' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={stage.id}
                  >
                    <span>{stage.chapter.replace('CHAPTER ', 'C')}</span>
                    <strong>{stage.title}</strong>
                  </div>
                );
              })}
            </div>

            <header className="stage-header">
              <span className="stage-header__eyebrow">{currentStage.chapter}</span>
              <h1 className="stage-header__title">{currentStage.title}</h1>
              <p className="stage-header__objective">{currentStage.objective}</p>
            </header>

            <div className="stage-frame">
              <AnimatePresence custom={stageDirection} mode="wait">
                <motion.div
                  animate="center"
                  className="stage-frame__inner"
                  custom={stageDirection}
                  exit="exit"
                  initial="enter"
                  key={`${currentStage.id}-${timerSeed}`}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  variants={stageMotion}
                >
                  <CurrentStageComponent
                    active={phase === 'playing'}
                    config={currentStage}
                    onSuccess={handleStageSuccess}
                    onUpdateAmount={handleStageAmountUpdate}
                    totalAmount={currentAmount}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="stage-cta">
              <p className="stage-cta__hint">
                {isCurrentStageReady ? currentStage.readyLabel : currentStage.hint}
              </p>
              <Button
                color="primary"
                disabled={!isCurrentStageReady}
                display="full"
                onClick={handleAdvance}
                size="xlarge"
              >
                {currentStage.ctaLabel}
              </Button>
            </footer>

            {phase === 'game-over' ? (
              <ResultOverlay
                body="30초를 넘겨 버렸어요. 다시 첫 챕터부터 3,000원을 맞춰봅시다."
                ctaLabel="다시 시도"
                onAction={() => resetGame('playing')}
                title="게임 오버"
              />
            ) : null}

            {phase === 'completed' ? (
              <ResultOverlay
                body="따끈붕어빵 사장님께 정확히 3,000원을 보냈어요. 의도적인 불편함 속에서도 송금 성공입니다."
                ctaLabel="한 번 더 플레이"
                onAction={() => resetGame('playing')}
                onSecondary={() => resetGame('intro')}
                secondaryLabel="인트로 다시 보기"
                title="송금 완료"
              />
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
