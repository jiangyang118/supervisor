<template>
  <div class="trustivs-test">
    <h2>TrustIVS 接口测试</h2>
    <div class="box">
      <h3>1) 全局设置</h3>
      <label>Token（可选，若网关已配置可留空）</label>
      <input v-model="token" placeholder="token" />
      <button @click="saveToken">保存 Token</button>
    </div>

    <div class="box">
      <h3>2) 取流地址 getStreamURL</h3>
      <label>序列号 serial</label>
      <input v-model="serial" />
      <label>通道编码 code</label>
      <input v-model="code" />
      <label>类型 type</label>
      <select v-model="streamType"><option value="hls">hls</option><option value="flv">flv</option></select>
      <button @click="onGetStream">测试取流</button>
      <div style="margin-top:8px">
        <label>播放地址（自动或手动粘贴）</label>
        <input v-model="playUrl" placeholder="如返回的 .m3u8 或 .flv 地址" />
        <button @click="autoPickUrl">从结果中取URL</button>
        <button @click="play">播放</button>
      </div>
      <video ref="videoEl" controls style="width: 640px; height: 360px; background:#000; margin-top:8px;"></video>
      <pre>{{ streamResult }}</pre>
    </div>

    <div class="box">
      <h3>3) 回放地址 getBackUrl / getDownloadUrl</h3>
      <label>开始时间 starttime (YYYY-MM-DD HH:mm:ss)</label>
      <input v-model="starttime" />
      <label>结束时间 endtime</label>
      <input v-model="endtime" />
      <button @click="onGetBackUrl">getBackUrl</button>
      <button @click="onGetDownloadUrl">getDownloadUrl</button>
      <pre>{{ playbackResult }}</pre>
    </div>

    <div class="box">
      <h3>4) 公司/设备/通道/摄像头 列表</h3>
      <label>社会信用代码 fsocialcreditcode（可选）</label>
      <input v-model="fsocialcreditcode" />
      <label>设备ID deviceId（可选）</label>
      <input v-model="deviceId" />
      <button @click="onGetCompanyList">公司列表</button>
      <button @click="onGetDeviceList">公司设备</button>
      <button @click="onGetCameraByCompany">摄像头</button>
      <button @click="onGetChannelByDevice">通道</button>
      <pre>{{ listResult }}</pre>
    </div>

    <div class="box">
      <h3>5) AI 抓拍 getAIRecordByCompany</h3>
      <label>开始时间 startTime</label>
      <input v-model="aiStart" />
      <label>结束时间 endTime</label>
      <input v-model="aiEnd" />
      <button @click="onGetAIRecords">查询抓拍</button>
      <pre>{{ aiResult }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { trustivsApi } from '../services/api';

const token = ref(localStorage.getItem('TRUSTIVS_TOKEN') || '');
const serial = ref('');
const code = ref('');
const streamType = ref('hls');
const streamResult = ref('');
const playUrl = ref('');
const starttime = ref('');
const endtime = ref('');
const playbackResult = ref('');
const fsocialcreditcode = ref('');
const deviceId = ref('');
const listResult = ref('');
const aiStart = ref('');
const aiEnd = ref('');
const aiResult = ref('');

function saveToken() {
  trustivsApi.setToken(token.value);
  alert('Token 已保存到浏览器');
}

async function onGetStream() {
  streamResult.value = 'loading...';
  try {
    const data = await trustivsApi.post<any>('/gatewayGBS/openApi/getStreamURL', { serial: serial.value, code: code.value, type: streamType.value });
    streamResult.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    streamResult.value = String(e?.message || e);
  }
}

async function onGetBackUrl() {
  playbackResult.value = 'loading...';
  try {
    const data = await trustivsApi.get<any>('/gatewayGBS/openApi/getBackUrl', { serial: serial.value, code: code.value, starttime: starttime.value, endtime: endtime.value });
    playbackResult.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    playbackResult.value = String(e?.message || e);
  }
}
async function onGetDownloadUrl() {
  playbackResult.value = 'loading...';
  try {
    const data = await trustivsApi.get<any>('/gatewayGBS/openApi/getDownloadUrl', { serial: serial.value, code: code.value, starttime: starttime.value, endtime: endtime.value });
    playbackResult.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    playbackResult.value = String(e?.message || e);
  }
}

async function onGetCompanyList() {
  listResult.value = 'loading...';
  try {
    const data = await trustivsApi.post<any>('/gatewayGBS/openApi/getCompanyList', { pageNum: 1, pageSize: 10, fsocialcreditcode: fsocialcreditcode.value });
    listResult.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    listResult.value = String(e?.message || e);
  }
}
async function onGetDeviceList() {
  listResult.value = 'loading...';
  try {
    const data = await trustivsApi.post<any>('/gatewayGBS/openApi/getDeviceListByCompany', { pageNum: 1, pageSize: 10, fsocialcreditcode: fsocialcreditcode.value });
    listResult.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    listResult.value = String(e?.message || e);
  }
}
async function onGetCameraByCompany() {
  listResult.value = 'loading...';
  try {
    const qs = new URLSearchParams({ pageNum: '1', pageSize: '10' }).toString();
    const data = await trustivsApi.get<any>(`/gatewayGBS/openApi/getCameraByCompany?${qs}`);
    listResult.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    listResult.value = String(e?.message || e);
  }
}
async function onGetChannelByDevice() {
  listResult.value = 'loading...';
  try {
    const data = await trustivsApi.post<any>('/gatewayGBS/openApi/getChannelByDevice', { deviceId: deviceId.value });
    listResult.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    listResult.value = String(e?.message || e);
  }
}

async function onGetAIRecords() {
  aiResult.value = 'loading...';
  try {
    const data = await trustivsApi.post<any>('/gatewayGBS/openApi/getAIRecordByCompany', { pageNum: 1, pageSize: 10, fsocialcreditcode: fsocialcreditcode.value, startTime: aiStart.value, endTime: aiEnd.value });
    aiResult.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    aiResult.value = String(e?.message || e);
  }
}


function autoPickUrl() {
  try {
    const obj = JSON.parse(streamResult.value || '{}');
    const d = (obj as any)?.data || (obj as any);
    const candidates = [d?.hls, d?.m3u8, d?.flv, d?.ws_flv, d?.rtmp, d?.webrtc];
    const url = candidates.find((x: any) => typeof x === 'string' && x.length > 5);
    if (url) playUrl.value = url;
    else alert('未找到可用URL，请手动粘贴');
  } catch {
    alert('结果不是有效JSON');
  }
}

const videoEl = ref<HTMLVideoElement | null>(null);
let hlsInst: any = null;
let flvPlayer: any = null;
let isPlaying = false;
function stopPlayback() {
  try { if (hlsInst && hlsInst.destroy) { hlsInst.destroy(); } } catch (e) {}
  try { if (flvPlayer && flvPlayer.destroy) { flvPlayer.destroy(); } } catch (e) {}
  hlsInst = null;
  flvPlayer = null;
}
// Prefer bundler-based dynamic imports over CDN scripts
async function play() {
  if (isPlaying) { try { stopPlayback(); } catch (e) {} }
  isPlaying = true;
  const useProxy = true; // always proxy to avoid CORS
  const url = playUrl.value || '';
  const src = useProxy ? `/trustivs/proxy/hls?url=${encodeURIComponent(url)}` : url;
  const video = videoEl.value!;
  if (!url || !video) return;
  try {
    video.pause();
    video.src = '';
    if (/\.m3u8($|\?)/i.test(url) || /m3u8/i.test(url)) {
      let Hls: any = (window as any).Hls;
      let HlsEvents: any = Hls?.Events;
      if (!(Hls && Hls.isSupported && Hls.isSupported())) {
        try {
          const mod: any = await import('hls.js');
          Hls = mod.default;
          HlsEvents = mod.Events || Hls?.Events;
          (window as any).Hls = Hls;
        } catch (e) {
          console.warn('Dynamic import of hls.js failed', e);
        }
      }
      if (Hls && Hls.isSupported && Hls.isSupported()) {
        const h = new Hls();
        hlsInst = h;
        h.loadSource(src);
        h.attachMedia(video);
        const Events = HlsEvents || (Hls && Hls.Events);
        if (Events && Events.ERROR) {
          h.on(Events.ERROR, (_e: any, data: any) => { console.error('HLS error', data); });
        }
        if (Events && Events.MANIFEST_PARSED) {
          h.on(Events.MANIFEST_PARSED, () => video.play());
        } else {
          // As a fallback, try to play after a short delay
          setTimeout(() => video.play(), 0);
        }
      } else {
        // Fallback to native HLS (Safari/iOS)
        video.src = src;
        await video.play();
      }
      return;
    }
    if (/\.flv($|\?)/i.test(url) || /flv/i.test(url)) {
      let flvjs: any = (window as any).flvjs;
      if (!(flvjs && flvjs.isSupported && flvjs.isSupported())) {
        try {
          flvjs = (await import('flv.js')).default;
          (window as any).flvjs = flvjs;
        } catch (e) {
          console.warn('Dynamic import of flv.js failed', e);
        }
      }
      if (flvjs && flvjs.isSupported && flvjs.isSupported()) {
        const player = flvjs.createPlayer({ type: 'flv', url: src });
        flvPlayer = player;
        player.attachMediaElement(video);
        player.load();
        player.play();
      } else {
        alert('FLV 未启用：请安装 flv.js 或改用 HLS');
      }
      return;
    }
    video.src = src;
    await video.play();
  } catch (e: any) {
    alert('播放失败：' + (e?.message || e));
  }
}

</script>

<style scoped>
.trustivs-test { padding: 16px; }
.box { border: 1px solid #ddd; padding: 12px; margin: 12px 0; }
label { display: block; margin: 6px 0 2px; }
input, select { width: 320px; padding: 6px; margin-bottom: 8px; }
button { margin-right: 8px; }
pre { background: #f7f7f7; padding: 8px; white-space: pre-wrap; }
</style>
