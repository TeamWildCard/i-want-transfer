import { useEffect, useRef, useState } from 'react';

import type { StageComponentProps } from '../types';
import { vibrate } from '../utils/game';

interface Account {
  accountSuffix: string;
  bank: string;
  colorIndex: number;
  id: string;
  isTarget: boolean;
  name: string;
}

const AVATAR_COLORS = [
  '#3182F6',
  '#EF4444',
  '#F97316',
  '#8B5CF6',
  '#10B981',
  '#EC4899',
  '#F59E0B',
  '#06B6D4',
  '#14B8A6',
  '#64748B',
  '#7C3AED',
  '#0EA5E9',
  '#84CC16',
  '#DB2777',
  '#EA580C',
  '#16A34A',
  '#0284C7',
  '#DC2626',
  '#9333EA',
  '#0F172A',
];

const TARGET_NAME = '따끈붕어빵 사장님';

// 이름의 차이를 한 글자씩만 바꿔 헷갈리게 구성
const BASE_ACCOUNTS: Omit<Account, 'id'>[] = [
  { name: TARGET_NAME,            bank: '토스뱅크',    accountSuffix: '4729', isTarget: true,  colorIndex: 0  },
  { name: '따끈붕여빵 사장님',    bank: '카카오뱅크',  accountSuffix: '2156', isTarget: false, colorIndex: 1  },
  { name: '따끈봉어빵 사장님',    bank: '국민은행',    accountSuffix: '8734', isTarget: false, colorIndex: 2  },
  { name: '따끈붕어빵 사쟝님',    bank: '신한은행',    accountSuffix: '3921', isTarget: false, colorIndex: 3  },
  { name: '따끈붕어빵 사잠님',    bank: '우리은행',    accountSuffix: '6478', isTarget: false, colorIndex: 4  },
  { name: '따뜻붕어빵 사장님',    bank: '하나은행',    accountSuffix: '1593', isTarget: false, colorIndex: 5  },
  { name: '따근붕어빵 사장님',    bank: 'NH농협',      accountSuffix: '7842', isTarget: false, colorIndex: 6  },
  { name: '따끈붕어방 사장님',    bank: '기업은행',    accountSuffix: '4267', isTarget: false, colorIndex: 7  },
  { name: '따끈붕어빵 사장닙',    bank: 'SC제일은행',  accountSuffix: '9315', isTarget: false, colorIndex: 8  },
  { name: '따끈붕어빵 사짱님',    bank: '부산은행',    accountSuffix: '5186', isTarget: false, colorIndex: 9  },
  { name: '따끈붕어뺑 사장님',    bank: '대구은행',    accountSuffix: '3742', isTarget: false, colorIndex: 10 },
  { name: '따끈붕어빵 샤장님',    bank: '케이뱅크',    accountSuffix: '8219', isTarget: false, colorIndex: 11 },
  { name: '따끈붕어빵 사장임',    bank: '카카오뱅크',  accountSuffix: '4853', isTarget: false, colorIndex: 12 },
  { name: '따끈붕어뽕 사장님',    bank: '신한은행',    accountSuffix: '7164', isTarget: false, colorIndex: 13 },
  { name: '따끈붕더빵 사장님',    bank: '우리은행',    accountSuffix: '2938', isTarget: false, colorIndex: 14 },
  { name: '따끈불어빵 사장님',    bank: '국민은행',    accountSuffix: '6531', isTarget: false, colorIndex: 15 },
  { name: '따끈붕어빵 사쟁님',    bank: '하나은행',    accountSuffix: '4827', isTarget: false, colorIndex: 16 },
  { name: '따끈붕어빵 사강님',    bank: 'NH농협',      accountSuffix: '3169', isTarget: false, colorIndex: 17 },
  { name: '따끈붕어빵 사장늠',    bank: '기업은행',    accountSuffix: '8546', isTarget: false, colorIndex: 18 },
  // 토스뱅크 사용하는 가짜 계좌 (더 혼란스럽게)
  { name: '따끈붕어쌍 사장님',    bank: '토스뱅크',    accountSuffix: '2391', isTarget: false, colorIndex: 19 },
];

function buildAccounts(): Account[] {
  const accounts: Account[] = BASE_ACCOUNTS.map((a, i) => ({ ...a, id: `account-${i}` }));
  for (let i = accounts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [accounts[i], accounts[j]] = [accounts[j], accounts[i]];
  }
  return accounts;
}

export function AccountSearchStage({
  active,
  config,
  onSuccess,
  onUpdateAmount,
}: StageComponentProps) {
  const [accounts, setAccounts] = useState<Account[]>(buildAccounts);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const successRef = useRef(false);
  const callbacksRef = useRef({ onSuccess, onUpdateAmount });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onUpdateAmount };
  }, [onSuccess, onUpdateAmount]);

  useEffect(() => {
    successRef.current = false;
    setAccounts(buildAccounts());
    setWrongId(null);
    setSuccessId(null);
    setWrongCount(0);
    callbacksRef.current.onUpdateAmount(config.startAmount);
  }, [config.id, config.startAmount]);

  const handleSelect = (account: Account) => {
    if (!active || successRef.current) return;

    if (account.isTarget) {
      successRef.current = true;
      setSuccessId(account.id);
      vibrate([30, 30, 80]);
      callbacksRef.current.onUpdateAmount(config.targetAmount);
      setTimeout(() => callbacksRef.current.onSuccess(), 600);
    } else {
      setWrongId(account.id);
      setWrongCount((prev) => prev + 1);
      vibrate(70);
      setTimeout(() => setWrongId(null), 420);
    }
  };

  return (
    <div className="stage-slot-game">
      <div className="account-search-stage">
        <div className="account-search-stage__header">
          <p className="account-search-stage__desc">정확한 수신인을 찾아 선택하세요</p>
          {wrongCount > 0 && (
            <span className="account-search-stage__error-badge">{wrongCount}번 틀렸어요</span>
          )}
        </div>

        <div className="account-search-stage__list">
          {accounts.map((account) => (
            <button
              className={[
                'account-row',
                wrongId === account.id ? 'account-row--wrong' : '',
                successId === account.id ? 'account-row--success' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={account.id}
              onClick={() => handleSelect(account)}
              type="button"
            >
              <div
                className="account-row__avatar"
                style={{ background: AVATAR_COLORS[account.colorIndex] }}
              >
                따
              </div>
              <div className="account-row__info">
                <span className="account-row__name">{account.name}</span>
                <span className="account-row__bank">
                  {account.bank} · ****{account.accountSuffix}
                </span>
              </div>
              {successId === account.id && (
                <span className="account-row__check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
