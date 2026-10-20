'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { ShieldCheck, UserCheck, Eye, LogIn, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register, logout } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        toast.success(`Welcome back, ${username}!`);
      } else {
        await register(username, password, role);
        toast.success(`User ${username} registered successfully!`);
      }
      router.push('/products');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setIsLoading(true);
    try {
      await login(demoUser, demoPass);
      toast.success(`Signed in as ${demoUser}!`);
      router.push('/products');
    } catch (err: any) {
      toast.error(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {mode === 'login' ? 'Inventory Sign In' : 'Create an Account'}
        </h1>
        <p className="text-muted-foreground text-sm">
          Authenticate with the backend REST API to access role-protected inventory operations.
        </p>
      </div>

      {user && (
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Currently signed in as <span className="font-bold text-accent">{user.username}</span> ({user.role})
              </p>
              <p className="text-xs text-muted-foreground">You can navigate to the catalog or switch accounts below.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => router.push('/products')}>
              Go to Products
            </Button>
            <Button size="sm" variant="ghost" onClick={logout} className="text-destructive">
              Sign Out
            </Button>
          </div>
        </Card>
      )}

      {/* Main Auth Form Card */}
      <Card className="p-6 border-border bg-card shadow-lg space-y-6">
        {/* Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'login'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'register'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Username
            </label>
            <Input
              type="text"
              placeholder="e.g. admin, manager, viewer"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-secondary/30 border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary/30 border-border text-foreground"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role (Authorization Level)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="manager">Manager (Create & Edit)</option>
                <option value="admin">Admin (Full Access: Create, Edit & Delete)</option>
              </select>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 gap-2">
            {mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                {isLoading ? 'Signing In...' : 'Sign In'}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {isLoading ? 'Creating User...' : 'Create Account'}
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* 1-Click Quick Demo Login Section */}
      <Card className="p-6 border-border bg-card space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Quick 1-Click Demo Accounts (RBAC Testing)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Click any role to test backend authorization and role enforcement immediately:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleQuickLogin('admin', 'admin123')}
            className="p-3 text-left rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all flex flex-col gap-1 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-purple-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Admin
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-muted-foreground">Full CRUD</p>
            <span className="text-[11px] font-mono text-purple-300">admin / admin123</span>
          </button>

          <button
            onClick={() => handleQuickLogin('manager', 'manager123')}
            className="p-3 text-left rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all flex flex-col gap-1 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-blue-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Manager
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-muted-foreground">Create & Edit</p>
            <span className="text-[11px] font-mono text-blue-300">manager / manager123</span>
          </button>

          <button
            onClick={() => handleQuickLogin('viewer', 'viewer123')}
            className="p-3 text-left rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex flex-col gap-1 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-emerald-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                Viewer
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-muted-foreground">View Only</p>
            <span className="text-[11px] font-mono text-emerald-300">viewer / viewer123</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
