import { AccountSearchStage } from '../stages/AccountSearchStage';
import { BalanceBarStage } from '../stages/BalanceBarStage';
import { MovingKeypadStage } from '../stages/MovingKeypadStage';
import { PaintingStage } from '../stages/PaintingStage';
import { PinballStage } from '../stages/PinballStage';
import type { StageDefinition } from '../types';

export const STAGES: StageDefinition[] = [
  {
    id: 'balance-bar',
    chapter: 'CHAPTER 1',
    title: 'Balance Bar',
    objective: '좌우 높낮이를 맞춰 구슬을 중앙 존에 붙잡아 1,000원을 채우세요.',
    description:
      '중앙 피벗 위 구슬을 중심에 붙들면 금액이 차오릅니다. 벽과 중심 충돌 시 짧은 햅틱이 울려요.',
    hint: '화면 왼쪽/오른쪽을 누른 채 위아래로 드래그하면 각 사이드의 높이를 바꿀 수 있어요.',
    readyLabel: '균형을 맞췄어요. 이제 첫 송금을 눌러 다음 챕터로 이동하세요.',
    ctaLabel: '1,000원 송금하고 다음 챕터',
    startAmount: 0,
    targetAmount: 1000,
    durationSeconds: 30,
    Component: BalanceBarStage,
  },
  {
    id: 'painting',
    chapter: 'CHAPTER 2',
    title: 'Painting',
    objective: '숫자 3000을 95% 이상 칠해 2,000원까지 밀어 올리세요.',
    description:
      '투명한 숫자 영역을 손가락으로 채우면 채운 비율만큼 금액이 올라갑니다. 드로잉 중엔 미세 진동이 반복돼요.',
    hint: '캔버스를 그대로 쓱쓱 문질러 주세요. 빈 틈 없이 칠할수록 빠르게 다음 챕터가 열립니다.',
    readyLabel: '거의 다 칠했어요. 2,000원을 확보했으니 다음 난관으로 넘어갈 수 있어요.',
    ctaLabel: '2,000원 송금하고 다음 챕터',
    startAmount: 1000,
    targetAmount: 2000,
    durationSeconds: 30,
    Component: PaintingStage,
  },
  {
    id: 'pinball',
    chapter: 'CHAPTER 3',
    title: 'Pinball',
    objective: 'Launch 버튼을 눌렀다 떼어 구슬을 쏘고, 범퍼를 맞춰 정확히 3,000원을 완성하세요.',
    description:
      '하단 Launch 버튼을 길게 누를수록 발사 강도가 세집니다. 범퍼에 맞을 때마다 100원씩 올라갑니다.',
    hint: '강도를 조절해 좌우 각도를 바꿔보세요. 정확히 3,000원이 되는 순간 다음 챕터가 열립니다.',
    readyLabel: '정확히 3,000원 도달. 이제 마지막 관문이 남았어요.',
    ctaLabel: '3,000원 송금하고 마지막 챕터',
    startAmount: 2000,
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
    readyLabel: '1,000원 추가 입력 완료! 마지막 송금 버튼을 누르면 끝입니다.',
    ctaLabel: '4,000원 송금하고 마지막 챕터',
    startAmount: 3000,
    targetAmount: 4000,
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
    ctaLabel: '5,000원 최종 송금 완료',
    startAmount: 4000,
    targetAmount: 5000,
    durationSeconds: 30,
    Component: AccountSearchStage,
  },
];
