import { AccountSearchStage } from '../stages/AccountSearchStage';
import { BalanceBarStage } from '../stages/BalanceBarStage';
import { MovingKeypadStage } from '../stages/MovingKeypadStage';
import { PaintingStage } from '../stages/PaintingStage';
import { PinballStage } from '../stages/PinballStage';
import type { StageDefinition } from '../types';

export const STAGES: StageDefinition[] = [
  {
    id: 'arc-shot',
    chapter: 'CHAPTER 1',
    title: 'Arc Shot',
    objective: '미사일이 3번 튕긴 뒤 멈춘 지점이 3,000원 범위면 통과합니다.',
    description: '미사일 발사를 길게 눌러 세기를 조절하고, 포물선 바운스로 도착 지점을 맞추세요.',
    hint: '세 번째 바운스의 정지 위치가 판정 지점입니다.',
    readyLabel: '세 번째 바운스가 3,000원 범위에 정확히 들어왔습니다.',
    ctaLabel: '다음 스테이지',
    startAmount: 0,
    targetAmount: 3000,
    maxAmount: 5000,
    durationSeconds: 30,
    Component: BalanceBarStage,
  },
  {
    id: 'curling-shot',
    chapter: 'CHAPTER 2',
    title: 'Long Curl',
    objective: '컬링 스톤을 밀어 3,000원 하우스 중심에 멈추면 통과합니다.',
    description: '스톤 밀기 버튼을 길게 눌러 힘을 모으고, 타이밍에 따라 컬 방향을 조절하세요.',
    hint: '너무 세게 밀면 하우스를 지나칩니다.',
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
  {
    id: 'moving-keypad',
    chapter: 'CHAPTER 4',
    title: 'Moving Keypad',
    objective: '1,000원을 입력해야 하는데 키패드 버튼이 자꾸 위치를 바꾸네요.',
    description:
      '키패드 버튼이 1.5초마다 랜덤하게 섞입니다. 버튼이 이동하기 전에 빠르게 눌러야 해요.',
    hint: '잘못 눌렀으면 ⌫ 로 지울 수 있어요. 버튼 위치를 미리 파악한 뒤 빠르게 눌러보세요.',
    readyLabel: '3,000원 입력 완료! 마지막 송금 버튼을 누르면 끝입니다.',
    ctaLabel: '3,000원 송금하고 마지막 챕터',
    startAmount: 0,
    targetAmount: 3000,
    durationSeconds: 30,
    Component: MovingKeypadStage,
  },
  {
    id: 'account-search',
    chapter: 'CHAPTER 5',
    title: 'Account Search',
    objective: '비슷한 이름의 계좌 20개 중 정확히 "따끈붕어빵 사장님"을 찾아야 해요.',
    description:
      '글자 하나씩 다른 가짜 계좌들이 섞여 있어요. 꼼꼼히 읽고 올바른 수신인을 선택하세요.',
    hint: '이름만 보지 말고 은행 이름과 계좌 끝 번호도 참고해보세요. 토스뱅크 ****4729가 정답이에요.',
    readyLabel: '올바른 수신인을 찾았어요! 이제 최종 송금 버튼을 누르세요.',
    ctaLabel: '3,000원 최종 송금 완료',
    startAmount: 0,
    targetAmount: 3000,
    durationSeconds: 30,
    Component: AccountSearchStage,
  },
];
