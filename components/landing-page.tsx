"use client";

import { motion } from "framer-motion";
import { Sparkles, Feather, Heart, Brain, Flower2, Lightbulb, Target, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Wisdom in Every Note",
    description: "Capture your thoughts with AI sages by your side. Let ancient wisdom guide your modern life.",
    icon: Feather,
    className: "col-span-1 md:col-span-2 lg:col-span-2 bg-amber-50/50 dark:bg-stone-900/50",
  },
  {
    title: "Jungian Reflection",
    description: "Explore your inner world through Jungian psychology. Discover the archetypes shaping your journey.",
    icon: Brain,
    className: "col-span-1 md:col-span-1 lg:col-span-1 bg-stone-100/50 dark:bg-stone-800/50",
  },
  {
    title: "Daily Gratitude",
    description: "Build a positive thinking pattern with tailored questions designed to nurture your soul.",
    icon: Heart,
    className: "col-span-1 md:col-span-3 lg:col-span-3 bg-orange-50/50 dark:bg-stone-900/50",
  },
];

const benefits = [
  {
    title: "Fight Stress & Anxiety",
    icon: Shield,
    link: "#",
  },
  {
    title: "Handle Stress Better",
    icon: Flower2,
    link: "#",
  },
  {
    title: "Boost Immune Function",
    icon: Lightbulb,
    link: "#",
  },
  {
    title: "Enhance Self-Awareness",
    icon: Target,
    link: "#",
  },
];

const dailyPrompts = [
  "What does 'enough' look like for you today?",
  "Which burden can you put down, just for now?",
  "Who are you when no one is watching?",
  "What is one small thing you can control right now?",
  "How can you be kinder to yourself today?",
  "What is a lesson you are currently learning?",
  "Where do you feel most at peace?",
];

const testimonials = [
  {
    quote: "It changed my morning routine completely. I feel more centered.",
    author: "Sarah L.",
    role: "Yoga Instructor",
    avatar: "/avatars/avatar-1.webp",
  },
  {
    quote: "Finally, a journal that understands me. The AI insights are profound.",
    author: "Michael R.",
    role: "Software Engineer",
    avatar: "/avatars/avatar-2.webp",
  },
  {
    quote: "The Jungian analysis helped me understand my dreams like never before.",
    author: "Elena K.",
    role: "Psychology Student",
    avatar: "/avatars/avatar-3.webp",
  },
  {
    quote: "Simple, beautiful, and deeply impactful. A daily must-have.",
    author: "David W.",
    role: "Writer",
    avatar: "/avatars/avatar-4.webp",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-[#1a1918] text-stone-900 dark:text-stone-100 selection:bg-stone-200 dark:selection:bg-stone-800">
      {/* Navbar Placeholder */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-[#FDFCF8]/80 dark:bg-[#1a1918]/80 backdrop-blur-sm">
        <div className="text-lg font-serif font-bold tracking-tight">AI NOTE WISDOM</div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800">Log in</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-full px-6">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8 max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight leading-[1.1]">
            Your AI Companion <br/> <span className="text-stone-500 italic">for Inner Peace</span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 font-light max-w-2xl mx-auto leading-relaxed">
            Engage in enlightening conversations with sages. <br className="hidden md:block"/>
            Discover insights tailored to your spiritual growth.
          </p>
          <div className="pt-8">
            <Link href="/login">
              <Button className="h-14 px-8 rounded-full text-lg bg-stone-900 text-white hover:bg-stone-800 hover:scale-105 transition-all duration-300 shadow-xl shadow-stone-200/50 dark:shadow-none">
                Start Your Journey
              </Button>
            </Link>
            <p className="mt-4 text-sm text-stone-400">Free to start. No credit card required.</p>
          </div>
        </motion.div>
      </section>

      {/* Daily Inspiration Scroll (Function Showcase) */}
      <section className="py-20 overflow-hidden bg-stone-50 dark:bg-stone-900/30 border-y border-stone-100 dark:border-stone-800">
        <div className="mb-10 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400">Daily Inspiration</h2>
        </div>
        <div className="flex gap-8 animate-scroll whitespace-nowrap w-max px-4">
          {[...dailyPrompts, ...dailyPrompts, ...dailyPrompts].map((prompt, i) => (
            <div 
              key={i} 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm text-lg font-serif text-stone-700 dark:text-stone-300"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              {prompt}
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section (How Journaling Makes Life Better) */}
      <section className="py-24 px-6 md:px-12 bg-[#F7F7F5] dark:bg-[#1f1e1d]">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-serif text-stone-900 dark:text-stone-100">
              How journaling makes your life better
            </h2>
            <p className="text-stone-500 dark:text-stone-400 font-light text-lg">
              In just one short journaling session a day, you can:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-stone-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-6 text-center shadow-sm hover:shadow-md transition-shadow border border-stone-100 dark:border-stone-700 aspect-[3/4] md:aspect-[4/5] lg:aspect-[3/4]"
              >
                <benefit.icon className="w-12 h-12 text-stone-900 dark:text-stone-100 stroke-1" />
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 max-w-[10rem] leading-tight">
                  {benefit.title}
                </h3>
                <Link 
                  href={benefit.link} 
                  className="text-sm text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors flex items-center gap-1 mt-auto"
                >
                  Research <span className="text-xs">›</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className={cn(
                "group relative p-10 rounded-3xl border border-stone-100 dark:border-stone-800 overflow-hidden transition-all hover:shadow-lg hover:shadow-stone-100/50 dark:hover:shadow-none",
                feature.className
              )}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <feature.icon className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-20">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm">
                  <feature.icon className="w-6 h-6 text-stone-700 dark:text-stone-300" />
                </div>
                <div>
                  <h3 className="text-3xl font-serif font-medium mb-4 text-stone-900 dark:text-stone-100">
                    {feature.title}
                  </h3>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Scroll */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <h2 className="text-4xl font-serif mb-6">Loved by Mindful Seekers</h2>
        </div>
        
        <div className="flex gap-6 animate-scroll whitespace-nowrap w-max px-4 hover:[animation-play-state:paused]">
          {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
            <div 
              key={i} 
              className="w-[350px] md:w-[400px] p-8 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700/50 flex flex-col gap-6 whitespace-normal"
            >
              <p className="text-xl font-serif italic text-stone-700 dark:text-stone-300 leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 relative">
                   {t.avatar ? (
                     <Image 
                       src={t.avatar} 
                       alt={t.author} 
                       fill
                       className="object-cover"
                     />
                   ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif font-bold text-stone-600">
                      {t.author.charAt(0)}
                    </div>
                   )}
                </div>
                <div>
                  <div className="font-semibold text-stone-900 dark:text-stone-100">{t.author}</div>
                  <div className="text-sm text-stone-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Final CTA */}
      <section className="py-32 px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          <Sparkles className="w-8 h-8 mx-auto text-amber-500" />
          <h2 className="text-4xl md:text-5xl font-serif">
            Begin your journey to <br/> inner clarity today.
          </h2>
          <div className="pt-4">
            <Link href="/login">
              <Button className="h-12 px-8 rounded-full bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900">
                Start Writing for Free
              </Button>
            </Link>
          </div>
          <p className="text-sm text-stone-400 pt-12">
            © 2026 AI Note Wisdom. All rights reserved. <br/>
            <span className="opacity-50">Private. Secure. Mindful.</span>
          </p>
        </motion.div>
      </section>
    </div>
  );
}
