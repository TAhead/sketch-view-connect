import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { BuddyLogo } from "@/components/BuddyLogo";
import baheadLogo from "@/assets/bahead_logo.png";

const passwordSchema = z.string()
  .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
  .regex(/[A-Z]/, "Passwort muss mindestens einen Großbuchstaben enthalten")
  .regex(/[a-z]/, "Passwort muss mindestens einen Kleinbuchstaben enthalten")
  .regex(/[0-9]/, "Passwort muss mindestens eine Ziffer enthalten")
  .regex(/[^A-Za-z0-9]/, "Passwort muss mindestens ein Sonderzeichen enthalten");

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Passwörter stimmen nicht überein",
      });
      return;
    }

    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Ungültiges Passwort",
        description: validation.error.errors[0].message,
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Ihr Passwort wurde erfolgreich geändert",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message || "Passwort konnte nicht zurückgesetzt werden",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <img 
        src={baheadLogo} 
        alt="Bahead Logo" 
        className="absolute top-8 right-8 h-12 w-auto"
      />
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 flex flex-col items-center">
          <BuddyLogo />
          <div className="text-center">
            <CardTitle className="text-2xl">Neues Passwort festlegen</CardTitle>
            <CardDescription className="mt-2">
              Geben Sie Ihr neues Passwort ein
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Das Passwort muss folgende Anforderungen erfüllen:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Mindestens 8 Zeichen</li>
                <li>Mindestens ein Großbuchstabe</li>
                <li>Mindestens ein Kleinbuchstabe</li>
                <li>Mindestens eine Ziffer</li>
                <li>Mindestens ein Sonderzeichen</li>
              </ul>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird gespeichert..." : "Passwort ändern"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
