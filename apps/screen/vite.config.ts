import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createRequire } from 'node:module'

// Try to use official plugin if present; otherwise fall back to a lightweight inline PostCSS plugin.
function resolvePxToViewport(viewportWidth = 1920) {
  try {
    const require = createRequire(import.meta.url);
    const real = require('postcss-px-to-viewport');
    return real({
      unitToConvert: 'px',
      viewportWidth,
      unitPrecision: 5,
      propList: ['*'],
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      selectorBlackList: ['.ignore-vw', '.hairline'],
      minPixelValue: 2,
      mediaQuery: true,
      replace: true,
      exclude: [/node_modules/],
      landscape: false,
    });
  } catch {
    // Fallback: minimal PostCSS plugin to convert px → vw
    const minPixelValue = 2;
    const selectorBlackList = ['.ignore-vw', '.hairline'];
    return {
      postcssPlugin: 'inline-px-to-viewport',
      Declaration(decl: any) {
        const sel = decl?.parent?.selector || '';
        if (selectorBlackList.some((blk) => sel.includes(blk))) return;
        if (!/px/.test(decl.value)) return;
        // Skip url() and already responsive units
        if (/url\(/i.test(decl.value)) return;
        const replaced = decl.value.replace(/(\d*\.?\d+)px/g, (_: string, raw: string) => {
          const px = parseFloat(raw);
          if (!isFinite(px) || px < minPixelValue) return `${raw}px`;
          const vw = (px / viewportWidth) * 100;
          return `${parseFloat(vw.toFixed(5))}vw`;
        });
        decl.value = replaced;
      },
    };
  }
}

export default defineConfig(({ mode }) => {
  const vw = Number(process.env.VITE_VIEWPORT_WIDTH || 1920);
  return {
    plugins: [vue()],
    css: { postcss: { plugins: [resolvePxToViewport(vw)] } },
    server: { host: true, port: 5208 },
    build: { target: 'es2020' },
  };
})
