export const geminiAi = {
  getFollowUp: async (text: string, characterName: string, ageMode: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'diary', initialText: text, characterName, ageMode })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  getFinalReply: async (initial: string, answer: string, characterName: string, ageMode: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'diary', initialText: initial, followUpAnswer: answer, characterName, ageMode })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  ask: async (question: string, memories: string[], characterName: string, ageMode: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ask', initialText: question, memories, characterName, ageMode })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  }
};
