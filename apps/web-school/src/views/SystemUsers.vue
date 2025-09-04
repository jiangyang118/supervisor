<template>
  <div class="system-users">
    <h1>用户与角色权限</h1>
    <div class="users-container">
      <!-- 用户列表将在这里显示 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';

const users = ref<any[]>([]);
const roles = ref<any[]>([]);
const userRoles = ref<Record<string, string[]>>({});

async function load() {
  users.value = await api.sysUsers();
  roles.value = await api.sysRoles();
  users.value.forEach(u => {
    userRoles.value[u.id] = [...(u.roles || [])];
  });
}

async function saveRoles(row: any) {
  await api.sysUserSetRoles(row.id, userRoles.value[row.id] || []);
  await load();
}

onMounted(load);
</script>

<style scoped>
.system-users {
  padding: 20px;
}

.users-container {
  margin-top: 20px;
}
</style>
