"use client";

import { useState, useEffect, useRef } from "react";
import { TamagotchiFrame } from "@/components/TamagotchiFrame";
import { PixelCharacter, CHARACTERS, EvolutionStage } from "@/components/PixelCharacter";
import { RetroButton } from "@/components/RetroButton";
import { mockAi } from "@/lib/mockAi";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Book, User, History, Send, Clock, MoreHorizontal, Smile, Frown, Meh, Sparkles } from "lucide-react";

type Tab = "home" | "diary" | "character" | "memory";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [question, setQuestion] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [memories, setMemories] = useState<{text: string, mood: string, date: string}[]>([]);
  const [characterName, setCharacterName] = useState("모모");
  const [mood, setMood] = useState<"happy" | "neutral" | "sad">("neutral");
  const [pattern, setPattern] = useState<"dots" | "grid" | "stripes" | "none">("none");
  const [shellColor, setShellColor] = useState("#25262b");
  const [hue, setHue] = useState(0);
  const [accessory, setAccessory] = useState<"none" | "hat" | "glasses" | "ribbon">("none");
  
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
    } else {
      setCharacterType(Math.floor(Math.random() * 10));
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
      name: characterName, pattern, shellColor, hue, accessory, usageTime, characterType
    }));
  }, [characterName, pattern, shellColor, hue, accessory, usageTime, characterType]);

  useEffect(() => {
    localStorage.setItem("memories_v2", JSON.stringify(memories));
  }, [memories]);

  const handleSaveDiary = () => {
    if (!diaryText) return;
    const newMemory = {
      text: diaryText,
      mood: mood,
      date: new Date().toLocaleDateString()
    };
    setMemories([newMemory, ...memories]);
    setDiaryText("");
    setCurrentTab("home");
    setUsageTime(prev => prev + 60); 
    setMood("happy");
    setTimeout(() => setMood("neutral"), 5000);
  };

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
                    <button className="w-full h-11 rounded-xl border border-line bg-surface text-[13px] font-bold text-ink hover:bg-line/20 transition-colors">
                      {characterName}에게 묻기
                    </button>
                  </div>
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
                  <div className="app-card">
                    <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-primary" /> 빠른 기록
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
                  
                  <RetroButton variant="primary" className="w-full h-12" onClick={handleSaveDiary}>
                    저장하고 답장 받기 <Send size={14} className="inline ml-2" />
                  </RetroButton>
                </motion.div>
              )}

              {currentTab === "memory" && (
                <motion.div
                  key="memory"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[12px] font-pixel text-muted uppercase tracking-wider">Our Memories</h3>
                    <span className="text-[10px] text-muted">{memories.length} entries</span>
                  </div>
                  
                  {memories.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center opacity-30 space-y-2">
                      <History size={32} />
                      <p className="text-[13px] font-medium text-center">아직 기록된 추억이 없어요.<br/>오늘의 첫 일기를 남겨보세요.</p>
                    </div>
                  ) : (
                    memories.map((m, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="app-card memory-card"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] text-muted font-medium">{m.date}</p>
                          <span className="text-xs">{m.mood === "happy" ? "😊" : m.mood === "sad" ? "😔" : "😐"}</span>
                        </div>
                        <p className="text-[14px] leading-relaxed text-ink font-medium">{m.text}</p>
                      </motion.div>
                    ))
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
