import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/inbox" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName || email.split("@")[0]);
        if (error) throw error;
        toast.success("Account created! Check your email to verify your account.");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      if (msg.includes("already registered")) {
        toast.error("This email is already registered. Try signing in instead.");
      } else if (msg.includes("Invalid login")) {
        toast.error("Invalid email or password.");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Please confirm your email before signing in.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-stripe-md">
            <Mail className="h-6 w-6 text-primary-foreground" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {isSignUp ? "Create your account" : "Sign in to mailBOXFORD"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? "Get started with smart email" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-card text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:shadow-stripe-sm transition-all"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-card text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:shadow-stripe-sm transition-all"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-input bg-card text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring focus:shadow-stripe-sm transition-all"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="compose-btn w-full py-2.5 rounded-lg text-[13px] font-semibold text-primary-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[12px] text-muted-foreground mt-5">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
