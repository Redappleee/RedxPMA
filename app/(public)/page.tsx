"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, BellRing, Boxes, Sparkles, Users2 } from "lucide-react";
import Link from "next/link";

import { fadeUp, staggerContainer } from "@/lib/motion";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

const features = [
  {
    title: "Live Product Intelligence",
    description: "Track revenue, stock, and product health in a single panoramic workspace.",
    icon: BarChart3
  },
  {
    title: "Collaborative Workflows",
    description: "Assign managers, comment in context, and keep every decision traceable.",
    icon: Users2
  },
  {
    title: "Real-Time Ops",
    description: "Instant notifications and socket-powered updates across the entire team.",
    icon: BellRing
  },
  {
    title: "Structured Product Data",
    description: "Categories, pricing, stock, status and history in one clean domain model.",
    icon: Boxes
  }
];

const testimonials = [
  {
    quote: "NexusPM replaced three tools and made our release cycles 35% faster.",
    name: "Lena Park",
    role: "VP Product, Synthex"
  },
  {
    quote: "The UI is beautiful, but the real win is how quickly teams align.",
    name: "Arjun Patel",
    role: "CTO, Northbridge"
  }
];

const pricing = [
  {
    name: "Starter",
    price: "$29",
    subtitle: "per month",
    points: ["3 seats", "Core dashboard", "Product CRUD", "Email support"]
  },
  {
    name: "Scale",
    price: "$99",
    subtitle: "per month",
    points: ["Unlimited seats", "Realtime updates", "Advanced analytics", "Priority support"],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "annual",
    points: ["Custom SSO", "Dedicated onboarding", "Audit logs", "SLA & security reviews"]
  }
];

export default function LandingPage() {
  return (
    <main className="container pb-12 pt-10">
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <motion.div variants={fadeUp} className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Product operations platform for high-velocity teams
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight lg:text-6xl">
            Ship faster with a premium product command center.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            NexusPM unifies product planning, execution, analytics, and collaboration in one stunningly fast SaaS workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">Preview Dashboard</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass relative rounded-3xl border p-5">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl" />

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Monthly revenue</p>
              <p className="mt-2 text-3xl font-semibold">$482K</p>
              <p className="text-xs text-success">+18.4% vs last month</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="text-xl font-semibold">152</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Stock alerts</p>
                <p className="text-xl font-semibold">9</p>
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.6, repeat: Infinity }}
              className="rounded-2xl border border-primary/20 bg-primary/10 p-4"
            >
              <p className="text-sm font-medium">Live update: Collaboration thread synced</p>
              <p className="text-xs text-muted-foreground">2 new comments on Orion Mobile</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      <section className="mt-24">
        <h2 className="text-3xl font-semibold tracking-tight">Designed for modern product organizations</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="h-full border border-border/80 p-6">
                <CardContent className="space-y-3 p-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-24 grid gap-6 lg:grid-cols-2">
        {testimonials.map((item) => (
          <Card key={item.name} className="p-6">
            <p className="text-lg leading-relaxed">“{item.quote}”</p>
            <p className="mt-5 text-sm font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.role}</p>
          </Card>
        ))}
      </section>

      <section className="mt-24">
        <h2 className="text-3xl font-semibold tracking-tight">Pricing</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {pricing.map((tier) => (
            <Card
              key={tier.name}
              className={`p-6 ${tier.featured ? "border-primary/40 bg-primary/5 shadow-glow" : ""}`}
            >
              <p className="text-sm text-muted-foreground">{tier.name}</p>
              <p className="mt-2 text-4xl font-semibold">{tier.price}</p>
              <p className="text-xs text-muted-foreground">{tier.subtitle}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {tier.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={tier.featured ? "default" : "secondary"}>
                Choose {tier.name}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-24 rounded-3xl border border-primary/25 bg-primary/10 p-10 text-center">
        <h3 className="text-3xl font-semibold">Start building your product operating system today</h3>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Move from scattered tools to one cohesive platform for execution, accountability, and growth.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/signup">Create your workspace</Link>
        </Button>
      </section>

      <footer className="py-14 text-sm text-muted-foreground">© {new Date().getFullYear()} NexusPM. Crafted for high-performing product teams.</footer>
    </main>
  );
}
