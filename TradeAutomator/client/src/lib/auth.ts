import { loginSchema, type LoginData } from "@shared/schema";

interface AuthUser {
  id: string;
  username: string;
}

class AuthService {
  private user: AuthUser | null = null;

  async login(credentials: LoginData): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const validatedData = loginSchema.parse(credentials);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || "Login failed" };
      }

      const data = await response.json();
      this.user = data.user;
      
      // Store in localStorage for persistence
      localStorage.setItem("auth_user", JSON.stringify(this.user));
      
      return { success: true, user: this.user! };
    } catch (error) {
      return { success: false, error: "Invalid credentials" };
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem("auth_user");
  }

  getCurrentUser(): AuthUser | null {
    if (this.user) return this.user;
    
    // Try to restore from localStorage
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        this.user = JSON.parse(stored);
        return this.user;
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    
    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new AuthService();
