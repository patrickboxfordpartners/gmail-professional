import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Mail,
  Shield,
  Sparkles,
  Clock,
  Pen,
  Users,
  ArrowRight,
  Zap,
  Lock,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Compose",
    description: "Draft emails in seconds with intelligent AI assistance that understands your tone and context.",
  },
  {
    icon: Clock,
    title: "Schedule & Undo Send",
    description: "Send emails on your schedule. Changed your mind? Undo within 5 seconds.",
  },
  {
    icon: Pen,
    title: "Rich Signatures",
    description: "Design stunning signatures with logos, social links, and custom styling — switch between multiple.",
  },
  {
    icon: Users,
    title: "Built-in CRM",
    description: "Track contacts, companies, and deal stages right from your inbox. No separate tool needed.",
  },
  {
    icon: Shield,
    title: "Noise Filter",
    description: "Intelligent filtering keeps your inbox clean by learning which senders matter most to you.",
  },
  {
    icon: BarChart3,
    title: "Templates & Labels",
    description: "Save reusable templates and organize with custom labels for maximum productivity.",
  },
];

const stats = [
  { value: "10x", label: "Faster email workflow" },
  { value: "99.9%", label: "Uptime guarantee" },
  { value: "256-bit", label: "End-to-end encryption" },
];

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/inbox" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-stripe-sm">
              <Mail className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground">
              mail<span className="text-primary">BOXFORD</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="compose-btn px-4 py-2 rounded-lg text-[13px] font-semibold text-primary-foreground transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent text-accent-foreground text-[12px] font-semibold mb-6 animate-fade-in">
            <Zap className="h-3.5 w-3.5" />
            Smart email for modern teams
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground animate-slide-up">
            Email that works{" "}
            <span className="bg-gradient-to-r from-primary to-[hsl(var(--compose-gradient-to))] bg-clip-text text-transparent">
              as hard as you do
            </span>
          </h1>
          <p className="mt-5 text-[16px] sm:text-[18px] text-muted-foreground max-w-xl mx-auto leading-relaxed animate-slide-up">
            AI compose, built-in CRM, rich signatures, and smart filtering — all in one beautiful inbox built for Boxford Partners.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
            <Link
              to="/auth"
              className="compose-btn px-7 py-3 rounded-xl text-[14px] font-semibold text-primary-foreground transition-all flex items-center gap-2"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16 px-6">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stat.value}
              </div>
              <div className="text-[11px] sm:text-[12px] text-muted-foreground mt-1 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-3 text-[14px] text-muted-foreground max-w-md mx-auto">
              Powerful features designed to keep your team focused and productive.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-card border border-border rounded-xl p-6 hover:shadow-stripe-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="h-5 w-5 text-accent-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Ready to transform your inbox?
          </h2>
          <p className="mt-3 text-[14px] text-muted-foreground">
            Join Boxford Partners on the smartest email platform yet.
          </p>
          <Link
            to="/auth"
            className="compose-btn inline-flex items-center gap-2 mt-7 px-7 py-3 rounded-xl text-[14px] font-semibold text-primary-foreground transition-all"
          >
            Create your account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Mail className="h-3 w-3 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-[12px] font-semibold text-muted-foreground">
              mail<span className="text-foreground">BOXFORD</span>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            © 2026 Boxford Partners. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
