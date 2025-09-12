<template>
  <div class="action-cell">
    <template v-for="(a, i) in inlineActions" :key="i">
      <el-popconfirm v-if="a.confirm" :title="a.confirm" @confirm="() => a.onClick && a.onClick()">
        <template #reference>
          <el-button
            text
            :type="a.type || (a.danger ? 'danger' : undefined)"
            :class="['op-action', a.danger ? 'op-danger' : '']"
          >{{ a.label }}</el-button>
        </template>
      </el-popconfirm>
      <el-button
        v-else
        text
        :type="a.type || (a.danger ? 'danger' : undefined)"
        :class="['op-action', a.danger ? 'op-danger' : '']"
        @click="a.onClick && a.onClick()"
      >
        {{ a.label }}
      </el-button>
    </template>

    <el-popover v-if="moreActions.length" placement="bottom" trigger="hover">
      <template #reference>
        <el-button text>更多</el-button>
      </template>
      <div class="more-actions">
        <template v-for="(a, i) in moreActions" :key="'m'+i">
          <el-popconfirm v-if="a.confirm" :title="a.confirm" @confirm="() => a.onClick && a.onClick()">
            <template #reference>
              <el-button
                text
                :type="a.type || (a.danger ? 'danger' : undefined)"
                :class="['op-action', a.danger ? 'op-danger' : '']"
              >{{ a.label }}</el-button>
            </template>
          </el-popconfirm>
          <el-button
            v-else
            text
            :type="a.type || (a.danger ? 'danger' : undefined)"
            :class="['op-action', a.danger ? 'op-danger' : '']"
            @click="a.onClick && a.onClick()"
          >
            {{ a.label }}
          </el-button>
        </template>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type ActionItem = {
  label: string;
  onClick?: () => void;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  danger?: boolean;
  confirm?: string;
};

const props = withDefaults(defineProps<{ actions: ActionItem[]; inline?: number }>(), { inline: 2 });

const inlineActions = computed(() => (props.actions || []).slice(0, Math.max(0, props.inline || 0)));
const moreActions = computed(() => (props.actions || []).slice(Math.max(0, props.inline || 0)));
</script>

<style scoped>
.action-cell { display: inline-flex; gap: 4px; align-items: center; }
.more-actions { display: flex; gap: 6px; align-items: center; }
</style>
