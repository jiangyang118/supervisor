<template>
  <el-card>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">人员资质详情</h3>
      <div>
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <el-divider content-position="left">基本信息</el-divider>
    <el-form label-width="150px" class="readonly-form" label-position="left">
      <el-form-item label="姓名"><span class="val">{{ p?.name || '-' }}</span></el-form-item>
      <el-form-item label="性别"><span class="val">{{ p?.gender || '-' }}</span></el-form-item>
      <el-form-item label="手机号"><span class="val">{{ p?.phone || '-' }}</span></el-form-item>
      <el-form-item label="所属食堂"><span class="val">{{ p?.canteenName || '-' }}</span></el-form-item>
      <el-form-item label="岗位"><span class="val">{{ p?.jobTitle || '-' }}</span></el-form-item>
    </el-form>

    <el-divider content-position="left">健康证</el-divider>
    <el-form label-width="150px" class="readonly-form" label-position="left">
      <el-form-item label="健康证编号"><span class="val">{{ p?.healthCertNo || '-' }}</span></el-form-item>
      <el-form-item label="发证机构"><span class="val">{{ p?.healthCertAuthority || '-' }}</span></el-form-item>
      <el-form-item label="发证日期"><span class="val">{{ (p?.healthCertIssueAt||'').slice(0,10) || '-' }}</span></el-form-item>
      <el-form-item label="有效期至"><span class="val">{{ (p?.healthCertExpireAt||'').slice(0,10) || '-' }}</span></el-form-item>
      <el-form-item label="状态">
        <el-tag :type="statusType" effect="plain">{{ statusText }}</el-tag>
      </el-form-item>
      <el-form-item label="证件图片">
        <div style="display:flex;gap:12px;align-items:center">
          <el-image v-if="normalized(p?.healthCertFrontUrl)" :src="normalized(p?.healthCertFrontUrl)" :preview-src-list="[normalized(p?.healthCertFrontUrl)]" fit="contain" style="width: 160px; height: 120px" />
          <el-image v-if="normalized(p?.healthCertBackUrl)" :src="normalized(p?.healthCertBackUrl)" :preview-src-list="[normalized(p?.healthCertBackUrl)]" fit="contain" style="width: 160px; height: 120px" />
          <span v-if="!normalized(p?.healthCertFrontUrl) && !normalized(p?.healthCertBackUrl)">-</span>
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, API_BASE } from '../services/api';

const route = useRoute();
const router = useRouter();
const idParam = route.query.id ? Number(route.query.id) : undefined;
const p = ref<any>(null);

function normalized(u?: string) {
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('/api/')) return u;
  if (u.startsWith('/')) return `${API_BASE}${u}`;
  return u;
}

const statusText = computed(() => {
  const exp = p.value?.healthCertExpireAt ? Date.parse(p.value.healthCertExpireAt) : NaN;
  if (!Number.isFinite(exp)) return '有效';
  const now = Date.now();
  if (exp < now) return '过期';
  if (exp <= now + 30*24*3600*1000) return '临期';
  return '有效';
});
const statusType = computed(() => statusText.value === '过期' ? 'danger' : (statusText.value === '临期' ? 'warning' : 'success'));

async function load() {
  if (!idParam) return;
  p.value = await api.personnelDetail(idParam);
}
function goBack() { router.back(); }

onMounted(load);
</script>

<style scoped>
.readonly-form :deep(.el-form-item__content) { display: flex; align-items: center; min-height: 32px; }
.readonly-form .val { display: inline-block; line-height: 1.6; white-space: pre-line; }
</style>

