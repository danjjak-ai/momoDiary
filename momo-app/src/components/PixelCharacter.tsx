"use client";

import { motion } from "framer-motion";

export type EvolutionStage = "egg" | "baby" | "child" | "adult";

interface PixelCharacterProps {
  stage: EvolutionStage;
  characterType: number;
  mood?: "happy" | "neutral" | "sad";
  size?: number;
  hue?: number;
  accessory?: "none" | "hat" | "glasses" | "ribbon";
}

const CHARACTERS = [
  { name: "몽실이", emoji: "☁️", story: "폭신폭신한 구름처럼 다정한 친구예요." },
  { name: "뾰족이", emoji: "🌵", story: "까칠해 보이지만 속은 따뜻한 에너지 넘치는 친구!" },
  { name: "불꽃이", emoji: "🔥", story: "언제나 열정적이고 모험을 좋아하는 친구예요." },
  { name: "새싹이", emoji: "🌱", story: "자연을 사랑하고 평화를 추구하는 조용한 친구." },
  { name: "물방울", emoji: "💧", story: "유연하고 시원시원한 성격을 가진 친구예요." },
  { name: "별이", emoji: "🌟", story: "반짝반짝 빛나는 꿈을 가진 야심찬 친구!" },
  { name: "그림자", emoji: "👤", story: "말수는 적지만 언제나 곁을 지켜주는 신비로운 친구." },
  { name: "베리", emoji: "🍓", story: "상큼하고 발랄한 분위기 메이커 친구예요." },
  { name: "쇠돌이", emoji: "🤖", story: "튼튼하고 믿음직한, 의리가 넘치는 친구!" },
  { name: "유령이", emoji: "👻", story: "장난기 가득하고 자유로운 영혼의 친구." },
];

export const PixelCharacter = ({ 
  stage = "egg",
  characterType = 0,
  mood = "neutral", 
  size = 150, 
  hue = 0,
  accessory = "none" 
}: PixelCharacterProps) => {
  
  const getEmoji = () => {
    if (stage === "egg") return "🥚";
    if (stage === "baby") return "🐣";
    if (stage === "child") return "🐥";
    return CHARACTERS[characterType % CHARACTERS.length].emoji;
  };

  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: stage === "egg" ? 3 : 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          filter: `hue-rotate(${hue}deg) drop-shadow(0 4px 4px rgba(0,0,0,0.1))`,
          fontSize: size * 0.6,
          lineHeight: 1
        }}
      >
        <span className="pixelated-text drop-shadow-md">
          {getEmoji()}
        </span>
      </div>
      
      {/* Accessories - only show if child or adult */}
      {(stage === "child" || stage === "adult") && (
        <>
          {accessory === "hat" && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl drop-shadow-sm">👒</div>
          )}
          {accessory === "glasses" && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2 text-2xl drop-shadow-sm">🕶️</div>
          )}
          {accessory === "ribbon" && (
            <div className="absolute top-4 right-4 text-2xl drop-shadow-sm">🎀</div>
          )}
        </>
      )}
      
      {mood === "happy" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-4 -right-4 text-2xl"
        >
          ✨
        </motion.div>
      )}

      {/* Stage Badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] px-2 py-0.5 rounded-full font-pixel whitespace-nowrap">
        {stage.toUpperCase()}
      </div>
    </motion.div>
  );
};

export { CHARACTERS };
