import { Button, TextButton } from '@toss/tds-mobile';
import { motion } from 'framer-motion';

interface ResultOverlayProps {
  body: string;
  ctaLabel: string;
  title: string;
  onAction: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
}

export function ResultOverlay({
  body,
  ctaLabel,
  title,
  onAction,
  onSecondary,
  secondaryLabel,
}: ResultOverlayProps) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="result-overlay"
      initial={{ opacity: 0 }}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="result-card"
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        transition={{ duration: 0.28 }}
      >
        <span className="result-card__eyebrow">RESULT</span>
        <strong className="result-card__title">{title}</strong>
        <p className="result-card__body">{body}</p>
        <div className="result-card__actions">
          <Button display="full" onClick={onAction} size="xlarge">
            {ctaLabel}
          </Button>
          {onSecondary && secondaryLabel ? (
            <TextButton
              onClick={onSecondary}
              size="small"
              variant="clear"
            >
              {secondaryLabel}
            </TextButton>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
