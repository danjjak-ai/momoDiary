export const mockAi = {
  getDailyQuestion: () => {
    const questions = [
      "오늘 마음에 남은 순간은?",
      "지금 기분은 어때?",
      "맛있는 거 먹었어?",
      "오늘 가장 힘들었던 일은?",
      "내일은 뭘 하고 싶어?",
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  },
  getReply: (text: string) => {
    return "그랬구나! 정말 대단해. 내가 항상 응원하고 있는 거 알지? 내일도 같이 일기 쓰자!";
  },
  getMemorySuggestion: (text: string) => {
    return `"${text.substring(0, 20)}..." 이 내용을 기억해도 될까?`;
  }
};
