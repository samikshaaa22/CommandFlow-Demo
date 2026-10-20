'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, Settings, User, LogOut, LogIn, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const getRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case 'manager':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'viewer':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {user ? `Welcome back, ${user.username}` : 'Inventory Demo'}
        </h2>
        {user ? (
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getRoleBadge(
              user.role
            )}`}
          >
            {user.role}
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
            Guest (Read Only)
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Notifications">
          <Bell className="w-5 h-5 text-foreground" />
        </button>
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Messages">
          <MessageSquare className="w-5 h-5 text-foreground" />
        </button>
        <Link href="/settings" className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Settings">
          <Settings className="w-5 h-5 text-foreground" />
        </Link>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <User className="w-4 h-4 text-accent-foreground" />
          </div>

          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-xs border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm" className="gap-2 text-xs bg-accent hover:bg-accent/90">
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
