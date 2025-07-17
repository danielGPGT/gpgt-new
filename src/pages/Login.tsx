import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthProvider";
import { hasTeamFeature } from '@/lib/teamUtils';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/imgs/gpgt_logo_light.svg";
import leftBg from "@/assets/imgs/192af0f6-41bf-473f-981d-70e564e4f79e.png";

export default function Login() {
  const { user, signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isNotB2B, setIsNotB2B] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      hasTeamFeature('is_not_b2b').then((enabled) => {
        setIsNotB2B(enabled);
        if (enabled === false) {
          navigate("/package-intake-test");
        } else {
          navigate("/dashboard");
        }
      });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background" style={{minHeight: '100vh'}}>
      {/* Top right Request Demo button */}
      <div className="w-full flex justify-end items-center p-6 absolute top-0 left-0 z-30">
        <Link to="/request-demo">
          <Button className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
            Request Demo
          </Button>
        </Link>
      </div>
      <div className="flex flex-1 w-full items-stretch">
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-between w-1/2 relative bg-black">
          <img
            src={leftBg}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover object-center z-0"
          />
          {/* Logo top-left */}
          <div className="relative z-10 flex items-center gap-3 p-8">
            <img src={Logo} alt="Logo" className="h-14" />
          </div>
          {/* Tagline bottom-left */}
          <div className="relative z-10 p-8 pb-12 mt-auto">
            <h2 className="text-3xl text-white font-bold mb-2 drop-shadow" style={{fontFamily: 'var(--font-sans)'}}>Tailor-Made Motorsport Travel</h2>
            <p className="text-base text-white max-w-md drop-shadow">
            Welcome to the Grand Prix Grand Tours Portal — your gateway to exclusive F1, MotoGP, and motorsport travel experiences.
            </p>
          </div>
        </div>
        {/* Right Side: Login Form */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-background p-8 min-h-screen">
          <form onSubmit={handleLogin} className="w-full max-w-[370px] mx-auto flex flex-col gap-7">
            <div className="flex flex-col gap-2 mt-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1" style={{fontFamily: 'var(--font-sans)'}}>Login to your account</h1>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Your Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 text-base border border-input focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div className="flex flex-col gap-1 relative">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11 text-base border border-input focus:border-ring focus:ring-2 focus:ring-ring/20 pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 transform text-muted-foreground hover:text-foreground focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2.5 10C3.833 6.667 6.667 4.5 10 4.5c3.333 0 6.167 2.167 7.5 5.5-1.333 3.333-4.167 5.5-7.5 5.5-3.333 0-6.167-2.167-7.5-5.5Z" stroke="var(--foreground)" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="var(--foreground)" strokeWidth="1.5"/></svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2.5 10C3.833 6.667 6.667 4.5 10 4.5c3.333 0 6.167 2.167 7.5 5.5-1.333 3.333-4.167 5.5-7.5 5.5-3.333 0-6.167-2.167-7.5-5.5Z" stroke="var(--foreground)" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="var(--foreground)" strokeWidth="1.5"/><path d="m4 16 12-12" stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((v) => !v)}
                  className="accent-[var(--primary)] w-4 h-4 rounded border border-input focus:ring-0"
                />
                <span className="text-foreground">Remember Me</span>
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">Forgot Password?</Link>
            </div>
            {error && <div className="text-destructive text-sm text-center font-medium mt-2">{error}</div>}
            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-lg shadow-none"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground mt-4">
              Want to <Link to="/request-demo" className="text-primary font-semibold hover:underline">request a demo?</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 