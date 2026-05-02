"use client";

import { useState, useEffect } from "react";
import { TamagotchiFrame } from "@/components/TamagotchiFrame";
import { PixelCharacter } from "@/components/PixelCharacter";
import { RetroButton } from "@/components/RetroButton";
import { mockAi } from "@/lib/mockAi";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Book, User, History, Send } from "lucide-react";

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
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify({ 
      name: characterName, 
      pattern, 
      shellColor, 
      hue, 
      accessory 
    }));
  }, [characterName, pattern, shellColor, hue, accessory]);

  useEffect(() => {
    localStorage.setItem("memories", JSON.stringify(memories));
  }, [memories]);

  const handleSaveDiary = () => {
    if (!diaryText) return;
    setMood("happy");
    setMemories([diaryText, ...memories]);
    setDiaryText("");
    setCurrentTab("home");
    // After 3 seconds, reset mood
    setTimeout(() => setMood("neutral"), 3000);
  };

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
          {/* Status Bar */}
          <div className="flex justify-between items-center mb-2 px-2 z-10">
            <div className="flex gap-1">
              <Heart size={12} className="text-red-500 fill-current" />
              <Heart size={12} className="text-red-500 fill-current" />
              <Heart size={12} className="text-red-500" />
            </div>
            <div className="text-[10px] font-pixel opacity-70">21:00 PM</div>
          </div>

          <AnimatePresence mode="wait">
            {currentTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col items-center justify-between z-10"
              >
                <div className="text-center mt-2 w-full">
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg px-2 py-2 mb-2 border border-black/5">
                    <p className="text-[14px] leading-tight font-vt323">{characterName}: "{question}"</p>
                  </div>
                </div>
                
                <PixelCharacter mood={mood} size={140} hue={hue} accessory={accessory} />
                
                <div className="w-full flex flex-col gap-2 mb-2">
                  <RetroButton size="sm" onClick={() => setCurrentTab("diary")}>
                    오늘 일기 쓰기
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
                <div className="text-[12px] font-pixel mb-1">나의 오늘:</div>
                <textarea
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="한 줄만 적어도 괜찮아요..."
                  className="flex-1 w-full bg-white/60 backdrop-blur-sm border-2 border-lcd-ink p-2 text-[14px] font-vt323 resize-none outline-none focus:bg-white/90 transition-all"
                />
                <RetroButton variant="accent" size="sm" onClick={handleSaveDiary}>
                  저장하기 <Send size={10} className="inline ml-1" />
                </RetroButton>
                <button 
                  onClick={() => setCurrentTab("home")}
                  className="text-[10px] underline opacity-60 text-center py-1"
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
                <div className="text-[12px] font-pixel mb-2 border-b border-lcd-ink/20 pb-1">우리의 추억:</div>
                {memories.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center opacity-40 text-[12px] font-vt323">아직 기록이 없어요</div>
                ) : (
                  memories.map((m, i) => (
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="bg-white/40 backdrop-blur-sm border-l-4 border-lcd-ink p-2 text-[13px] leading-tight mb-2 font-vt323 shadow-sm"
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
                <div className="text-[12px] font-pixel mb-1">단짝 설정:</div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px]">이름</label>
                  <input 
                    type="text" 
                    value={characterName} 
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="bg-white/50 border-2 border-lcd-ink px-2 py-1 text-[12px] font-vt323 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px]">기기 색상</label>
                  <div className="flex gap-2">
                    {["#ff7eb9", "#00ffff", "#ffff00", "#7c6bae"].map(c => (
                      <button 
                        key={c}
                        onClick={() => setShellColor(c)} 
                        className={`w-6 h-6 rounded-full border-2 border-black/20 ${shellColor === c ? "ring-2 ring-black" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px]">캐릭터 색상</label>
                  <input 
                    type="range" min="0" max="360" value={hue} 
                    onChange={(e) => setHue(parseInt(e.target.value))}
                    className="w-full accent-black"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px]">액세서리</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["none", "hat", "glasses", "ribbon"] as const).map(a => (
                      <button 
                        key={a}
                        onClick={() => setAccessory(a)}
                        className={`text-[12px] p-1 border ${accessory === a ? "bg-black text-white" : "bg-white/50"}`}
                      >
                        {a === "none" ? "❌" : a === "hat" ? "👒" : a === "glasses" ? "🕶️" : "🎀"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px]">배경 패턴</label>
                  <div className="flex gap-2">
                    {(["dots", "grid", "stripes", "none"] as const).map(p => (
                      <button 
                        key={p}
                        onClick={() => setPattern(p)} 
                        className={`w-6 h-6 border-2 border-black ${pattern === p ? "bg-black" : "bg-white"} ${p === "dots" ? "pattern-dots" : p === "grid" ? "pattern-grid" : p === "stripes" ? "pattern-stripes" : ""}`} 
                      />
                    ))}
                  </div>
                </div>

                <RetroButton 
                  size="sm"
                  onClick={() => setCurrentTab("home")}
                  className="mt-2"
                >
                  완료
                </RetroButton>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Navigation Tabs */}
          <div className="mt-auto pt-2 border-t border-lcd-ink/10 flex justify-around">
            <TabIcon active={currentTab === "home"} onClick={() => setCurrentTab("home")} icon={<Book size={14} />} label="홈" />
            <TabIcon active={currentTab === "diary"} onClick={() => setCurrentTab("diary")} icon={<Send size={14} />} label="기록" />
            <TabIcon active={currentTab === "memory"} onClick={() => setCurrentTab("memory")} icon={<History size={14} />} label="기억" />
            <TabIcon active={currentTab === "character"} onClick={() => setCurrentTab("character")} icon={<User size={14} />} label="설정" />
          </div>
        </div>
      </TamagotchiFrame>
      
      <p className="font-vt323 text-white/40 text-center max-w-[300px]">
        1980년대 컬러 다마고치 감성의 <br/> 단짝 모모와 함께하는 교환일기
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
