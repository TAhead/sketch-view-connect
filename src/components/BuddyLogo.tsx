import buddyLogo from "@/assets/buddy_logo.png";

interface BuddyLogoProps {
  treeState?: boolean;
}

export function BuddyLogo({ treeState }: BuddyLogoProps) {
  const borderColor = treeState === undefined ? 'border-border' : treeState ? 'border-green-500' : 'border-red-500';
  
  console.log('BuddyLogo - treeState:', treeState, 'borderColor:', borderColor);
  
  return (
    <div className={`flex items-center justify-center p-4 bg-card border-2 rounded-lg shadow-sm ${borderColor}`}>
      <img src={buddyLogo} alt="Buddy Logo" className="h-20 w-auto" />
    </div>
  );
}