import { Button } from '@toss/tds-mobile';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { ResultOverlay } from './game/components/ResultOverlay';
import { STAGES } from './game/config/stages';
import { useStageTimer } from './game/hooks/useStageTimer';
import { clamp, formatCurrency } from './game/utils/game';
import './App.css';

type IntroStep = 0 | 1 | 2;
type Phase = 'completed' | 'game-over' | 'intro' | 'playing';

function createInitialAmounts() {
  return Object.fromEntries(STAGES.map((stage) => [stage.id, stage.startAmount]));
}

function createInitialReadyState() {
  return Object.fromEntries(STAGES.map((stage) => [stage.id, false]));
}

function createDebugAmounts(stageIndex: number) {
  return Object.fromEntries(
    STAGES.map((stage, index) => {
      if (index < stageIndex) {
        return [stage.id, stage.targetAmount];
      }

      return [stage.id, stage.startAmount];
    }),
  );
}

function createDebugReadyState(stageIndex: number) {
  return Object.fromEntries(STAGES.map((stage, index) => [stage.id, index < stageIndex]));
}

const stageMotion = {
  center: { opacity: 1, x: 0 },
  enter: (direction: number) => ({ opacity: 0, x: `${direction * 18}%` }),
  exit: (direction: number) => ({ opacity: 0, x: `${direction * -18}%` }),
};

const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '←'];

function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [introStep, setIntroStep] = useState<IntroStep>(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageAmounts, setStageAmounts] =
    useState<Record<string, number>>(createInitialAmounts);
  const [stageReady, setStageReady] =
    useState<Record<string, boolean>>(createInitialReadyState);
  const [stageDirection, setStageDirection] = useState(1);
  const [timerSeed, setTimerSeed] = useState(0);
  const isDebugMode = import.meta.env.DEV;

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

  useEffect(() => {
    if (phase !== 'intro') {
      return undefined;
    }

    const timers = [
      window.setTimeout(() => setIntroStep(1), 700),
      window.setTimeout(() => setIntroStep(2), 1700),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [phase, timerSeed]);

  const resetGame = (nextPhase: Phase) => {
    setCurrentStageIndex(0);
    setStageAmounts(createInitialAmounts());
    setStageReady(createInitialReadyState());
    setStageDirection(1);
    setTimerSeed((previousSeed) => previousSeed + 1);
    setPhase(nextPhase);
    setIntroStep(nextPhase === 'intro' ? 0 : 2);
  };

  const jumpToStage = (nextStageIndex: number) => {
    setCurrentStageIndex(nextStageIndex);
    setStageAmounts(createDebugAmounts(nextStageIndex));
    setStageReady(createDebugReadyState(nextStageIndex));
    setStageDirection(nextStageIndex >= currentStageIndex ? 1 : -1);
    setTimerSeed((previousSeed) => previousSeed + 1);
    setIntroStep(2);
    setPhase('playing');
  };

  const handleIntroStart = () => {
    if (phase !== 'intro' || introStep !== 2) {
      return;
    }

    setPhase('playing');
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

  const showPhone = phase !== 'intro' || introStep >= 1;
  const showRecipientScreen = phase === 'intro' && introStep === 1;
  const showAmountScreen = phase !== 'intro' || introStep >= 2;

  return (
    <div className="app-shell">
      <div className="ambient ambient--blue" />
      <div className="ambient ambient--orange" />

      {isDebugMode ? (
        <div className="debug-stage-bar">
          <div className="debug-stage-bar__actions">
            {STAGES.map((stage, index) => (
              <button
                className={[
                  'debug-stage-bar__button',
                  index === currentStageIndex ? 'debug-stage-bar__button--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={stage.id}
                onClick={() => jumpToStage(index)}
                type="button"
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="intro-shell">
        <div className="intro-copy">
          <h1 className="intro-copy__title">
            붕어빵 사장님께
            <br />
            송금해야 하는 상황.
          </h1>
          <p className="intro-copy__body">자, 이제 토스를 켜고 송금을 해볼까?</p>
        </div>

        <div className="phone-rig">
          <motion.div
            animate={{ opacity: showPhone ? 1 : 0, y: showPhone ? 0 : 220 }}
            className="phone-device"
            initial={{ opacity: 0, y: 220 }}
            transition={{ duration: 0.8, ease: [0.2, 1, 0.36, 1] }}
          >
            <div className="phone-notch" />

            <div className="phone-screen">
              <AnimatePresence mode="wait">
                {showRecipientScreen ? (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="intro-preview intro-preview--recipient"
                    exit={{ opacity: 0, x: -24 }}
                    initial={{ opacity: 0, x: 24 }}
                    key="recipient"
                    transition={{ duration: 0.35 }}
                  >
                    <div className="intro-preview__contact">
                      <span className="transfer-card__label">받는 사람</span>
                      <strong className="transfer-card__recipient">따끈붕어빵 사장님</strong>
                      <p className="intro-preview__helper">
                        이미 선택돼 있어요. 이제 금액만 넣으면 끝일 줄 알았죠.
                      </p>
                    </div>
                  </motion.div>
                ) : showAmountScreen ? (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="intro-flow"
                    exit={{ opacity: 0, x: -24 }}
                    initial={{ opacity: 0, x: 24 }}
                    key="amount"
                    transition={{ duration: 0.35 }}
                  >
                    <section className="transfer-card">
                      <span className="transfer-card__label">받는 사람</span>
                      <strong className="transfer-card__recipient">따끈붕어빵 사장님</strong>
                      <p className="transfer-card__question">얼마나 옮길까요?</p>
                      <div className="transfer-card__amount">{formatCurrency(currentAmount)}</div>
                    </section>

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

                      <div
                        className={[
                          'keypad-slot',
                          phase === 'intro' ? 'keypad-slot--visible' : 'keypad-slot--hidden',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className="intro-keypad intro-keypad--slot">
                          {keypadKeys.map((key) => (
                            <button
                              aria-label={`${key} 키`}
                              className="intro-keypad__key"
                              key={key}
                              onClick={handleIntroStart}
                              type="button"
                            >
                              {key}
                            </button>
                          ))}
                        </div>
                      </div>

                      {phase !== 'intro' && isCurrentStageReady ? (
                        <div className="stage-floating-cta">
                          <Button
                            color="primary"
                            display="full"
                            onClick={handleAdvance}
                            size="large"
                          >
                            {currentStage.ctaLabel}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {phase === 'game-over' ? (
                <ResultOverlay
                  body="30초를 넘겨 버렸어요. 다시 첫 챕터부터 4,000원을 맞춰봅시다."
                  ctaLabel="다시 시도"
                  onAction={() => resetGame('playing')}
                  title="게임 오버"
                />
              ) : null}

              {phase === 'completed' ? (
                <ResultOverlay
                  body="따끈붕어빵 사장님께 정확히 4,000원을 보냈어요. 의도적인 불편함 속에서도 송금 성공입니다."
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
    </div>
  );
}

export default App;
