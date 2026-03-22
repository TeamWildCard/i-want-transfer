import { BalanceBarStage } from '../stages/BalanceBarStage';
import { PaintingStage } from '../stages/PaintingStage';
import { PinballStage } from '../stages/PinballStage';
import type { StageDefinition } from '../types';

export const STAGES: StageDefinition[] = [
  {
    id: 'arc-shot',
    chapter: 'CHAPTER 1',
    title: 'Arc Shot',
    objective: '공이 멈춘 칸의 금액이 3,000원이면 통과합니다.',
    description: '공을 눌러 방향과 세기를 잡고, 포물선으로 3,000원 칸에 꽂아 넣으세요.',
    hint: '멀리 보낼수록 오른쪽 칸으로 향합니다.',
    readyLabel: '3,000원 칸에 정확히 안착했습니다.',
    ctaLabel: '다음 스테이지',
    startAmount: 0,
    targetAmount: 3000,
    durationSeconds: 30,
    Component: BalanceBarStage,
  },
  {
    id: 'curling-shot',
    chapter: 'CHAPTER 2',
    title: 'Long Curl',
    objective: '길게 미는 힘을 맞춰 3,000원 존에서 멈추면 통과합니다.',
    description: '좁은 화면 안에서 긴 트랙을 미끄러지듯 이동해 3,000원 존에 정확히 정지하세요.',
    hint: '오래 누를수록 더 멀리 갑니다.',
    readyLabel: '긴 트랙 끝의 3,000원 존을 맞췄습니다.',
    ctaLabel: '마지막 스테이지',
    startAmount: 0,
    targetAmount: 3000,
    durationSeconds: 30,
    Component: PaintingStage,
  },
  {
    id: 'block-breaker',
    chapter: 'CHAPTER 3',
    title: 'Block Smash',
    objective: '패들로 공을 튕겨 블록을 깨며 총합 3,000원을 만들면 통과합니다.',
    description: '아래 판을 움직여 공을 되살리고, 300원 블록을 모두 깨 3,000원을 완성하세요.',
    hint: '패들 끝으로 받을수록 각도가 크게 꺾입니다.',
    readyLabel: '블록 총합 3,000원을 채워 송금 준비가 끝났습니다.',
    ctaLabel: '3,000원 송금 완료',
    startAmount: 0,
    targetAmount: 3000,
    durationSeconds: 30,
    Component: PinballStage,
  },
];
