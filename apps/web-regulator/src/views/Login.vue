<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2>监管端登录</h2>
      <el-form :model="form" @keyup.enter="onSubmit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="admin 或 user" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="同用户名" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSubmit">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="tip">内置账号：super/super123（平台超管，不对客户开放）；admin/admin123；jiaowu/jiaowu123。可在 DB_SEED 环境下自动创建；建议上线后修改密码。</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore();
const router = useRouter();
const form = reactive({ username: 'admin', password: 'admin' });
const loading = ref(false);
async function onSubmit() {
  loading.value = true;
  try {
    await auth.login(form.username, form.password);
    router.replace(auth.returnTo || '/overview');
  } catch (e: any) {
    (window as any).ElMessage?.error(e?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
.login-card { width: 360px; }
.tip { color: #999; margin-top: 8px; font-size: 12px; }
</style>
