import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Trophy, Rocket, Star, Zap, Crown } from "lucide-react";

const ADS = [
  {
    id: 1,
    title: "Campus Tech Fest 2026",
    subtitle: "Register now for exciting workshops & competitions",
    emoji: "🎓",
    gradient: "from-violet-600 via-purple-600 to-indigo-600",
    pattern: "🌟",
    icon: <Sparkles className="h-8 w-8" />,
  },
  {
    id: 2,
    title: "Inter-College Sports Meet",
    subtitle: "Showcase your talent — registrations open soon",
    emoji: "🏆",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    pattern: "⚡",
    icon: <Trophy className="h-8 w-8" />,
  },
  {
    id: 3,
    title: "Hackathon Season",
    subtitle: "Build, innovate, and win exciting prizes",
    emoji: "💡",
    gradient: "from-cyan-500 via-blue-500 to-violet-500",
    pattern: "🚀",
    icon: <Rocket className="h-8 w-8" />,
  },
  {
    id: 4,
    title: "Innovation Challenge",
    subtitle: "Show your creativity and win big prizes",
    emoji: "🌟",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    pattern: "💎",
    icon: <Star className="h-8 w-8" />,
  },
  {
    id: 5,
    title: "Code Championship",
    subtitle: "Compete with the best coders in college",
    emoji: "⚡",
    gradient: "from-pink-500 via-rose-500 to-amber-500",
    pattern: "🔥",
    icon: <Zap className="h-8 w-8" />,
  },
  {
    id: 6,
    title: "Grand Finale Event",
    subtitle: "Don't miss the biggest event of the year",
    emoji: "👑",
    gradient: "from-violet-500 via-fuchsia-500 to-pink-500",
    pattern: "✨",
    icon: <Crown className="h-8 w-8" />,
  },
];

const AdCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ADS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mb-6 mt-2 overflow-hidden rounded-2xl group h-[180px] flex-shrink-0 mx-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={ADS[current].id}
          initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 1.05, rotateX: -10 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`absolute inset-0 bg-gradient-to-br ${ADS[current].gradient} p-6 flex flex-col justify-center overflow-hidden`}
        >
          {/* Animated background patterns */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.15, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute -top-10 -right-10 text-[120px] opacity-20"
            >
              {ADS[current].pattern}
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -bottom-10 -left-10 text-[100px] opacity-20"
            >
              {ADS[current].pattern}
            </motion.div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex-shrink-0 h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
            >
              {ADS[current].icon}
            </motion.div>
            <div className="flex-1">
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white drop-shadow-lg"
              >
                {ADS[current].title}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 mt-2 text-base font-medium drop-shadow"
              >
                {ADS[current].subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full cursor-pointer hover:bg-white/30 transition-colors"
              >
                <span className="text-sm font-semibold text-white">Learn More</span>
                <ChevronRight className="h-4 w-4 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Floating emoji */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: 50 }}
            animate={{ opacity: 0.3, x: 0, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute top-4 right-8 text-6xl"
          >
            {ADS[current].emoji}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Dots with enhanced styling */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {ADS.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current 
                ? "w-8 bg-white shadow-lg shadow-white/50" 
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Nav arrows with enhanced styling */}
      <motion.button
        onClick={() => setCurrent((prev) => (prev - 1 + ADS.length) % ADS.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft className="h-5 w-5" />
      </motion.button>
      <motion.button
        onClick={() => setCurrent((prev) => (prev + 1) % ADS.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight className="h-5 w-5" />
      </motion.button>
    </div>
  );
};

export default AdCarousel;
