export const ORDER = [
  'LOBBY','ACT1','PIN1','ARCHIVE','PIN2','PIN3','RITUAL','END'
];

export const STORY = {
  LOBBY: {
    title: '접속 대기',
    text: [
      '조수 접속을 확인 중입니다.',
      '이번 퇴마는 기록 회수를 목적으로 합니다.'
    ],
    chant: '기록은 숨을 죽이고, 이름 없는 것은 이름을 얻는다.'
  },

  ACT1: {
    title: '지하 예배당',
    text: [
      '낡은 예배당이 모습을 드러낸다.',
      '봉인이 세 겹으로 잠겨 있다.'
    ]
  },

  PIN1: {
    title: '첫 번째 봉인',
    text: [
      'A / B / C 중 하나를 선택하라.'
    ],
    choices: ['A','B','C']
  },

  ARCHIVE: {
    title: '기록실',
    text: [
      '기록이 뒤틀려 있다.'
    ],
    chant: '거짓은 위로 흐르고, 진실은 아래로 잠긴다.'
  },

  PIN2: {
    title: '두 번째 봉인',
    text: ['다시 선택하라.'],
    choices: ['A','B','C']
  },

  PIN3: {
    title: '마지막 봉인',
    text: ['이 선택이 끝을 부른다.'],
    choices: ['A','B','C'],
    chant: '봉인은 말이 아니라 의지로 고정된다—지금, 접속을 끊는다.'
  },

  RITUAL: {
    title: '퇴마 의식',
    text: [
      '단장이 퇴마 문구를 외친다.'
    ]
  },

  END: {
    title: '기록 종료',
    text: ['임무 종료.']
  }
};
