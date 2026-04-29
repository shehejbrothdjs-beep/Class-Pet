import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student, updateStudentInteraction } from '../lib/db';
import { generatePetReply } from '../lib/ai';
import { MessageCircle, Zap } from 'lucide-react';
import clsx from 'clsx';

export interface PetCardProps {
  key?: React.Key;
  student: Student;
  delay?: number;
  hideChat?: boolean;
}

export default function PetCard({ student, delay = 0, hideChat = false }: PetCardProps) {
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Calculate Mood: 100 - (hours since last interaction * 2). Minimum 10
  const hoursSince = (Date.now() - student.lastInteractionTime) / (1000 * 60 * 60);
  const mood = Math.max(10, Math.min(100, 100 - hoursSince * 5));
  
  const handleInteract = async () => {
    if (hideChat) return;
    
    // Opt update locally
    updateStudentInteraction(student.id);

    setShowChat(true);
    setIsTyping(true);
    const greeting = ["摸摸头～", "你好呀！", "今天过得好吗？", "有什么开心的事？", "哇哦！"][Math.floor(Math.random() * 5)];
    const reply = await generatePetReply(student.name, greeting, student.exp);
    setChatMessage(reply);
    setIsTyping(false);

    setTimeout(() => {
      setShowChat(false);
    }, 5000);
  };

  const getPetImage = () => {
    // Basic representation logic for egg vs hatched, and colors.
    // In a real app we'd use nice SVG assets. Here we use an emoji or colored div
    let face = "🥚";
    if (student.level >= 2) face = "🐣";
    if (student.level >= 3) face = "🐥";
    if (student.level >= 5) face = "🐉";
    
    const bgColorMap: Record<string, string> = {
      'red': 'bg-red-400',
      'blue': 'bg-blue-400',
      'green': 'bg-green-400',
      'purple': 'bg-purple-400',
      'yellow': 'bg-yellow-400',
    };
    
    return {
      face,
      bg: bgColorMap[student.eggColor] || 'bg-gray-400'
    };
  };

  const pet = getPetImage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-[2rem] p-4 shadow-sm border-[3px] border-neutral-100 flex flex-col items-center relative"
    >
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 bg-white border-2 border-neutral-200 rounded-2xl p-3 z-10 shadow-lg text-sm font-bold text-neutral-700"
          >
            {isTyping ? <div className="flex gap-1 justify-center"><div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce delay-200"></div></div> : chatMessage}
            {/* arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-neutral-200 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex justify-between items-center mb-2 px-1">
        <span className="font-black text-neutral-800 truncate block max-w-[80px]">{student.name}</span>
        <span className="bg-[var(--color-duo-yellow)] text-white text-xs font-black px-2 py-1 rounded-lg">
          Lv.{student.level}
        </span>
      </div>
      
      <div 
        onClick={handleInteract}
        className={clsx(
          "w-24 h-24 rounded-[2rem] mb-4 flex items-center justify-center text-4xl shadow-inner cursor-pointer transition-transform cursor-pointer relative",
          pet.bg,
          mood < 30 ? "grayscale opacity-80" : ""
        )}
      >
        <motion.div 
          animate={mood < 30 ? { x: [-2, 2, -2, 2, 0] } : { y: [0, -5, 0] }}
          transition={mood < 30 ? { repeat: Infinity, duration: 2 } : { repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          {pet.face}
        </motion.div>
        
        {/* Effects layer */}
        {student.effects.includes('Crown') && <div className="absolute -top-4 text-2xl">👑</div>}
        {student.effects.includes('Wings') && <div className="absolute -left-4 -right-4 text-3xl flex justify-between"><span>✨</span><span>✨</span></div>}
        {student.effects.includes('Star') && <div className="absolute bottom-0 right-0 text-xl">⭐</div>}
      </div>

      <div className="w-full space-y-2">
        <div>
          <div className="flex justify-between text-[10px] font-black text-neutral-400 mb-1">
            <span>EXP ({student.exp})</span>
          </div>
          <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[var(--color-duo-blue)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (student.exp % 50) / 50 * 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-black text-neutral-400 mb-1">
            <span>心情栏 (Mood)</span>
          </div>
          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
            <motion.div 
              className={clsx("h-full", mood > 50 ? "bg-[var(--color-duo-green)]" : "bg-[var(--color-duo-red)]")}
              initial={{ width: 0 }}
              animate={{ width: `${mood}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
