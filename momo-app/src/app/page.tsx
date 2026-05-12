"use client";

import { useState, useEffect, useRef } from "react";
import { TamagotchiFrame } from "@/components/TamagotchiFrame";
import { PixelCharacter, CHARACTERS, EvolutionStage } from "@/components/PixelCharacter";
import { RetroButton } from "@/components/RetroButton";
import { mockAi } from "@/lib/mockAi";
import { geminiAi } from "@/lib/geminiAi";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Book, User, History, Send, Clock, MoreHorizontal, Smile, Frown, Meh, Sparkles } from "lucide-react";

type Tab = "home" | "diary" | "character" | "memory";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [question, setQuestion] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [memories, setMemories] = useState<{text: string, mood: string, date: string, aiReply?: string}[]>([]);
  const [characterName, setCharacterName] = useState("모모");
  const [mood, setMood] = useState<"happy" | "neutral" | "sad">("neutral");
  const [pattern, setPattern] = useState<"dots" | "grid" | "stripes" | "none">("none");
  const [shellColor, setShellColor] = useState("#25262b");
  const [hue, setHue] = useState(0);
  const [accessory, setAccessory] = useState<"none" | "hat" | "glasses" | "ribbon">("none");
  
  // Diary Flow States
  const [diaryStep, setDiaryStep] = useState<"initial" | "question" | "reply">("initial");
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [memoryCandidate, setMemoryCandidate] = useState("");
  const [tempReply, setTempReply] = useState("");
  
  // Ask Mode States
  const [isAsking, setIsAsking] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [askReply, setAskReply] = useState("");
  const [safetyMessage, setSafetyMessage] = useState("");
  
  // Onboarding States
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<"landing" | "age" | "consent">("landing");
  const [ageMode, setAgeMode] = useState<"child" | "teen" | "adult">("adult");
  const [consents, setConsents] = useState({
    storage: false,
    ai: false,
    memory: false
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Growth State
  const [usageTime, setUsageTime] = useState(0);
  const [characterType, setCharacterType] = useState(0);
  const [prevStage, setPrevStage] = useState<EvolutionStage>("egg");
  const [isEvolving, setIsEvolving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getStage = (time: number): EvolutionStage => {
    if (time < 30) return "egg";
    if (time < 120) return "baby";
    if (time < 300) return "child";
    return "adult";
  };

  const stage = getStage(usageTime);

  useEffect(() => {
    if (stage !== prevStage) {
      setIsEvolving(true);
      setTimeout(() => setIsEvolving(false), 3000);
      setPrevStage(stage);
    }
  }, [stage, prevStage]);

  useEffect(() => {
    setQuestion(mockAi.getDailyQuestion());
    const savedMemories = localStorage.getItem("memories_v2");
    if (savedMemories) setMemories(JSON.parse(savedMemories));
    
    const savedSettings = localStorage.getItem("settings_v2");
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      if (s.name) setCharacterName(s.name);
      if (s.pattern) setPattern(s.pattern);
      if (s.shellColor) setShellColor(s.shellColor);
      if (s.hue !== undefined) setHue(s.hue);
      if (s.accessory) setAccessory(s.accessory);
      if (s.usageTime !== undefined) setUsageTime(s.usageTime);
      if (s.characterType !== undefined) setCharacterType(s.characterType);
      if (s.isOnboarded) setIsOnboarded(true);
      else setIsOnboarded(false);
      if (s.ageMode) setAgeMode(s.ageMode);
    } else {
      setCharacterType(Math.floor(Math.random() * 10));
      setIsOnboarded(false);
    }

    timerRef.current = setInterval(() => {
      setUsageTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("settings_v2", JSON.stringify({ 
      name: characterName, pattern, shellColor, hue, accessory, usageTime, characterType, isOnboarded, ageMode
    }));
  }, [characterName, pattern, shellColor, hue, accessory, usageTime, characterType, isOnboarded, ageMode]);

  useEffect(() => {
    localStorage.setItem("memories_v2", JSON.stringify(memories));
  }, [memories]);

  const handleDiaryNext = async () => {
    if (!diaryText) return;
    
    // Safety Check
    const safety = mockAi.checkSafety(diaryText);
    if (!safety.isSafe) {
      setSafetyMessage(safety.message || "");
      return;
    }
    setSafetyMessage("");

    setIsLoading(true);
    if (diaryStep === "initial") {
      const data = await geminiAi.getFollowUp(diaryText, characterName, ageMode);
      if (data && data.followUp) {
        setFollowUpQuestion(data.followUp);
      } else {
        // Fallback to mock
        setFollowUpQuestion(mockAi.getFollowUpQuestion(diaryText));
      }
      setDiaryStep("question");
    } else if (diaryStep === "question") {
      if (!followUpAnswer) {
        setIsLoading(false);
        return;
      }
      const data = await geminiAi.getFinalReply(diaryText, followUpAnswer, characterName, ageMode);
      if (data && data.reply) {
        setTempReply(data.reply);
        setMemoryCandidate(data.memory || mockAi.getMemoryCandidate(diaryText, followUpAnswer));
      } else {
        // Fallback to mock
        setTempReply(mockAi.getReply(diaryText, followUpAnswer));
        setMemoryCandidate(mockAi.getMemoryCandidate(diaryText, followUpAnswer));
      }
      setDiaryStep("reply");
    }
    setIsLoading(false);
  };

  const handleAsk = async () => {
    if (!askQuestion) return;
    
    // Safety Check
    const safety = mockAi.checkSafety(askQuestion);
    if (!safety.isSafe) {
      setSafetyMessage(safety.message || "");
      return;
    }
    setSafetyMessage("");

    setIsLoading(true);
    const context = memories.filter(m => m.isMemory).map(m => m.text);
    const data = await geminiAi.ask(askQuestion, context, characterName, ageMode);
    if (data && data.reply) {
      setAskReply(data.reply);
    } else {
      // Fallback to mock
      setAskReply(mockAi.askCharacter(askQuestion, context));
    }
    setIsLoading(false);
  };

  const handleFinalSave = (approveMemory: boolean) => {
    const newMemory = {
      text: `${diaryText}\n\nQ: ${followUpQuestion}\nA: ${followUpAnswer}`,
      mood: mood,
      date: new Date().toLocaleDateString(),
      aiReply: tempReply,
      isMemory: approveMemory
    };
    setMemories([newMemory, ...memories]);
    
    // Reset flow
    setDiaryText("");
    setFollowUpAnswer("");
    setDiaryStep("initial");
    setCurrentTab("home");
    setUsageTime(prev => prev + 120); 
    setMood("happy");
    setTimeout(() => setMood("neutral"), 5000);
  };

  const handleFinishOnboarding = () => {
    if (consents.storage && consents.ai) {
      setIsOnboarded(true);
    }
  };

  if (isOnboarded === null) return null; // Loading state

  if (!isOnboarded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-[#f8f9fa]">
        <TamagotchiFrame shellColor="#25262b">
          <div className="flex-1 flex flex-col bg-paper p-8 justify-center">
            <AnimatePresence mode="wait">
              {onboardingStep === "landing" && (
                <motion.div 
                  key="landing"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-[32px] bg-primary/10 flex items-center justify-center text-4xl shadow-sm border border-primary/20">
                    🐣
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-ink">만나서 반가워요!</h1>
                    <p className="text-[14px] text-muted leading-relaxed">
                      당신의 소중한 하루를 기억하고<br/>함께 성장하는 단짝 친구 '모모'입니다.
                    </p>
                  </div>
                  <RetroButton variant="primary" className="w-full h-12 mt-4" onClick={() => setOnboardingStep("age")}>
                    시작하기
                  </RetroButton>
                </motion.div>
              )}

              {onboardingStep === "age" && (
                <motion.div 
                  key="age"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-ink">연령대를 선택해주세요</h2>
                    <p className="text-[13px] text-muted">연령대에 맞춰 더 안전하고 다정하게 대화할게요.</p>
                  </div>
                  <div className="space-y-3">
                    {(["child", "teen", "adult"] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setAgeMode(mode)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                          ageMode === mode ? "border-primary bg-primary/5 shadow-sm" : "border-line bg-white"
                        }`}
                      >
                        <div className="font-bold text-[15px] mb-0.5">
                          {mode === "child" ? "어린이 (만 12세 이하)" : mode === "teen" ? "청소년 (만 18세 이하)" : "성인"}
                        </div>
                        <div className="text-[11px] text-muted">
                          {mode === "child" ? "보호자의 동의가 필요하며 가장 안전한 대화를 제공합니다." : 
                           mode === "teen" ? "안전 필터가 강화된 청소년 맞춤 대화를 제공합니다." : 
                           "자유롭고 감성적인 대화를 제공합니다."}
                        </div>
                      </button>
                    ))}
                  </div>
                  <RetroButton variant="primary" className="w-full h-12 mt-4" onClick={() => setOnboardingStep("consent")}>
                    다음 단계
                  </RetroButton>
                </motion.div>
              )}

              {onboardingStep === "consent" && (
                <motion.div 
                  key="consent"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-ink">서비스 이용 동의</h2>
                    <p className="text-[13px] text-muted">단짝 친구를 만나기 위해 꼭 필요한 과정이에요.</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { id: "storage", label: "일기 저장 및 관리 (필수)", desc: "당신의 소중한 일기를 기기에 안전하게 보관합니다." },
                      { id: "ai", label: "AI 답장 생성 (필수)", desc: "일기 내용을 바탕으로 단짝의 답장을 생성합니다." },
                      { id: "memory", label: "기억하기 기능 (선택)", desc: "과거의 대화를 기억하여 더 친근하게 대화합니다." },
                    ].map(item => (
                      <div key={item.id} className="flex gap-3 items-start cursor-pointer" onClick={() => setConsents({ ...consents, [item.id]: !consents[item.id as keyof typeof consents] })}>
                        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${consents[item.id as keyof typeof consents] ? "bg-primary border-primary" : "border-line bg-white"}`}>
                          {consents[item.id as keyof typeof consents] && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-[14px] font-bold text-ink">{item.label}</div>
                          <div className="text-[11px] text-muted">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <RetroButton 
                    variant="primary" 
                    className="w-full h-12 mt-4" 
                    disabled={!consents.storage || !consents.ai}
                    onClick={handleFinishOnboarding}
                  >
                    시작하기!
                  </RetroButton>
                  <button onClick={() => setOnboardingStep("age")} className="w-full text-[12px] text-muted underline">
                    이전 단계로
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TamagotchiFrame>
      </div>
    );
  }

  const currentChar = CHARACTERS[characterType % CHARACTERS.length];
  const patternClass = {
    dots: "pattern-dots",
    grid: "pattern-grid",
    stripes: "pattern-stripes",
    none: "",
  }[pattern];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 select-none">
      <TamagotchiFrame shellColor={shellColor}>
        <div className={`flex-1 flex flex-col relative h-full transition-all duration-500 bg-paper ${patternClass}`}>
          
          {/* Evolution Overlay */}
          <AnimatePresence>
            {isEvolving && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 4 }}
                  className="text-5xl mb-6"
                >
                  ✨💎✨
                </motion.div>
                <div className="font-pixel text-2xl text-primary animate-pulse mb-2">EVOLUTION!</div>
                <div className="font-vt323 text-xl text-muted uppercase">{stage} STAGE</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* App Header */}
          <div className="p-4 pt-6 flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] text-muted font-pixel mb-1">오늘의 교환일기</p>
              <h1 className="text-xl font-bold leading-tight">
                {stage === "egg" ? "부화를 기다려요" : `${characterName}가 기다리고 있어요`}
              </h1>
              <p className="text-[10px] text-muted mt-1">친구 페르소나 · 다정한 말투</p>
            </div>
            <button className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-muted hover:bg-surface transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar">
            <AnimatePresence mode="wait">
              {currentTab === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {!isAsking ? (
                    <>
                      {/* Room Card */}
                      <div className="relative h-60 w-full rounded-[24px] border border-line overflow-hidden shadow-sm bg-gradient-to-b from-[#fff8e8] to-[#f1e6d1]">
                        <div className="absolute inset-0 pattern-dots opacity-30" />
                        <div className="absolute top-4 right-6 w-16 h-14 border-2 border-black/10 rounded-lg bg-[#d8e6f7] shadow-inner" />
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/20 border-t border-black/5" />
                        
                        <div className="absolute inset-0 flex items-center justify-center pt-8">
                          <PixelCharacter 
                            stage={stage}
                            characterType={characterType}
                            mood={mood} 
                            size={140} 
                            hue={hue} 
                            accessory={accessory} 
                          />
                        </div>
                      </div>

                      {/* Question Card */}
                      <div className="app-card question-card">
                        <p className="text-[10px] text-muted font-pixel mb-1">단짝의 질문</p>
                        <h2 className="text-[15px] font-bold mb-1">
                          {stage === "egg" ? "알이 곧 깨어날 것 같아요..." : question}
                        </h2>
                        <p className="text-[12px] text-muted">한 줄만 적어도 괜찮아요. 답장은 편지처럼 남겨둘게요.</p>
                      </div>

                      <div className="space-y-3">
                        <RetroButton 
                          variant="primary" 
                          className="w-full h-12 text-[14px]" 
                          onClick={() => setCurrentTab("diary")} 
                          disabled={stage === "egg"}
                        >
                          오늘 일기 쓰기
                        </RetroButton>
                        <button 
                          onClick={() => setIsAsking(true)}
                          className="w-full h-11 rounded-xl border border-line bg-surface text-[13px] font-bold text-ink hover:bg-line/20 transition-colors"
                        >
                          {characterName}에게 묻기
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setIsAsking(false)} className="text-muted hover:text-ink">
                          ← 돌아가기
                        </button>
                        <h3 className="text-[14px] font-bold">{characterName}에게 물어보기</h3>
                      </div>
                      
                      <div className="app-card">
                        <textarea
                          value={askQuestion}
                          onChange={(e) => setAskQuestion(e.target.value)}
                          placeholder={`${characterName}에게 궁금한 게 있나요?`}
                          className="w-full h-24 p-3 rounded-xl border border-line bg-white text-[14px] font-medium leading-relaxed resize-none outline-none focus:border-primary/50 transition-colors text-ink"
                        />
                        <RetroButton variant="primary" className="w-full h-10 mt-3" onClick={handleAsk} disabled={isLoading}>
                          {isLoading ? "생각 중..." : "질문하기"}
                        </RetroButton>
                      </div>

                      {safetyMessage && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[12px] leading-relaxed">
                          ⚠️ {safetyMessage}
                        </div>
                      )}

                      {askReply && (
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-xl shadow-sm self-start mt-1">
                            {stage === "adult" ? currentChar.emoji : "🐣"}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-ink ml-1">{characterName}</span>
                            <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-white border border-line text-ink text-[14px] font-medium shadow-sm leading-relaxed">
                              {askReply}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

               {currentTab === "diary" && (
                <motion.div
                  key="diary"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-4"
                >
                  {diaryStep === "initial" && (
                    <>
                      <div className="app-card">
                        <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2">
                          <Sparkles size={14} className="text-primary" /> 오늘의 기분
                        </h3>
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                          {[
                            {id: "happy", label: "후련", icon: <Smile size={12}/>},
                            {id: "neutral", label: "보통", icon: <Meh size={12}/>},
                            {id: "sad", label: "피곤", icon: <Frown size={12}/>},
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setMood(m.id as any)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold transition-all ${
                                mood === m.id ? "bg-primary/10 text-primary border-primary/30" : "bg-white border-line text-muted"
                              }`}
                            >
                              {m.icon} {m.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={diaryText}
                          onChange={(e) => setDiaryText(e.target.value)}
                          placeholder="오늘 마음에 남은 순간을 적어보세요..."
                          className="w-full h-32 p-4 rounded-xl border border-line bg-white text-[14px] font-medium leading-relaxed resize-none outline-none focus:border-primary/50 transition-colors text-ink"
                        />
                      </div>
                      
                      <RetroButton variant="primary" className="w-full h-12" onClick={handleDiaryNext} disabled={isLoading}>
                        {isLoading ? "단짝이 생각 중..." : "계속하기"} <Send size={14} className="inline ml-2" />
                      </RetroButton>

                      {safetyMessage && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[12px] leading-relaxed mt-4">
                          ⚠️ {safetyMessage}
                        </div>
                      )}
                    </>
                  )}

                  {diaryStep === "question" && (
                    <>
                      <div className="app-card question-card">
                        <p className="text-[10px] text-muted font-pixel mb-1">단짝의 궁금증</p>
                        <h2 className="text-[15px] font-bold mb-3">{followUpQuestion}</h2>
                        <textarea
                          value={followUpAnswer}
                          onChange={(e) => setFollowUpAnswer(e.target.value)}
                          placeholder="여기에 답해줄래?"
                          className="w-full h-24 p-3 rounded-xl border border-line bg-white text-[14px] font-medium leading-relaxed resize-none outline-none focus:border-primary/50 transition-colors text-ink"
                        />
                      </div>
                      <RetroButton variant="primary" className="w-full h-12" onClick={handleDiaryNext} disabled={isLoading}>
                        {isLoading ? "단짝이 답장을 쓰는 중..." : "답변 완료"} <Send size={14} className="inline ml-2" />
                      </RetroButton>
                    </>
                  )}

                  {diaryStep === "reply" && (
                    <>
                      <div className="flex gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-xl shadow-sm">
                          {stage === "adult" ? currentChar.emoji : "🐣"}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-ink ml-1">{characterName}</span>
                          <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-white border border-line text-ink text-[14px] font-medium shadow-sm leading-relaxed">
                            {tempReply}
                          </div>
                        </div>
                      </div>

                      <div className="app-card bg-primary/5 border-primary/20">
                        <p className="text-[11px] font-bold text-primary mb-2">단짝이 이 내용을 기억해도 될까?</p>
                        <div className="bg-white/80 p-3 rounded-lg border border-primary/10 text-[13px] text-muted mb-3 italic">
                          "{memoryCandidate}"
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleFinalSave(true)}
                            className="flex-1 h-10 rounded-xl bg-primary text-white text-[13px] font-bold shadow-sm"
                          >
                            기억해줘!
                          </button>
                          <button 
                            onClick={() => handleFinalSave(false)}
                            className="flex-1 h-10 rounded-xl bg-white border border-line text-[13px] font-bold text-muted"
                          >
                            기억 안 해도 돼
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {currentTab === "memory" && (
                <motion.div
                  key="memory"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[12px] font-pixel text-muted uppercase tracking-wider">Conversation History</h3>
                    <span className="text-[10px] text-muted">{memories.length} sessions</span>
                  </div>
                  
                  {memories.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center opacity-30 space-y-2">
                      <History size={32} />
                      <p className="text-[13px] font-medium text-center">아직 기록된 추억이 없어요.<br/>오늘의 첫 일기를 남겨보세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {memories.map((m, i) => (
                        <div key={i} className="space-y-4">
                          <div className="flex justify-center">
                            <span className="px-3 py-1 rounded-full bg-surface text-[10px] text-muted font-bold border border-line">
                              {m.date}
                            </span>
                          </div>
                          
                          {/* User Message */}
                          <div className="flex flex-col items-end gap-1">
                            <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-none bg-primary text-white text-[14px] font-medium shadow-sm">
                              {m.text}
                            </div>
                            <div className="flex items-center gap-2 mr-1">
                              {m.isMemory && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">기억됨</span>}
                              <span className="text-[10px] text-muted">{m.mood === "happy" ? "😊 기분 최고" : m.mood === "sad" ? "😔 조금 지침" : "😐 평온함"}</span>
                            </div>
                          </div>

                          {/* AI Message */}
                          {m.aiReply && (
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-xl shadow-sm self-start mt-1">
                                {stage === "adult" ? currentChar.emoji : "🐣"}
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-ink ml-1">{characterName}</span>
                                <div className="max-w-[90%] px-4 py-2.5 rounded-2xl rounded-tl-none bg-white border border-line text-ink text-[14px] font-medium shadow-sm leading-relaxed">
                                  {m.aiReply}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {currentTab === "character" && (
                <motion.div
                  key="character"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="app-card pattern-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-line flex items-center justify-center text-2xl shadow-sm">
                        {stage === "adult" ? currentChar.emoji : "🐣"}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold">{characterName}</h3>
                        <p className="text-[10px] text-muted">Lv.{Math.floor(usageTime / 60) + 1} · {stage.toUpperCase()} STAGE</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-muted mb-2 block">단짝 이름</label>
                        <input 
                          type="text" 
                          value={characterName} 
                          onChange={(e) => setCharacterName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-line bg-white text-[13px] outline-none focus:border-primary/50"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[11px] font-bold text-muted mb-2 block">액세서리</label>
                        <div className="grid grid-cols-4 gap-2">
                          {(["none", "hat", "glasses", "ribbon"] as const).map(a => (
                            <button 
                              key={a}
                              onClick={() => setAccessory(a)}
                              className={`h-10 rounded-lg border text-sm flex items-center justify-center transition-all ${
                                accessory === a ? "bg-ink text-white border-ink" : "bg-white border-line text-muted"
                              }`}
                            >
                              {a === "none" ? "X" : a === "hat" ? "👒" : a === "glasses" ? "🕶️" : "🎀"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-muted mb-2 block">캐릭터 분위기 (HUE)</label>
                        <input 
                          type="range" min="0" max="360" value={hue} 
                          onChange={(e) => setHue(parseInt(e.target.value))}
                          className="w-full accent-primary h-1.5 rounded-lg appearance-none bg-line cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="app-card">
                    <label className="text-[11px] font-bold text-muted mb-3 block">단짝 친구 선택</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {CHARACTERS.map((char, index) => (
                        <button 
                          key={index}
                          onClick={() => setCharacterType(index)} 
                          className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${
                            characterType === index ? "border-primary bg-primary/5 scale-110 shadow-sm" : "border-line bg-white opacity-60 hover:opacity-100"
                          }`}
                          title={char.name}
                        >
                          {char.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="app-card">
                    <label className="text-[11px] font-bold text-muted mb-3 block">룸 테마 & 패턴</label>
                    <div className="flex gap-2">
                      {(["dots", "grid", "stripes", "none"] as const).map(p => (
                        <button 
                          key={p}
                          onClick={() => setPattern(p)} 
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            pattern === p ? "border-primary scale-110 shadow-sm" : "border-line opacity-60"
                          } ${p === "dots" ? "pattern-dots" : p === "grid" ? "pattern-grid" : p === "stripes" ? "pattern-stripes" : "bg-white"}`} 
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Navigation */}
          <nav className="absolute left-0 right-0 bottom-0 h-16 border-t border-line bg-white/90 backdrop-blur-md flex justify-around items-center px-4 z-20">
            <TabItem active={currentTab === "home"} onClick={() => setCurrentTab("home")} icon={<Book size={20} />} label="홈" />
            <TabItem active={currentTab === "diary"} onClick={() => setCurrentTab("diary")} icon={<Send size={20} />} label="기록" />
            <TabItem active={currentTab === "memory"} onClick={() => setCurrentTab("memory")} icon={<History size={20} />} label="기억" />
            <TabItem active={currentTab === "character"} onClick={() => setCurrentTab("character")} icon={<User size={20} />} label="단짝" />
          </nav>
        </div>
      </TamagotchiFrame>
    </div>
  );
}

function TabItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? "text-primary translate-y-[-2px]" : "text-muted hover:text-ink"}`}
    >
      <div className={`p-1.5 rounded-xl transition-colors ${active ? "bg-primary/10" : ""}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${active ? "opacity-100" : "opacity-60"}`}>{label}</span>
    </button>
  );
}
