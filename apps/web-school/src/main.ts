import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/theme.css';
import App from './App.vue';
import router from './router';

async function bootstrap() {
  try {
    // Load integration config from public file, allow localStorage override
    const res = await fetch('/integration.config.json');
    if (res.ok) {
      const cfg = await res.json();
      const lsBase = localStorage.getItem('SCHOOL_INTEGRATION_BASE');
      const lsCand = localStorage.getItem('MEGO_CANDIDATES');
      (window as any).SCHOOL_INTEGRATION_BASE = lsBase || cfg.SCHOOL_INTEGRATION_BASE || (window as any).SCHOOL_INTEGRATION_BASE;
      (window as any).MEGO_CANDIDATES = lsCand || cfg.MEGO_CANDIDATES || (window as any).MEGO_CANDIDATES;
      (window as any).__integration = {
        base: (window as any).SCHOOL_INTEGRATION_BASE,
        candidates: (window as any).MEGO_CANDIDATES,
        equipmentCode: cfg.EQUIPMENT_CODE,
      };
    }
  } catch (e) {
    // ignore; UI will show banner to configure
  }
  createApp(App).use(createPinia()).use(router).use(ElementPlus).mount('#app');
}

bootstrap();
