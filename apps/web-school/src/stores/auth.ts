import { defineStore } from 'pinia';

export type User = {
  id: string;
  name: string;
  roles: string[];
  permissions: string[];
};

const USE_MOCK = (import.meta as any).env?.VITE_USE_MOCK_AUTH !== 'false';

async function mockLogin(username: string, password: string): Promise<{ token: string; user: User }>{
  // simple demo: admin/admin has all perms; user/user has limited perms
  if ((username === 'admin' && password === 'admin') || (username === 'user' && password === 'user')) {
    const admin = username === 'admin';
    const perms = admin
      ? ['settings.*', 'users.*', 'roles.*', 'reports.view', 'ledgers.*']
      : ['reports.view', 'ledgers.view'];
    const roles = admin ? ['system_admin'] : ['school_user'];
    return { token: `demo-${Date.now()}`, user: { id: username, name: username, roles, permissions: perms } };
  }
  throw new Error('Invalid credentials');
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as User | null,
    returnTo: '' as string,
  }),
  getters: {
    isAuthed: (s) => !!s.token && !!s.user,
    hasPerm: (s) => (p: string) => {
      if (!s.user) return false;
      if (s.user.permissions.includes('*') || s.user.permissions.includes(p)) return true;
      // wildcard check like settings.*
      const [ns] = p.split('.') as string[];
      return s.user.permissions.includes(`${ns}.*`);
    },
  },
  actions: {
    async login(username: string, password: string) {
      if (USE_MOCK) {
        const { token, user } = await mockLogin(username, password);
        this.token = token; this.user = user;
        localStorage.setItem('AUTH_TOKEN', token);
        localStorage.setItem('AUTH_USER', JSON.stringify(user));
        return;
      }
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.message || 'Login failed');
      this.token = data.token; this.user = data.user;
      localStorage.setItem('AUTH_TOKEN', this.token);
      localStorage.setItem('AUTH_USER', JSON.stringify(this.user));
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('AUTH_TOKEN');
      localStorage.removeItem('AUTH_USER');
    },
    setReturnTo(path: string) { this.returnTo = path; },
  },
});
