import { TextButton } from '@toss/tds-mobile';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface IntroSequenceProps {
  onComplete: () => void;
}

const screenVariants = {
  animate: { opacity: 1, x: 0 },
  enter: { opacity: 0, x: 32 },
  exit: { opacity: 0, x: -32 },
};

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [step, setStep] = useState(0);
  const completedRef = useRef(false);
  const finishTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStep(1), 700),
      window.setTimeout(() => setStep(2), 1700),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
      if (finishTimeoutRef.current !== null) {
        window.clearTimeout(finishTimeoutRef.current);
      }
    };
  }, [onComplete]);

  const finishIntro = () => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    if (finishTimeoutRef.current !== null) {
      window.clearTimeout(finishTimeoutRef.current);
    }
    finishTimeoutRef.current = window.setTimeout(() => {
      onComplete();
    }, 220);
  };

  const handleSkip = () => {
    finishIntro();
  };

  const handleKeypadClick = () => {
    finishIntro();
  };

  const showAmountScreen = step >= 2;

  return (
    <div className="intro-shell">
      <div className="intro-copy">
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="intro-copy__title"
          initial={{ opacity: 0, y: 18 }}
          transition={{ delay: 0.1, duration: 0.55 }}
        >
          붕어빵 사장님께
          <br />
          송금해야 하는 상황.
        </motion.h1>
      </div>

      <motion.div
        animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 220 }}
        className="phone-device phone-device--intro"
        initial={{ opacity: 0, y: 220 }}
        transition={{ duration: 0.8, ease: [0.2, 1, 0.36, 1] }}
      >
        <div className="phone-notch" />
        <div className="phone-screen phone-screen--intro">
          <div className="phone-topbar">
            <span className="story-badge">따끈붕어빵 미션</span>
            <span className="timer-badge">곧 시작</span>
          </div>

          <AnimatePresence mode="wait">
            {showAmountScreen ? (
              <motion.div
                animate="animate"
                className="intro-preview intro-preview--amount"
                exit="exit"
                initial="enter"
                key="amount"
                variants={screenVariants}
              >
                <div className="transfer-card transfer-card--intro">
                  <span className="transfer-card__label">받는 사람</span>
                  <strong className="transfer-card__recipient">
                    따끈붕어빵 사장님
                  </strong>
                  <p className="transfer-card__question">얼마나 옮길까요?</p>
                  <div className="transfer-card__amount">₩0</div>
                </div>

                <motion.div className="intro-keypad" transition={{ duration: 0.4 }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '←'].map(
                    (key) => (
                      <button
                        aria-label={`${key} 키`}
                        className="intro-keypad__key"
                        key={key}
                        onClick={handleKeypadClick}
                        type="button"
                      >
                        {key}
                      </button>
                    ),
                  )}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                animate="animate"
                className="intro-preview"
                exit="exit"
                initial="enter"
                key="recipient"
                variants={screenVariants}
              >
                <div className="intro-preview__contact">
                  <span className="transfer-card__label">받는 사람</span>
                  <strong className="transfer-card__recipient">
                    따끈붕어빵 사장님
                  </strong>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="intro-actions">
        <TextButton onClick={handleSkip} size="small" variant="clear">
          바로 시작
        </TextButton>
      </div>
    </div>
  );
}
