"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-x-hidden">
      {/* **Hero Section (Animated & Ultra-Modern) ** */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center relative"
      >
        {/* **Floating Glow Effect (Background) ** */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl filter opacity-30"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl filter opacity-30"></div>
        </div>

        <motion.h1
          variants={fadeIn}
          className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
        >
          Whisper Your <span className="text-white">Deepest</span> Thoughts
        </motion.h1>

        <motion.p
          variants={fadeIn}
          className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl"
        >
          A sanctuary for{" "}
          <span className="font-semibold text-purple-300">
            anonymous confessions
          </span>
          , secret connections, and unfiltered emotions.
        </motion.p>

        <motion.div
          variants={fadeIn}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <Button
            className="h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30"
            asChild
          >
            <Link href="/signup">Begin Your Journey</Link>
          </Button>
          <Button
            variant="outline"
            className="h-14 px-8 text-blue-950 text-lg border-gray-600 hover:bg-gray-800/50 hover:text-white transition-all"
            asChild
          >
            <Link href="/about">Discover More</Link>
          </Button>
        </motion.div>
      </motion.section>

      {/* **Animated Floating Cards (Premium UI) ** */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        variants={staggerContainer}
        viewport={{ once: true }}
        className="container mx-auto px-4 py-16"
      >
        <motion.h2
          variants={fadeIn}
          className="text-4xl font-bold text-center mb-16"
        >
          Why{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Mystery-Thought?
          </span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Anonymous Thoughts",
              desc: "Share secrets without fear. Your identity stays hidden forever.",
              icon: "🔒",
            },
            {
              title: "Secret Chats",
              desc: "Connect with strangers who truly understand your emotions.",
              icon: "💬",
            },
            {
              title: "No Judgement",
              desc: "A safe space for unfiltered confessions and raw honesty.",
              icon: "🛡️",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-purple-500 transition-all h-full">
                <CardHeader>
                  <span className="text-4xl mb-2">{feature.icon}</span>
                  <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* **Dark & Mysterious CTA Section ** */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 py-24 text-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-3xl -z-10"></div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Unleash
          </span>{" "}
          Your Secrets?
        </h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Join thousands who found freedom in anonymity.
        </p>
        <Button
          className="h-16 px-10 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 transition-all"
          asChild
        >
          <Link href="/signup">Start Now — It’s Free</Link>
        </Button>
      </motion.section>

      {/* **Ultra-Sleek Footer ** */}
      <footer className="bg-gray-900/80 border-t border-gray-800 py-12 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Mail className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  Mystery Message
                </span>
              </Link>
            </div>
            <div className="flex space-x-6">
              <Link
                href="/about"
                className="text-gray-400 hover:text-white transition-all"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-all"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-all"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="text-gray-400 hover:text-white transition-all"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Mystery-Thought. All secrets remain
            hidden.
          </div>
        </div>
      </footer>
    </div>
  );
}
