"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'citizen';
  
  const [role, setRole] = useState(defaultRole);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync role state with URL parameter if it changes
  useEffect(() => {
    if (defaultRole) {
      setRole(defaultRole);
    }
  }, [defaultRole]);

  const requiresPassword = ['officer', 'collector', 'admin'].includes(role);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await signIn('credentials', {
        username: role === 'officer' ? 'SR-BLR-092' : role === 'collector' ? 'DC-BLR-001' : 'demo_user',
        password: requiresPassword ? password : '',
        role: role,
        redirect: false,
      });
      
      if (res?.ok) {
        if (role === 'officer') router.push('/officer');
        else if (role === 'collector') router.push('/collector');
        else if (role === 'nri') router.push('/nri');
        else if (role === 'court') router.push('/court');
        else if (role === 'admin') router.push('/admin');
        else router.push('/citizen');
      } else {
        setError('Authentication failed. Check your password.');
      }
    } catch (err) {
      console.error("Login failed", err);
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-navy flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Shield size={48} className="text-accent-blue mb-2" />
        <h2 className="mt-2 text-center text-3xl font-serif font-extrabold text-text-primary">
          Land Trust Infrastructure
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Secure identity verification portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-dark py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border-color">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-frozen-red/20 border border-frozen-red/50 text-frozen-red p-3 rounded text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-text-primary">
                Institutional Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setPassword('');
                    setError(null);
                  }}
                  className="block w-full px-3 py-2 border border-border-color rounded-md shadow-sm bg-primary-navy text-text-primary focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm"
                >
                  <option value="citizen">Citizen (Public View)</option>
                  <option value="nri">NRI Owner (View-Only Portal)</option>
                  <option value="court">High Court Official (Injunction Docket)</option>
                  <option value="officer">Sub-Registrar (Write/Approve Mutation)</option>
                  <option value="collector">District Collector (Write/Injunctions)</option>
                  <option value="admin">System Administrator (Admin Panel)</option>
                </select>
              </div>
            </div>

            {requiresPassword && (
              <div className="animate-in fade-in duration-200">
                <label htmlFor="password-field" className="block text-sm font-medium text-text-primary flex items-center gap-1.5">
                  <Lock size={14} className="text-pending-amber" />
                  <span>Security Password Required</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password-field"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter auth code"
                    className="block w-full px-3 py-2 border border-border-color rounded-md shadow-sm bg-primary-navy text-text-primary focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm font-mono"
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1.5">
                  Write actions (Officer / Collector / Admin) require key clearance.
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-accent-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying Credentials...' : 'Sign in securely'}
              </button>
            </div>
            
            <div className="text-center">
              <a href="/" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                ← Return to Home Dashboard
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary-navy flex items-center justify-center text-text-primary">Loading Auth Portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
