// Map menu tree selections to backend permission keys and vice versa

export function mapMenuIdsToPerms(ids: string[]): string[] {
  const set = new Set<string>();
  for (const id of ids || []) {
    if (id === 'store' || id.startsWith('store_')) set.add('inventory.*');
    else if (id === 'daily' || id.startsWith('daily_')) set.add('daily.*');
    else if (id === 'hr' || id.startsWith('hr_')) set.add('hr.*');
    else if (id === 'video' || id.startsWith('video_') || id === 'check' || id.startsWith('check_')) set.add('bright.*');
    else if (id === 'home' || id.startsWith('home_')) set.add('overview.*');
    else if (id === 'sys' || id.startsWith('sys_')) set.add('system.*');
    // Specific actions
    if (id === 'sys_users' || id === 'sys_roles') set.add('users.manage');
  }
  return Array.from(set);
}

export function mapPermsToMenuIds(perms: string[]): string[] {
  const ids = new Set<string>();
  for (const p of perms || []) {
    if (p === 'inventory.*' || p.startsWith('inventory.') || p.startsWith('inventory:')) {
      ids.add('store');
      ids.add('store_goods');
      ids.add('store_in');
      ids.add('store_out');
      ids.add('store_stock');
      
    } else if (p === 'daily.*' || p.startsWith('daily.') || p.startsWith('food_safety:') || p.startsWith('training:') || p.startsWith('food_waste:')) {
      ids.add('daily');
      ids.add('daily_morning');
      ids.add('daily_sample');
      ids.add('daily_disinfection');
      ids.add('daily_residue');
      ids.add('daily_waste');
      ids.add('daily_device_safety');
    } else if (p === 'hr.*' || p.startsWith('hr.') || p.startsWith('credentials:')) {
      ids.add('hr');
      ids.add('hr_staff');
      ids.add('hr_license');
      ids.add('hr_training');
      ids.add('hr_exam');
    } else if (p === 'bright.*' || p.startsWith('bright.') || p.startsWith('stream:') || p.startsWith('alerts:')) {
      ids.add('video');
      ids.add('video_live');
      ids.add('video_replay');
      ids.add('video_snapshot');
      ids.add('video_nvr');
      ids.add('check');
      ids.add('check_ai');
      ids.add('check_stat');
    } else if (p === 'overview.*' || p.startsWith('overview.') || p.startsWith('report:') || p.startsWith('reports.')) {
      ids.add('home');
      ids.add('home_warning');
    } else if (p === 'system.*' || p.startsWith('system.') || p.startsWith('settings.') || p.startsWith('settings:') || p.startsWith('users.')) {
      ids.add('sys');
      ids.add('sys_canteen');
      ids.add('sys_audit');
      ids.add('sys_mobile');
      ids.add('sys_device');
    }
    if (p === 'users.manage') {
      ids.add('sys');
      ids.add('sys_users');
      ids.add('sys_roles');
    }
  }
  return Array.from(ids);
}

// Build permissions from selected menu IDs based on backend permission tree
// tree: [{ label: resource, children: [{ key, label }] }]
export function mapMenuIdsToPermsFromTree(ids: string[], tree: Array<{ label: string; children: Array<{ key: string; label: string }> }>): string[] {
  const resMap = new Map<string, string[]>();
  for (const g of tree || []) resMap.set(g.label, (g.children || []).map((c) => c.key));
  const addGroup = (name: string, out: Set<string>) => {
    const keys = resMap.get(name);
    if (keys) keys.forEach((k) => out.add(k));
  };
  const out = new Set<string>();
  for (const id of ids || []) {
    if (id === 'store' || id.startsWith('store_')) {
      addGroup('inventory', out);
      out.add('inventory.*');
    }
    else if (id === 'video' || id.startsWith('video_') || id === 'check' || id.startsWith('check_')) {
      addGroup('stream', out);
      addGroup('alerts', out);
      out.add('bright.*');
    } else if (id === 'daily' || id.startsWith('daily_')) {
      addGroup('food_safety', out);
      addGroup('training', out);
      addGroup('food_waste', out);
      out.add('daily.*');
    } else if (id === 'hr' || id.startsWith('hr_')) {
      addGroup('credentials', out);
      out.add('hr.*');
    }
    else if (id === 'home' || id.startsWith('home_')) {
      addGroup('report', out);
      addGroup('reports', out);
      out.add('overview.*');
    } else if (id === 'sys' || id.startsWith('sys_')) {
      addGroup('settings', out);
      // users.manage is a leaf under resource 'users'
      const usersKeys = resMap.get('users') || [];
      usersKeys.filter((k) => k === 'users.manage').forEach((k) => out.add(k));
      out.add('system.*');
    }
  }
  return Array.from(out);
}
