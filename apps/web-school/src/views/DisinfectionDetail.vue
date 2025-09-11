<template>
  <el-card>
    <template #header>消毒记录详情</template>
    <el-descriptions :column="2" border >
      <el-descriptions-item label="记录编号">{{ detail?.id }}</el-descriptions-item>
      <el-descriptions-item label="消毒日期">{{ (detail?.at||'').slice(0,10) }}</el-descriptions-item>
      <el-descriptions-item label="食堂">{{ canteenName(detail?.canteenId) }}</el-descriptions-item>
      <el-descriptions-item label="责任人">{{ detail?.responsible || '-' }}</el-descriptions-item>
      <el-descriptions-item label="消毒方式">{{ detail?.method }}</el-descriptions-item>
      <el-descriptions-item label="消毒区域/物品">{{ detail?.items }}</el-descriptions-item>
      <el-descriptions-item label="时长(分钟)">{{ detail?.duration }}</el-descriptions-item>
      <el-descriptions-item label="温度(℃)">{{ detail?.temperature ?? '-' }}</el-descriptions-item>
      <el-descriptions-item label="是否达标">
        <el-tag :type="detail?.exception ? 'danger' : 'success'" effect="plain">{{ detail?.exception ? '未达标' : '达标' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="异常原因">{{ detail?.exceptionReason || '-' }}</el-descriptions-item>
      <el-descriptions-item label="处理措施" :span="2">{{ detail?.measure || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <div v-if="detail?.imageUrl">
      <el-image :src="detail.imageUrl" fit="contain" style="width: 360px; height: 240px" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../services/api';
import { getCurrentSchoolId } from '../utils/school';
import { ElMessage } from 'element-plus';
const route = useRoute();
const id = String(route.query.id || route.params.id || '');
const canteens = ref<any[]>([]);
const detail = ref<any>(null);
function canteenName(id?: number) { return canteens.value.find((c:any)=> Number(c.id)===Number(id))?.name || '-'; }
onMounted(async () => {
  try {
    canteens.value = await api.canteensList(getCurrentSchoolId() as any);
  } catch { canteens.value = []; }
  try {
    detail.value = await api.disinfectionDetail(id);
  } catch { ElMessage.error('加载详情失败'); }
});
</script>

<style scoped></style>

