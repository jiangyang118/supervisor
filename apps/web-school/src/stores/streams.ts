import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { streamsApi, type CameraDTO, type PlaySourceDTO } from '../api/streams';

export const useStreamsStore = defineStore('streams', () => {
  const cameras = ref<CameraDTO[]>([]);
  const query = ref('');
  const selected = ref<string[]>([]); // cameraIds
  const sources = ref<Record<string, PlaySourceDTO>>({});
  const favorites = ref<string[]>(JSON.parse(localStorage.getItem('STREAM_FAVORITES') || '[]'));

  const filtered = computed(() => {
    const q = query.value.trim();
    if (!q) return cameras.value;
    return cameras.value.filter((c) => c.name.includes(q) || c.channelId.includes(q));
  });

  async function fetchCameras(company?: string) {
    cameras.value = await streamsApi.cameras(company);
  }

  async function loadSource(cameraId: string, opts?: { autoSelect?: boolean }) {
    const cam = cameras.value.find((c) => c.id === cameraId);
    if (cam && (cam.hls || cam.flv)) {
      const src: PlaySourceDTO = { cameraId, hlsUrl: cam.hls, flvUrl: cam.flv } as any;
      sources.value[cameraId] = src;
    } else {
      const src = await streamsApi.play(cameraId);
      sources.value[cameraId] = src;
    }
    if (opts?.autoSelect === false) return;
    if (!selected.value.includes(cameraId)) {
      // Keep at most grid size (fallback 4) — caller may override
      const max = Math.max(1, selected.value.length || 4);
      selected.value = [...selected.value, cameraId].slice(-max);
    }
  }

  function removeSelected(cameraId: string) {
    selected.value = selected.value.filter((id) => id !== cameraId);
  }

  function isFavorite(id: string) { return favorites.value.includes(id); }
  function addFavorite(id: string) {
    if (!favorites.value.includes(id)) {
      favorites.value.push(id);
      localStorage.setItem('STREAM_FAVORITES', JSON.stringify(favorites.value));
    }
  }
  function removeFavorite(id: string) {
    favorites.value = favorites.value.filter((x) => x !== id);
    localStorage.setItem('STREAM_FAVORITES', JSON.stringify(favorites.value));
  }
  function toggleFavorite(id: string) { isFavorite(id) ? removeFavorite(id) : addFavorite(id); }

  return { cameras, filtered, query, selected, sources, favorites, fetchCameras, loadSource, removeSelected, isFavorite, addFavorite, removeFavorite, toggleFavorite };
});
