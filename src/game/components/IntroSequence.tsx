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

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStep(1), 700),
      window.setTimeout(() => setStep(2), 1700),
      window.setTimeout(() => setStep(3), 2850),
      window.setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }, 4200),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [onComplete]);

  const handleSkip = () => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    onComplete();
  };

  const showAmountScreen = step >= 2;
  const showChapterCard = step >= 3;

  return (
    <div className="intro-shell">
      <div className="intro-copy">
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="intro-copy__eyebrow"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.5 }}
        >
          STORY MODE
        </motion.p>
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
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="intro-copy__body"
          initial={{ opacity: 0, y: 18 }}
          transition={{ delay: 0.2, duration: 0.55 }}
        >
          자, 이제 토스를 켜고 송금을 해볼까? 쉽다고 생각한 순간부터
          게임이 시작돼요.
        </motion.p>
      </div>

      <motion.div
        animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 220 }}
        className="phone-device phone-device--intro"
        initial={{ opacity: 0, y: 220 }}
        transition={{ duration: 0.8, ease: [0.2, 1, 0.36, 1] }}
      >
        <div className="phone-notch" />
        <div className="phone-screen phone-screen--intro">
          <div className="intro-preview__status">
            <span className="story-badge">따끈붕어빵 미션</span>
            <span className="timer-badge">곧 시작</span>
          </div>

          <AnimatePresence mode="wait">
            {showAmountScreen ? (
              <motion.div
                animate="animate"
                className="intro-preview"
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

                <motion.div
                  animate={{ opacity: showChapterCard ? 0 : 1 }}
                  className="intro-keypad"
                  transition={{ duration: 0.4 }}
                >
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '←'].map(
                    (key) => (
                      <div className="intro-keypad__key" key={key}>
                        {key}
                      </div>
                    ),
                  )}
                </motion.div>

                <motion.div
                  animate={{
                    opacity: showChapterCard ? 1 : 0,
                    y: showChapterCard ? 0 : 28,
                  }}
                  className="intro-chapter-card"
                  transition={{ duration: 0.45 }}
                >
                  <span className="intro-chapter-card__eyebrow">CHAPTER 1</span>
                  <strong>Balance Bar</strong>
                  <p>30초 안에 1,000원을 맞춰 송금 버튼을 열어보세요.</p>
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
                  <p className="intro-preview__helper">
                    이미 입력돼 있어요. 이제 금액만 넣으면 끝일 줄 알았죠.
                  </p>
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
