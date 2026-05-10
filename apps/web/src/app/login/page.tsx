"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('citizen');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await signIn('credentials', {
        username: 'demo_user',
        password: 'password',
        role: role,
        redirect: false,
      });
      
      if (res?.ok) {
        // Redirect based on role
        if (role === 'officer') router.push('/officer');
        else if (role === 'collector') router.push('/collector');
        else if (role === 'nri') router.push('/nri');
        else if (role === 'court') router.push('/court');
        else router.push('/');
      }
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-navy flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-serif font-extrabold text-text-primary">
          Land Trust Infrastructure
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Secure, immutable land registry portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-dark py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border-color">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-text-primary">
                Select Institutional Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border-color rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm bg-primary-navy text-text-primary"
                >
                  <option value="citizen">Citizen</option>
                  <option value="officer">Sub-Registrar (Officer)</option>
                  <option value="collector">District Collector</option>
                  <option value="nri">NRI Owner</option>
                  <option value="court">High Court Official</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign in securely'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
