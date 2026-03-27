import { useState } from "react";
import { Menu, Search, X, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import SideMenu from "./SideMenu";
import FAQDialog from "@/components/FAQ";
import NotificationBell from "./NotificationBell";

interface TopNavProps {
  role: "student" | "admin";
}

const TopNav = ({ role }: TopNavProps) => {
  const { isDark } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <button onClick={() => setMenuOpen(true)} className="text-foreground p-1">
            <Menu className="h-5 w-5" />
          </button>

          {searchOpen ? (
            <div className="flex-1 mx-3 flex items-center gap-2">
              <Input
                autoFocus
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 flex-1 mx-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Search events...</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <NotificationBell role={role} />
            <button onClick={() => setFaqOpen(true)} className="text-foreground p-1">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} role={role} />
      <FAQDialog open={faqOpen} onOpenChange={setFaqOpen} />
    </>
  );
};

export default TopNav;
