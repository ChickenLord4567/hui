import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { TrendingUp, Loader2 } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authService.login({ username, password });
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to XAUUSD Trader",
        });
        onLogin();
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <Card className="w-full max-w-md mx-4 card-gradient border-slate-700">
        <CardContent className="pt-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="text-2xl text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-50">XAUUSD Trader</h1>
            <p className="text-slate-400 mt-2">Professional Trading Platform</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="trader"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-50 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                required
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-50 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login to Platform"
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-slate-700 rounded-xl">
            <p className="text-xs text-slate-400 text-center">
              <span className="mr-1">ℹ️</span>
              Demo Credentials: trader / password123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
