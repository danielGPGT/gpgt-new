import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthProvider";
import Logo from "@/assets/imgs/logo.svg";
import img1 from "@/assets/imgs/james-donaldson-toPRrcyAIUY-unsplash.jpg";
import img2 from "@/assets/imgs/fredrik-ohlander-fCW1hWq2nq0-unsplash.jpg";
import img3 from "@/assets/imgs/spencer-davis-Ivwyqtw3PzU-unsplash.jpg";
import img4 from "@/assets/imgs/igor-oliyarnik-Uu5aXBI1oLk-unsplash.jpg";

const carouselImages = [img1, img2, img3, img4];

export default function Login() {
  const { user, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const startTransition = (newIdx: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setNextIdx(newIdx);
    
    // Complete the transition after animation
    setTimeout(() => {
      setCarouselIdx(newIdx);
      setIsTransitioning(false);
    }, 1000);
  };

  const nextSlide = () => {
    const newIdx = (carouselIdx + 1) % carouselImages.length;
    startTransition(newIdx);
  };

  // Optional: auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselIdx, isTransitioning]);

  const handleSlideChange = (idx: number) => {
    if (isTransitioning || idx === carouselIdx) return;
    startTransition(idx);
  };

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

  return (
    <div className="flex min-h-screen relative">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-black text-white p-8 relative overflow-hidden">
        {/* Carousel Background */}
        <div className="absolute inset-0">
          {/* Current Image */}
          <img
            src={carouselImages[carouselIdx]}
            alt="Travel background"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              isTransitioning ? 'opacity-0' : 'opacity-40'
            }`}
          />
          {/* Next Image (for smooth transition) */}
          {isTransitioning && (
            <img
              src={carouselImages[nextIdx]}
              alt="Travel background"
              className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-1000 ease-in-out"
          />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent" />
        </div>
        {/* Top content */}
        <div className="relative flex flex-col space-y-6 z-10 mt-20">
          <h2 className="text-4xl font-bold leading-tight">
            Tailor-made Luxury Travel
          </h2>
          <p className="text-lg text-gray-200 max-w-md">
            Welcome to LuxeTripBuilder — your gateway to exclusive, AI-powered luxury travel experiences.
          </p>
        </div>
        {/* Bottom quote */}
        <div className="relative text-sm text-gray-300 mt-8 z-10 mb-4">
          <p className="italic">
            "Travel smarter. Dream bigger. Experience luxury like never before."
          </p>
          <p className="mt-4 font-semibold">LuxeTripBuilder</p>
        </div>
        {/* Carousel controls */}
        <div className="absolute left-0 right-0 bottom-8 flex justify-center gap-2 z-20">
          {carouselImages.map((_, idx) => (
            <button
              key={idx}
              className={`h-2 w-2 rounded-full transition-all duration-500 ease-in-out ${
                carouselIdx === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
              }`}
              onClick={() => handleSlideChange(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      </div>
      {/* Right Side */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 bg-background min-h-screen">
        <div className="w-full max-w-md space-y-6 bg-card rounded-xl shadow-lg p-8 flex flex-col items-center">
          <img src={Logo} alt="AItinerary Logo" className="h-12 mb-6 lg:hidden" />
          <h1 className="text-2xl font-bold text-center text-primary">
            Sign in to your account
          </h1>
          <p className="text-center text-muted-foreground text-sm">
            Enter your email and password to access your account
          </p>
          <form onSubmit={handleLogin} className="space-y-4 w-full">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
            {error && <div className="text-destructive text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            By signing in, you agree to our {" "}
            <a href="/terms" className="underline text-primary hover:text-primary/80">
              Terms of Service
            </a>{" "}
            and {" "}
            <a href="/privacy" className="underline text-primary hover:text-primary/80">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
} 