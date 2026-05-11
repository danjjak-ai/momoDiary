"use client";

import { useState, useEffect, useRef } from "react";
import { TamagotchiFrame } from "@/components/TamagotchiFrame";
import { PixelCharacter, CHARACTERS, EvolutionStage } from "@/components/PixelCharacter";
import { RetroButton } from "@/components/RetroButton";
import { mockAi } from "@/lib/mockAi";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Book, User, History, Send, Clock, Info } from "lucide-react";

type Tab = "home" | "diary" | "character" | "memory";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [question, setQuestion] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [memories, setMemories] = useState<string[]>([]);
  const [characterName, setCharacterName] = useState("Momo");
  const [mood, setMood] = useState<"happy" | "neutral" | "sad">("neutral");
  const [pattern, setPattern] = useState<"dots" | "grid" | "stripes" | "none">("dots");
  const [shellColor, setShellColor] = useState("#ff7eb9");
  const [hue, setHue] = useState(0);
  const [accessory, setAccessory] = useState<"none" | "hat" | "glasses" | "ribbon">("none");
  
  // Growth State
  const [usageTime, setUsageTime] = useState(0);
  const [characterType, setCharacterType] = useState(0);
  const [prevStage, setPrevStage] = useState<EvolutionStage>("egg");
  const [isEvolving, setIsEvolving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Evolution thresholds (seconds)
  const getStage = (time: number): EvolutionStage => {
    if (time < 30) return "egg";      // 30s
    if (time < 120) return "baby";     // 2m
    if (time < 300) return "child";    // 5m
    return "adult";                         // 5m+
  };

  const stage = getStage(usageTime);

  // Check for evolution
  useEffect(() => {
    if (stage !== prevStage) {
      setIsEvolving(true);
      setTimeout(() => setIsEvolving(false), 2000);
      setPrevStage(stage);
    }
  }, [stage, prevStage]);

  // Load from local storage
  useEffect(() => {
    setQuestion(mockAi.getDailyQuestion());
    const savedMemories = localStorage.getItem("memories");
    if (savedMemories) setMemories(JSON.parse(savedMemories));
    
    const savedSettings = localStorage.getItem("settings");
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      if (s.name) setCharacterName(s.name);
      if (s.pattern) setPattern(s.pattern);
      if (s.shellColor) setShellColor(s.shellColor);
      if (s.hue !== undefined) setHue(s.hue);
      if (s.accessory) setAccessory(s.accessory);
      if (s.usageTime !== undefined) setUsageTime(s.usageTime);
      if (s.characterType !== undefined) setCharacterType(s.characterType);
      else setCharacterType(Math.floor(Math.random() * 10));
    } else {
      setCharacterType(Math.floor(Math.random() * 10));
    }

    // Start usage timer
    timerRef.current = setInterval(() => {
      setUsageTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify({ 
      name: characterName, 
      pattern, 
      shellColor, 
      hue, 
      accessory,
      usageTime,
      characterType
    }));
  }, [characterName, pattern, shellColor, hue, accessory, usageTime, characterType]);

  useEffect(() => {
    localStorage.setItem("memories", JSON.stringify(memories));
  }, [memories]);

  const handleSaveDiary = () => {
    if (!diaryText) return;
    setMood("happy");
    setMemories([diaryText, ...memories]);
    setDiaryText("");
    setCurrentTab("home");
    // Boost growth time on diary entry
    setUsageTime(prev => prev + 60); 
    setTimeout(() => setMood("neutral"), 3000);
  };

  const currentChar = CHARACTERS[characterType % CHARACTERS.length];

  const patternClass = {
    dots: "pattern-dots",
    grid: "pattern-grid",
    stripes: "pattern-stripes",
    none: "",
  }[pattern];

  return (
    <div className="flex flex-col items-center gap-8 py-10 select-none">
      <h1 className="font-pixel text-xl text-[#ff7eb9] shadow-sm tracking-tighter">단짝 MOMO DIARY</h1>
      
      <TamagotchiFrame shellColor={shellColor}>
        <div className={`flex-1 flex flex-col p-4 relative h-full transition-all duration-500 ${patternClass}`}>
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
                  className="text-4xl mb-4"
                >
                  ✨💎✨
                </motion.div>
                <div className="font-pixel text-xl text-black animate-pulse">EVOLUTION!</div>
                <div className="font-vt323 text-lg mt-2">{stage.toUpperCase()} STAGE</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Bar */}
          <div className="flex justify-between items-center mb-1 px-2 z-10">
            <div className="flex gap-1">
              <Heart size={10} className="text-red-500 fill-current" />
              <Heart size={10} className={`${usageTime > 300 ? "text-red-500 fill-current" : "text-red-500/20"}`} />
              <Heart size={10} className={`${usageTime > 900 ? "text-red-500 fill-current" : "text-red-500/20"}`} />
            </div>
            <div className="flex items-center gap-1 text-[8px] font-pixel opacity-70">
              <Clock size={8} /> {Math.floor(usageTime / 60)}m {usageTime % 60}s
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 z-10"
              >
                <div className="text-center w-full">
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg px-2 py-2 border border-black/5">
                    <p className="text-[14px] leading-tight font-vt323 min-h-[1.5em]">
                      {stage === "egg" ? "..." : `${characterName}: "${question}"`}
                    </p>
                  </div>
                </div>
                
                <PixelCharacter 
                  stage={stage}
                  characterType={characterType}
                  mood={mood} 
                  size={120} 
                  hue={hue} 
                  accessory={accessory} 
                />
                
                <div className="w-full flex flex-col gap-2">
                  <RetroButton size="sm" onClick={() => setCurrentTab("diary")} disabled={stage === "egg"}>
                    {stage === "egg" ? "알이 부화하길 기다려요" : "오늘 일기 쓰기"}
                  </RetroButton>
                </div>
              </motion.div>
            )}

            {currentTab === "diary" && (
              <motion.div
                key="diary"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col gap-2 z-10"
              >
                <div className="text-[12px] font-pixel mb-1 text-lcd-ink">나의 오늘:</div>
                <textarea
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="한 줄만 적어도 괜찮아요..."
                  className="flex-1 w-full bg-white/60 backdrop-blur-sm border-2 border-lcd-ink p-2 text-[14px] font-vt323 resize-none outline-none focus:bg-white/90 transition-all text-lcd-ink"
                />
                <RetroButton variant="accent" size="sm" onClick={handleSaveDiary}>
                  저장하기 <Send size={10} className="inline ml-1" />
                </RetroButton>
                <button 
                  onClick={() => setCurrentTab("home")}
                  className="text-[10px] underline opacity-60 text-center py-1 text-lcd-ink"
                >
                  돌아가기
                </button>
              </motion.div>
            )}

            {currentTab === "memory" && (
              <motion.div
                key="memory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 z-10"
              >
                <div className="text-[12px] font-pixel mb-2 border-b border-lcd-ink/20 pb-1 text-lcd-ink">우리의 추억:</div>
                {memories.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center opacity-40 text-[12px] font-vt323 text-lcd-ink">아직 기록이 없어요</div>
                ) : (
                  memories.map((m, i) => (
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="bg-white/40 backdrop-blur-sm border-l-4 border-lcd-ink p-2 text-[13px] leading-tight mb-2 font-vt323 shadow-sm text-lcd-ink"
                    >
                      {m}
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
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col gap-2 z-10 overflow-y-auto pr-1"
              >
                <div className="text-[12px] font-pixel mb-1 text-lcd-ink flex items-center gap-1">
                  <User size={12} /> 캐릭터 정보:
                </div>
                
                <div className="bg-white/40 p-2 rounded border border-lcd-ink/10 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{stage === "adult" ? currentChar.emoji : stage === "egg" ? "🥚" : stage === "baby" ? "🐣" : "🐥"}</span>
                    <div>
                      <div className="text-[10px] font-pixel text-lcd-ink">
                        {characterName} 
                        <span className="text-[8px] opacity-60 ml-1">({stage === "adult" ? currentChar.name : stage === "egg" ? "알" : stage === "baby" ? "아기" : "어린이"})</span>
                      </div>
                      <div className="text-[8px] opacity-60">Lv.{Math.floor(usageTime / 60) + 1} • {Math.floor(usageTime / 60)}분 경과</div>
                    </div>
                  </div>
                  <p className="text-[10px] leading-tight font-vt323 text-lcd-ink opacity-80">
                    {stage === "adult" ? currentChar.story : "정성스럽게 일기를 쓰고 시간을 보내면 더 멋진 모습으로 진화해요!"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-pixel">이름</label>
                    <input 
                      type="text" 
                      value={characterName} 
                      onChange={(e) => setCharacterName(e.target.value)}
                      className="bg-white/50 border-2 border-lcd-ink px-1 py-0.5 text-[12px] font-vt323 outline-none w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-pixel">액세서리</label>
                    <div className="grid grid-cols-4 gap-0.5">
                      {(["none", "hat", "glasses", "ribbon"] as const).map(a => (
                        <button 
                          key={a}
                          onClick={() => setAccessory(a)}
                          className={`text-[10px] p-0.5 border ${accessory === a ? "bg-black text-white" : "bg-white/50 border-lcd-ink/20"}`}
                        >
                          {a === "none" ? "X" : a === "hat" ? "👒" : a === "glasses" ? "🕶️" : "🎀"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-pixel">캐릭터 색상 (HUE)</label>
                  <input 
                    type="range" min="0" max="360" value={hue} 
                    onChange={(e) => setHue(parseInt(e.target.value))}
                    className="w-full accent-lcd-ink h-2"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-pixel">배경 패턴 & 기기 색상</label>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {(["dots", "grid", "stripes", "none"] as const).map(p => (
                        <button 
                          key={p}
                          onClick={() => setPattern(p)} 
                          className={`w-4 h-4 border border-black ${pattern === p ? "ring-1 ring-black" : "opacity-50"} ${p === "dots" ? "pattern-dots" : p === "grid" ? "pattern-grid" : p === "stripes" ? "pattern-stripes" : "bg-white"}`} 
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {["#ff7eb9", "#00ffff", "#ffff00", "#7c6bae"].map(c => (
                        <button 
                          key={c}
                          onClick={() => setShellColor(c)} 
                          className={`w-4 h-4 rounded-full border border-black/20 ${shellColor === c ? "ring-1 ring-black" : ""}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <RetroButton 
                  size="sm"
                  onClick={() => setCurrentTab("home")}
                  className="mt-1"
                >
                  확인
                </RetroButton>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Navigation Tabs */}
          <div className="mt-auto pt-2 border-t border-lcd-ink/10 flex justify-around">
            <TabIcon active={currentTab === "home"} onClick={() => setCurrentTab("home")} icon={<Book size={14} />} label="홈" />
            <TabIcon active={currentTab === "diary"} onClick={() => setCurrentTab("diary")} icon={<Send size={14} />} label="기록" />
            <TabIcon active={currentTab === "memory"} onClick={() => setCurrentTab("memory")} icon={<History size={14} />} label="기억" />
            <TabIcon active={currentTab === "character"} onClick={() => setCurrentTab("character")} icon={<User size={14} />} label="성장" />
          </div>
        </div>
      </TamagotchiFrame>
      
      <p className="font-vt323 text-white/40 text-center max-w-[300px]">
        1980년대 컬러 다마고치 감성의 <br/> 단짝 {characterName}와(과) 함께하는 교환일기
      </p>
    </div>
  );
}

function TabIcon({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 transition-all ${active ? "scale-110 text-black" : "opacity-40 grayscale"}`}
    >
      <div className={`${active ? "bg-white/80 p-1 rounded-md shadow-sm" : ""}`}>
        {icon}
      </div>
      <span className="text-[8px] font-pixel">{label}</span>
    </button>
  );
}
