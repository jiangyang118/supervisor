<template>
  <div class="login-wrap">
    <div class="brand">
      <div class="logo">🍽️</div>
      <div class="title">智慧食安监管 · 学校端</div>
      <div class="subtitle">深色科技风 · 智慧食安驾驶舱同款风格</div>
    </div>
    <el-card :class="['login-card', 'glass', isLightCard ? 'light' : 'dark']" shadow="always">
      <template #header>
        <div class="card-header">
          <div class="card-title">登录</div>
          <div class="theme-toggle">
            <el-switch
              v-model="isLightCard"
              size="small"
              inline-prompt
              :active-icon="Sunny"
              :inactive-icon="Moon"
              active-text="浅色"
              inactive-text="深色"
            />
          </div>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="0"
       
        autocomplete="on"
        @keyup.enter.native="onSubmit"
      >
        <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon class="err-banner" />
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名（admin 或 user）"
            clearable
            autofocus
            autocomplete="username"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            show-password
            autocomplete="current-password"
            @keyup="onKeyupPassword"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
          <div v-if="capsLockOn" class="caps-tip">已开启大写锁定（Caps Lock）</div>
        </el-form-item>
        <el-form-item>
          <div class="options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-checkbox v-model="autoLogin">自动登录</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="submit-btn grad" :loading="loading" :disabled="!form.username || !form.password" @click="onSubmit">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="hint">演示账号：admin/admin 或 user/user</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { User, Lock, Sunny, Moon } from '@element-plus/icons-vue';

const router = useRouter();
const auth = useAuthStore();
const form = ref({ username: '', password: '' });
const loading = ref(false);
const errorMsg = ref('');
const capsLockOn = ref(false);
const rememberMe = ref<boolean>(localStorage.getItem('REMEMBER_ME') !== '0');
const autoLogin = ref<boolean>(localStorage.getItem('AUTO_LOGIN') === '1');
const isLightCard = ref<boolean>(localStorage.getItem('LOGIN_CARD_THEME') !== 'dark');
const formRef = ref<FormInstance>();
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function onSubmit() {
  try {
    if (formRef.value) {
      const valid = await formRef.value.validate().catch(() => false);
      if (!valid) return;
    }
    loading.value = true;
    errorMsg.value = '';
    await auth.login(form.value.username.trim(), form.value.password);
    // persistence settings
    localStorage.setItem('LAST_USERNAME', form.value.username.trim());
    localStorage.setItem('REMEMBER_ME', rememberMe.value ? '1' : '0');
    if (autoLogin.value) localStorage.setItem('AUTO_LOGIN', '1'); else localStorage.removeItem('AUTO_LOGIN');
    if (!rememberMe.value) {
      // move token to session only
      const t = localStorage.getItem('AUTH_TOKEN');
      const u = localStorage.getItem('AUTH_USER');
      if (t) sessionStorage.setItem('AUTH_TOKEN', t);
      if (u) sessionStorage.setItem('AUTH_USER', u);
      localStorage.removeItem('AUTH_TOKEN');
      localStorage.removeItem('AUTH_USER');
    }
    ElMessage.success('登录成功');
    // 始终跳转首页（概览）
    auth.setReturnTo('');
    router.replace('/');
  } catch (e: any) {
    const msg = e?.message || '登录失败';
    errorMsg.value = msg;
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
}

function onKeyupPassword(ev: KeyboardEvent) {
  try {
    // Detect Caps Lock state for feedback
    capsLockOn.value = !!ev.getModifierState && ev.getModifierState('CapsLock');
  } catch {
    capsLockOn.value = false;
  }
}

onMounted(() => {
  const last = localStorage.getItem('LAST_USERNAME');
  if (last) form.value.username = last;
  if (!localStorage.getItem('LOGIN_CARD_THEME')) {
    try { isLightCard.value = !(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); } catch {}
  }
  // auto-login: if enabled and token/user exist, hydrate store and redirect
  const token = localStorage.getItem('AUTH_TOKEN') || sessionStorage.getItem('AUTH_TOKEN');
  const userJson = localStorage.getItem('AUTH_USER') || sessionStorage.getItem('AUTH_USER');
  if (autoLogin.value && token && userJson) {
    try {
      const user = JSON.parse(userJson);
      auth.token = token as any;
      auth.user = user as any;
      router.replace('/');
    } catch {}
  }
});

watch(isLightCard, (v) => localStorage.setItem('LOGIN_CARD_THEME', v ? 'light' : 'dark'));
</script>

<style scoped>
.login-wrap {
  --bg1: #0b0f14;
  --bg2: #0f1620;
  --glow1: rgba(64, 158, 255, 0.18);
  --glow2: rgba(54, 207, 201, 0.16);
  --text: #e9eef5;
  --muted: #9aa4b2;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  padding: 24px;
  color: var(--text);
  background:
    radial-gradient(1200px 800px at 8% 10%, var(--glow1), transparent 60%),
    radial-gradient(1200px 800px at 92% 20%, var(--glow2), transparent 60%),
    linear-gradient(180deg, var(--bg1) 0%, var(--bg2) 100%);
  position: relative;
  overflow: hidden;
}
.login-wrap::before {
  content: '';
  position: absolute;
  inset: -200px;
  background: radial-gradient(closest-side, rgba(0, 200, 255, 0.08), transparent 60%);
  filter: blur(60px);
  transform: translate3d(-20%, -30%, 0);
  pointer-events: none;
}
.brand {
  padding-left: 8vw;
}
.logo {
  font-size: 56px;
  line-height: 1;
}
.title {
  font-size: 32px;
  font-weight: 700;
  margin-top: 12px;
  color: var(--text);
}
.subtitle {
  color: var(--muted);
  margin-top: 6px;
}
.login-card { width: clamp(420px, 38vw, 560px); margin: 0 auto; }
.glass {
  background: rgba(20, 24, 30, 0.6);
  backdrop-filter: saturate(140%) blur(14px);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 60px rgba(0,0,0,0.55);
}
.glass.light {
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  color: #303133;
}
.glass::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(120deg, rgba(64,158,255,0.5), rgba(54,207,201,0.4));
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1px;
  opacity: .6;
}
.glass.light::after { opacity: .15; }
.dark :deep(.el-card__header) { background: transparent; border-bottom-color: rgba(255,255,255,0.08); }
.dark :deep(.el-card__body) { color: var(--text); }
.light :deep(.el-card__header) { background: transparent; border-bottom-color: rgba(0,0,0,0.06); }
.light :deep(.el-card__body) { color: #303133; }
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title { font-weight: 700; font-size: 18px; letter-spacing: .5px; }
.theme-toggle { display: flex; align-items: center; gap: 6px; }
.card-subtitle {
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}
.submit-btn { width: 100%; }
.grad {
  background-image: linear-gradient(90deg, #409EFF, #36cfc9);
  border: none;
  box-shadow: 0 8px 20px rgba(64,158,255,0.3), 0 0 0 1px rgba(64,158,255,0.2) inset;
}
.grad:hover { filter: brightness(1.05); }
.hint { color: var(--muted); font-size: 12px; text-align: center; }
.err-banner { margin-bottom: 8px; }
.caps-tip { color: #f56c6c; font-size: 12px; margin-top: 4px; }

/* Input styles */
.dark :deep(.el-input__wrapper) {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: none;
}
.dark :deep(.el-input.is-focus .el-input__wrapper),
.dark :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(64,158,255,0.6) !important;
  box-shadow: 0 0 0 3px rgba(64,158,255,0.15) !important;
}
.dark :deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: rgba(245, 108, 108, 0.9) !important;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.15) !important;
}
.dark :deep(.el-input__inner), .dark :deep(.el-input__inner::placeholder) { color: var(--text); opacity: .9; }
.dark :deep(.el-input__inner::placeholder) { opacity: .5; }
.dark :deep(.el-icon) { color: #9ecbff; }

.light :deep(.el-input__wrapper) {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.12);
  box-shadow: none;
}
.light :deep(.el-input.is-focus .el-input__wrapper),
.light :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(64,158,255,0.9) !important;
  box-shadow: 0 0 0 3px rgba(64,158,255,0.18) !important;
}
.light :deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: rgba(245, 108, 108, 0.9) !important;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.15) !important;
}
.light :deep(.el-icon) { color: #409eff; }
.options { display: flex; justify-content: space-between; width: 100%; color: var(--muted); }

/* Tech grid lines overlay */
.login-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,0.03),
      rgba(255,255,255,0.03) 1px,
      transparent 1px,
      transparent 40px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.03),
      rgba(255,255,255,0.03) 1px,
      transparent 1px,
      transparent 40px
    );
  pointer-events: none;
}

@media (max-width: 920px) {
  .login-wrap {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  .brand { display: none; }
  .login-card { width: 92vw; max-width: 560px; }
}

@media (min-width: 1280px) {
  .login-card { width: 560px; }
}

/* Tablet/Laptop: 921–1279px — 两栏等分，品牌区略收紧 */
@media (min-width: 921px) and (max-width: 1279px) {
  .login-wrap { grid-template-columns: 1fr 1fr; padding: 20px; }
  .brand { padding-left: 6vw; }
  .logo { font-size: 48px; }
  .title { font-size: 28px; }
  .subtitle { font-size: 12px; }
}

/* Desktop: 1280–1439px — 稍加扩展，品牌区适中留白 */
@media (min-width: 1280px) and (max-width: 1439px) {
  .login-wrap { grid-template-columns: 1.1fr 1fr; padding: 24px; }
  .brand { padding-left: 10vw; }
  .logo { font-size: 64px; }
  .title { font-size: 36px; }
  .subtitle { font-size: 13px; }
}

/* Large Desktop: 1440–1919px — 与驾驶舱风格对齐，增强品牌视觉 */
@media (min-width: 1440px) and (max-width: 1919px) {
  .login-wrap { grid-template-columns: 1.2fr 1fr; padding: 28px; }
  .brand { padding-left: 12vw; }
  .logo { font-size: 72px; }
  .title { font-size: 40px; }
  .subtitle { font-size: 14px; }
}

/* Ultra-wide: ≥1920px — 增加留白与品牌尺寸，卡片保持 560px 聚焦 */
@media (min-width: 1920px) {
  .login-wrap { grid-template-columns: 1.4fr 1fr; padding: 36px; }
  .brand { padding-left: 14vw; }
  .logo { font-size: 80px; }
  .title { font-size: 44px; }
  .subtitle { font-size: 15px; }
}
</style>
