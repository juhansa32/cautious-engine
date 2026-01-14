export const ORDER = [
  'LOBBY',
  'PUZZLE_PASSWORD',
  'PIN1',
  'END'
];

export const STORY = {
  LOBBY: {
    title: '접속 대기',
    text: [
      '조수 접속을 확인 중입니다.',
      '이번 퇴마는 기록 회수를 목적으로 합니다.',
      '단장(휴복): “퍼즐은 내가 푼다. 조언은 자유.”'
    ]
  },

  PUZZLE_PASSWORD: {
    title: '봉인 장치 – 비밀번호',
    text: [
      '봉인된 장치가 전력을 회복하며 작동을 시작한다.',
      '숫자 다이얼 4개가 나타났다.',
      '단장만이 직접 조작할 수 있다.'
    ],
    puzzle: 'PASSWORD'
  },

  PIN1: {
    title: '봉인문 – 첫 번째 판단',
    text: [
      '비밀번호가 맞아 봉인이 풀렸다.',
      '이제 마지막 선택만 남았다.'
    ],
    allowVote: true,
    voteOptions: {
      A: '문을 연다',
      B: '기록을 먼저 확인한다',
      C: '퇴로를 확보한다'
    }
  },

  END: {
    title: '기록 종료',
    text: [
      '임무 종료.',
      '체험판 종료.'
    ]
  }
};
