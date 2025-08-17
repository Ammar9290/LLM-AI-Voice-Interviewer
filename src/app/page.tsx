"use client";

import { motion } from "framer-motion";
import VoiceInterview from "@/app/components/VoiceInterview";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Moving Gradient Background */}
      <motion.div
        className="absolute inset-0 -z-20 bg-gradient-to-r from-purple-900 via-black to-cyan-900"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundSize: "200% 200%",
        }}
      />

      {/* Floating Orbs & Stars */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Purple Orb */}
        <motion.div
          animate={{ x: [0, 50, -50, 0], y: [0, -30, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl absolute top-[-200px] left-[-200px]"
        />
        {/* Cyan Orb */}
        <motion.div
          animate={{ x: [0, -40, 40, 0], y: [0, 40, -40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-3xl absolute bottom-[-200px] right-[-200px]"
        />
        {/* Pink Orb */}
        <motion.div
          animate={{ x: [0, 60, -60, 0], y: [0, -50, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-3xl absolute bottom-[10%] left-[20%]"
        />
        {/* Floating Stars */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-70"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              repeatType: "mirror",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Futuristic Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl font-extrabold mb-8 text-center bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-wide drop-shadow-lg"
        >
          Junior Software Developer Interview
        </motion.h1>

        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0px 0px 25px rgba(0,255,255,0.5)",
          }}
          className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500"
        >
          <VoiceInterview />
        </motion.div>
      </div>
    </main>
  );
}
