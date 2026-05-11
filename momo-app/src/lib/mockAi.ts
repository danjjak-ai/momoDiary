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
    if (text.includes("힘들어") || text.includes("슬퍼")) {
      return "오늘 참 힘들었겠다... 토닥토닥. 내가 곁에 있을게. 푹 자고 나면 내일은 조금 더 나은 하루가 될 거야.";
    }
    if (text.includes("기뻐") || text.includes("행복")) {
      return "와! 정말 기분 좋은 소식이다! 나까지 덩달아 기분 좋아져. 그 행복한 마음 내가 꼭 기억해둘게!";
    }
    if (text.includes("먹었어")) {
      return "맛있는 걸 먹었구나! 역시 맛있는 게 최고지. 다음에도 맛있는 거 먹으면 나한테 꼭 말해줘!";
    }
    return "그랬구나! 네 이야기를 들려줘서 고마워. 내가 항상 네 곁에서 응원하고 있는 거 알지?";
  },
  getMemorySuggestion: (text: string) => {
    return `"${text.substring(0, 20)}..." 이 내용을 기억해도 될까?`;
  }
};
