import buddyLogo from "@/assets/buddy_logo.png";

export function BuddyLogo() {
  return (
    <div className="flex items-center justify-center p-4 bg-card border-2 border-border rounded-lg shadow-sm">
      <img src={buddyLogo} alt="Buddy Logo" className="h-20 w-auto" />
    </div>
  );
}