// Map menu tree selections to permission keys (explicit, page-level)

const menuPermMap: Record<string, string> = {
  // Overview
  home: 'overview.view',
  home_warning: 'overview.alerts',
  // Bright kitchen + AI
  video_live: 'bright.live',
  video_replay: 'bright.playback',
  video_snapshot: 'bright.snapshots',
  video_ai: 'bright.ai-events',
  // Daily operations
  daily_morning: 'daily.morning',
  daily_sample: 'daily.sampling',
  daily_disinfection: 'daily.disinfection',
  daily_environment: 'daily.environment',
  daily_residue: 'daily.pesticide',
  daily_waste: 'daily.waste',
  daily_device_safety: 'daily.device-safety',
  // Inventory
  store_goods: 'inventory.items',
  store_in: 'inventory.inbound',
  store_out: 'inventory.outbound',
  store_stock: 'inventory.stock',
  store_additives: 'inventory.additives',
  // HR
  hr_staff: 'hr.staff',
  hr_license: 'hr.canteen-licenses',
  hr_suppliers: 'hr.suppliers',
  // System
  sys_canteen: 'system.canteen',
  sys_users: 'users.manage',
  sys_roles: 'users.manage',
  sys_mobile: 'system.app',
  sys_device: 'system.devices',
};

export function mapMenuIdsToPerms(ids: string[]): string[] {
  const out = new Set<string>();
  for (const id of ids || []) {
    if (id in menuPermMap) out.add(menuPermMap[id]);
  }
  return Array.from(out);
}

export function mapPermsToMenuIds(perms: string[]): string[] {
  const ids: string[] = [];
  const reversed = new Map<string, string>();
  Object.entries(menuPermMap).forEach(([id, perm]) => reversed.set(perm, id));
  for (const p of perms || []) {
    const id = reversed.get(p);
    if (id) { ids.push(id); continue; }
    // Expand legacy wildcards to current leaf ids
    if (p === 'overview.*' || p.startsWith('overview:')) ids.push('home', 'home_warning');
    else if (p === 'bright.*' || p.startsWith('stream:') || p.startsWith('alerts:')) ids.push('video_live', 'video_ai', 'video_replay', 'video_snapshot');
    else if (p === 'daily.*' || p.startsWith('food_safety:') || p.startsWith('training:') || p.startsWith('food_waste:')) ids.push('daily_morning','daily_sample','daily_disinfection','daily_environment','daily_residue','daily_waste','daily_device_safety');
    else if (p === 'inventory.*') ids.push('store_goods','store_in','store_out','store_stock','store_additives');
    else if (p === 'hr.*' || p.startsWith('credentials:')) ids.push('hr_staff','hr_license','hr_suppliers');
    else if (p === 'system.*' || p.startsWith('settings.')) ids.push('sys_canteen','sys_users','sys_roles','sys_mobile','sys_device');
    else if (p === 'users.manage') ids.push('sys_users','sys_roles');
  }
  return ids;
}
