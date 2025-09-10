<template>
  <el-card>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">食堂资质详情</h3>
      <div>
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <el-divider content-position="left">食堂基本信息</el-divider>
    <el-form label-width="150px" class="readonly-form" label-position="left">
      <el-form-item label="食堂名称"><span class="val">{{ canteen?.name || nameParam }}</span></el-form-item>
      <el-form-item label="地址"><span class="val">{{ canteen?.address || '-' }}</span></el-form-item>
      <el-form-item label="负责人"><span class="val">{{ canteen?.manager || '-' }}</span></el-form-item>
      <el-form-item label="联系电话"><span class="val">{{ canteen?.phone || '-' }}</span></el-form-item>
    </el-form>

    <el-divider content-position="left">营业执照</el-divider>
    <el-form label-width="150px" class="readonly-form" label-position="left">
      <el-form-item label="编号"><span class="val">{{ biz?.number || '-' }}</span></el-form-item>
      <el-form-item label="发照机关"><span class="val">{{ biz?.authority || '-' }}</span></el-form-item>
      <el-form-item label="有效期至"><span class="val">{{ (biz?.expireAt||'').slice(0,10) || '-' }}</span></el-form-item>
      <el-form-item label="证照图片">
        <el-image v-if="biz?.imageUrl" :src="normalizeUrl(biz?.imageUrl)" :preview-src-list="[normalizeUrl(biz?.imageUrl)]" fit="contain" style="width: 160px; height: 120px" />
        <span v-else>-</span>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">食品经营许可证</el-divider>
    <el-form label-width="150px" class="readonly-form" label-position="left">
      <el-form-item label="编号"><span class="val">{{ food?.number || '-' }}</span></el-form-item>
      <el-form-item label="发证机关"><span class="val">{{ food?.authority || '-' }}</span></el-form-item>
      <el-form-item label="许可项目"><span class="val">{{ food?.permitItems || '-' }}</span></el-form-item>
      <el-form-item label="有效期至"><span class="val">{{ (food?.expireAt||'').slice(0,10) || '-' }}</span></el-form-item>
      <el-form-item label="证照图片">
        <el-image v-if="food?.imageUrl" :src="normalizeUrl(food?.imageUrl)" :preview-src-list="[normalizeUrl(food?.imageUrl)]" fit="contain" style="width: 160px; height: 120px" />
        <span v-else>-</span>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, API_BASE } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';

const route = useRoute();
const router = useRouter();
const idParam = route.query.id ? Number(route.query.id) : undefined;
const nameParam = String(route.query.name || '');
const canteen = ref<any>(null);
const biz = ref<any>(null);
const food = ref<any>(null);
function normalizeUrl(u?: string) {
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('/api/')) return u;
  if (u.startsWith('/')) return `${API_BASE}${u}`;
  return u;
}

async function load() {
  const sid = getCurrentSchoolId();
  if (!idParam) return;
  const data = await api.canteenDetail(idParam, sid);
  canteen.value = data?.canteen || null;
  biz.value = data?.licenses?.biz || null;
  food.value = data?.licenses?.food || null;
}

function goBack() { router.back(); }

onMounted(load);
</script>

<style scoped>
.readonly-form :deep(.el-form-item__content) { display: flex; align-items: center; min-height: 32px; }
.readonly-form .val { display: inline-block; line-height: 1.6; white-space: pre-line; }
</style>
