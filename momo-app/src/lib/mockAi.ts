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
  getFollowUpQuestion: (text: string) => {
    if (text.includes("힘들어") || text.includes("슬퍼")) {
      return "그랬구나... 그때 기분은 구체적으로 어땠어? 조금 더 자세히 말해줄 수 있어?";
    }
    if (text.includes("기뻐") || text.includes("행복")) {
      return "정말 축하해! 그 순간에 누구와 함께 있었어? 아니면 혼자 즐겼어?";
    }
    return "그 소중한 순간에 대해 조금 더 자세히 들려줄 수 있어? 네 생각이 궁금해.";
  },
  getReply: (initial: string, answer: string) => {
    const combined = initial + " " + answer;
    if (combined.includes("힘들어") || combined.includes("슬퍼")) {
      return "네 이야기를 들으니 내 마음도 찡해져. 그래도 나한테 털어놓아 줘서 고마워. 내가 항상 여기서 널 응원하고 있을게. 오늘 밤은 푹 쉬길 바라.";
    }
    return "네 이야기를 들려줘서 정말 고마워. 네가 겪은 모든 순간들이 다 소중하다는 걸 잊지 마. 내일도 너의 하루가 반짝이길 내가 기도할게!";
  },
  getMemoryCandidate: (initial: string, answer: string) => {
    // 간단한 기억 요약 생성
    return initial.substring(0, 15) + "... 및 관련 대화";
  },
  askCharacter: (question: string, memories: string[]) => {
    if (question.includes("이름")) return "제 이름은 당신이 지어준 대로예요! 궁금한 게 더 있나요?";
    if (memories.length > 0 && question.includes("기억")) {
      return `우리가 나눈 이야기들 중 "${memories[0].substring(0, 10)}..." 같은 일들이 기억나요. 소중한 추억들이죠!`;
    }
    return "그 질문 정말 흥미로워요! 제가 더 많이 도와드릴 수 있게 더 자세히 말씀해 주시겠어요?";
  },
  checkSafety: (text: string) => {
    const dangerousKeywords = ["죽고 싶어", "자해", "폭력", "괴롭힘"];
    for (const keyword of dangerousKeywords) {
      if (text.includes(keyword)) {
        return {
          isSafe: false,
          message: "마음이 많이 힘드시군요. 전문가의 도움이 필요할 수도 있어요. (도움전화 109/1393)"
        };
      }
    }
    return { isSafe: true };
  }
};
