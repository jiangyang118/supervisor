import { defineStore } from 'pinia';

export type User = { id: string | number; name: string; roles: string[]; permissions: string[] };

export const useAuthStore = defineStore('reg-auth', {
  state: () => ({
    token: (typeof localStorage !== 'undefined' && localStorage.getItem('AUTH_TOKEN')) || '',
    user: (typeof localStorage !== 'undefined' && localStorage.getItem('AUTH_USER') && JSON.parse(localStorage.getItem('AUTH_USER') || 'null')) as User | null,
    returnTo: '' as string,
  }),
  getters: {
    isAuthed: (s) => !!s.token && !!s.user,
    hasPerm: (s) => (p: string) => {
      if (!s.user) return false;
      const owned = s.user.permissions || [];
      if (owned.includes('*') || owned.includes('*:*') || owned.includes(p)) return true;
      const [ns] = p.split(':');
      return owned.includes(`${ns}:*`) || owned.includes(`${ns}.*`) || owned.includes(`${ns}:R`);
    },
  },
  actions: {
    setReturnTo(p: string) { this.returnTo = p; },
    async login(username: string, password: string) {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.message || 'Login failed');
      this.token = data.token; this.user = data.user;
      localStorage.setItem('AUTH_TOKEN', this.token);
      localStorage.setItem('AUTH_USER', JSON.stringify(this.user));
    },
    async logout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST', headers: { ...((this.token && { Authorization: `Bearer ${this.token}` }) || {}) } });
      } catch {}
      this.token = ''; this.user = null;
      try {
        localStorage.removeItem('AUTH_TOKEN');
        localStorage.removeItem('AUTH_USER');
      } catch {}
    },
  },
});
