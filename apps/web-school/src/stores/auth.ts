import { defineStore } from 'pinia';
import { setCurrentSchoolId } from '../utils/school';

export type User = {
  id: string;
  name: string;
  roles: string[];
  permissions: string[];
  schools?: number[]; // school IDs bound to this account
};

// 默认禁用 MOCK，只有当 VITE_USE_MOCK_AUTH === 'true' 才启用演示登录
const USE_MOCK = (import.meta as any).env?.VITE_USE_MOCK_AUTH === 'true';

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
    token: (typeof localStorage !== 'undefined' && (localStorage.getItem('AUTH_TOKEN') || sessionStorage.getItem('AUTH_TOKEN'))) || '' as string,
    user: ((): User | null => {
      try {
        const u = (typeof localStorage !== 'undefined' && (localStorage.getItem('AUTH_USER') || sessionStorage.getItem('AUTH_USER')));
        return u ? (JSON.parse(u) as User) : null;
      } catch { return null; }
    })(),
    
    returnTo: '' as string,
  }),
  getters: {
    isAuthed: (s) => !!s.token && !!s.user,
    hasPerm: (s) => (p: string) => {
      if (!s.user) return false;
      const owned = s.user.permissions || [];
      if (owned.includes('*') || owned.includes('*:*') || owned.includes(p)) return true;
      // Support wildcard namespaces with both dot and colon separators
      const idxDot = p.indexOf('.')
      const idxCol = p.indexOf(':')
      const idx = idxDot === -1 ? idxCol : (idxCol === -1 ? idxDot : Math.min(idxDot, idxCol))
      const ns = idx > 0 ? p.slice(0, idx) : p
      return owned.includes(`${ns}.*`) || owned.includes(`${ns}:*`) || owned.some((x) => x.startsWith(`${ns}.`) || x.startsWith(`${ns}:`))
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
      try {
        const schools: Array<number> | undefined = (data?.user && Array.isArray(data.user.schools)) ? data.user.schools : undefined;
        if (schools && schools.length > 0 && schools[0] !== undefined && schools[0] !== null) {
          setCurrentSchoolId(String(schools[0]));
        }
      } catch {}
    },
    async logout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST', headers: { ...((this.token && { Authorization: `Bearer ${this.token}` }) || {}) } });
      } catch {}
      this.token = '';
      this.user = null;
      try {
        // Clear all saved state including current school selection
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    },
    setReturnTo(path: string) { this.returnTo = path; },
  },
});
