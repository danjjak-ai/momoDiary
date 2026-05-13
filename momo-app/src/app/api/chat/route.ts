import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      type, // 'diary' | 'ask'
      initialText, 
      followUpAnswer, 
      characterName, 
      ageMode,
      memories 
    } = body;

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const systemPrompt = `
      당신은 다정한 픽셀 캐릭터 '${characterName}'입니다.
      사용자의 연령대는 '${ageMode}'입니다. 연령대에 맞는 적절하고 안전한 어휘를 사용하세요.
      항상 다음 JSON 형식으로만 응답하세요:
      {
        "reply": "사용자에게 주는 따뜻한 답장 (2-3문장)",
        "followUp": "사용자에게 던질 추가 질문 (diary 단계에서만 필요)",
        "memory": "이 대화에서 기억할만한 핵심 요약 (10자 내외)"
      }
    `;

    let userPrompt = "";
    if (type === 'diary') {
      userPrompt = followUpAnswer 
        ? `사용자의 일기: "${initialText}"\n사용자의 추가 답변: "${followUpAnswer}"\n이 정보를 합쳐서 최종 답장과 기억할 점을 알려줘.`
        : `사용자의 일기: "${initialText}"\n이 일기에 대해 공감해주고, 더 자세히 알고 싶은 점을 질문으로 던져줘.`;
    } else {
      userPrompt = `사용자의 질문: "${initialText}"\n과거 기억: ${JSON.stringify(memories)}\n이 질문에 대해 친절하게 답해줘.`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
        ],
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Error Response:', data);
      return NextResponse.json({ error: data.error?.message || 'Gemini API Error' }, { status: response.status });
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error('No candidates in Gemini response:', data);
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const text = data.candidates[0].content.parts[0].text;
    try {
      return NextResponse.json(JSON.parse(text));
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', text);
      // If it's not valid JSON, try to return it as a simple reply
      return NextResponse.json({ reply: text, followUp: "", memory: "" });
    }

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
