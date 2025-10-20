import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { BuddyLogo } from "@/components/BuddyLogo";
import { Footer } from "@/components/Footer";
import baheadLogo from "@/assets/bahead_logo.png";

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if Supabase is properly configured
  const isSupabaseReady = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Willkommen zurück!",
          description: "Erfolgreich eingeloggt",
        });
        navigate("/");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: "Email erforderlich",
        description: "Bitte geben Sie Ihre Email-Adresse ein",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Fehler",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email gesendet!",
          description: "Überprüfen Sie Ihr Postfach für den Passwort-Reset-Link",
        });
        setShowResetDialog(false);
        setResetEmail("");
      }
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Bahead logo in top right corner */}
      <div className="absolute top-4 right-4">
        <img src={baheadLogo} alt="Bahead Logo" className="h-16 w-auto" />
      </div>

      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BuddyLogo />
          </div>

          <p className="text-muted-foreground">Labor Automatisierungs Plattform</p>
        </div>

        {!showResetDialog ? (
          <Card>
            <CardHeader>
              <CardTitle>Anmelden</CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
              {!isSupabaseReady && (
                <Alert className="mb-4">
                  <AlertDescription>
                    Buddy is setting up your backend. Please wait a moment and refresh the page.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="E-Mail-Adresse eingeben"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Passwort eingeben"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading || !isSupabaseReady}>
                  {loading ? "Signing in..." : "Anmelden"}
                </Button>
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetDialog(true)}
                    className="text-sm text-primary hover:underline"
                    disabled={loading}
                  >
                    Passwort zurücksetzen
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Passwort zurücksetzen</CardTitle>
              <CardDescription>Geben Sie Ihre Email-Adresse ein</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="ihre.email@beispiel.de"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handlePasswordReset} disabled={loading} className="flex-1">
                    {loading ? "Senden..." : "Email senden"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResetDialog(false);
                      setResetEmail("");
                    }}
                    disabled={loading}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
