<template>
  <div class="login-wrap">
    <div class="brand">
      <div class="logo">🍽️</div>
      <div class="title">智慧食安</div>
      <div class="subtitle">食品安全智能监管云平台</div>
    </div>
    <el-card :class="['login-card', 'glass', isLightCard ? 'light' : 'dark']" shadow="always">
      <template #header>
        <div class="card-header">
          <div class="card-title">登录</div>
          <div class="theme-toggle">
            <el-switch
              v-model="isLightCard"
              
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
            placeholder="请输入用户名"
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
      <div class="hint">请使用分配的账号登录。如忘记密码，请联系管理员找回。</div>
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
  --bg1: #070a0f;
  --bg2: #0a1220;
  --glow1: rgba(0, 229, 255, 0.18);
  --glow2: rgba(122, 92, 255, 0.16);
  --text: #e9eef5;
  --muted: #9aa4b2;
  height: 100vh;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  align-items: center;
  justify-content: center;
  gap: clamp(12px, 2.2vw, 28px);
  padding: clamp(16px, 4vw, 40px);
  width: 100%;
  margin: 0;
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
  background: conic-gradient(from 0deg at 50% 50%, rgba(0, 229, 255, 0.08), rgba(122, 92, 255, 0.08), rgba(0, 229, 255, 0.08));
  background-size: 200% 200%;
  filter: blur(64px);
  animation: aurora 16s ease-in-out infinite;
  pointer-events: none;
}
.brand { align-self: stretch; padding: clamp(16px, 2.2vw, 28px); display:flex; flex-direction: column; align-items:flex-start; justify-content:center; gap: 12px; border-radius: 16px; backdrop-filter: blur(6px);
  
}
.glass.light .brand { background: linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.55)); border-color: rgba(0,0,0,0.06); box-shadow: 0 16px 48px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6); }
.brand .logo { font-size: clamp(56px, 5vw, 80px); line-height: 1; filter: drop-shadow(0 10px 28px rgba(0,229,255,.28)); }
.brand .title { font-size: clamp(28px, 2.8vw, 44px); font-weight: 800; letter-spacing: .5px; }
.brand .title { position: relative; }
.brand .title::after { content:''; position:absolute; left:0; bottom:-6px; width: 64px; height: 3px; border-radius: 99px; background: linear-gradient(90deg,#00e5ff,#7a5cff); box-shadow: 0 4px 12px rgba(0,229,255,.25); }
.brand .subtitle { color: var(--muted); font-size: clamp(13px, 1.2vw, 15px); }
.features { list-style: none; padding: 8px 0 0; margin: 0; display:flex; flex-direction: column; gap: 8px; color: var(--text); opacity: .9; }
.features li { display:flex; align-items:center; gap: 10px; font-size: 14px; }
.features .dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(90deg,#00e5ff,#7a5cff); box-shadow: 0 0 8px rgba(0,229,255,.5), 0 0 0 3px rgba(0,229,255,0.12); display:inline-block; animation: pulse 2.6s ease-in-out infinite; }
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
.login-card { width: clamp(420px, 32vw, 560px); margin: 0; border-radius: 14px; overflow: hidden; align-self: center; }
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
  background: linear-gradient(120deg, rgba(0,229,255,0.6), rgba(122,92,255,0.5));
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1px;
  opacity: .5;
  animation: borderFlow 8s linear infinite;
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
.card-title { font-weight: 700; font-size: 22px; letter-spacing: .5px; }
.theme-toggle { display: flex; align-items: center; gap: 6px; }
.card-subtitle {
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}
.submit-btn { width: 100%; }
.grad {
  background-image: linear-gradient(90deg, #00e5ff, #7a5cff);
  border: none;
  box-shadow: 0 8px 22px rgba(0,229,255,0.28), 0 0 0 1px rgba(122,92,255,0.25) inset;
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

/* Tech animations */
@keyframes aurora { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes borderFlow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
@keyframes pulse { 0%,100% { transform: scale(1); opacity: .95; } 50% { transform: scale(1.15); opacity: 1; } }

@media (max-width: 920px) {
  .login-wrap {
    grid-template-columns: 1fr;
    padding: 12px;
    width: 100%;
  }
  .brand { display: none; }
  .login-card { width: 92vw; max-width: 520px; margin: 0 auto; }
}

@media (min-width: 1280px) { .login-card { width: 520px; } }

/* Tablet/Laptop: 921–1279px — 两栏等分，品牌区略收紧 */
@media (min-width: 921px) and (max-width: 1279px) {
  .login-wrap { grid-template-columns: 1.15fr 0.85fr; padding: 18px; gap: 20px; width: 100%; }
  .brand .logo { font-size: 60px; }
  .brand .title { font-size: 32px; }
  .brand .subtitle { font-size: 12px; }
}

/* Desktop: 1280–1439px — 稍加扩展，品牌区适中留白 */
@media (min-width: 1280px) and (max-width: 1439px) {
  .login-wrap { grid-template-columns: 1.2fr 0.8fr; padding: 22px; gap: 22px; width: 100%; }
  .brand .logo { font-size: 72px; }
  .brand .title { font-size: 36px; }
  .brand .subtitle { font-size: 13px; }
}

/* Large Desktop: 1440–1919px — 与驾驶舱风格对齐，增强品牌视觉 */
@media (min-width: 1440px) and (max-width: 1919px) {
  .login-wrap { grid-template-columns: 1.25fr 0.75fr; padding: 24px; gap: 24px; width: 100%; }
  .brand .logo { font-size: 76px; }
  .brand .title { font-size: 40px; }
  .brand .subtitle { font-size: 14px; }
}

/* Ultra-wide: ≥1920px — 增加留白与品牌尺寸，卡片保持 560px 聚焦 */
@media (min-width: 1920px) {
  .login-wrap { grid-template-columns: 1.35fr 0.65fr; padding: 28px; gap: 28px; width: 100%; }
  .brand .logo { font-size: 80px; }
  .brand .title { font-size: 44px; }
  .brand .subtitle { font-size: 15px; }
}
</style>
