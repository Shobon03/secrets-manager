import { getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window';
import { useEffect, useState } from 'react';

const ZOOM_LEVELS = [1, 1.2, 1.5, 2] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

const STORAGE_KEY = 'app-zoom-level';

// Tamanhos base da janela
const BASE_MIN_WIDTH = 800;
const BASE_MIN_HEIGHT = 600;

const appWindow = getCurrentWindow();

export function useZoom() {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number.parseFloat(stored);
      if (ZOOM_LEVELS.includes(parsed as ZoomLevel)) {
        return parsed as ZoomLevel;
      }
    }
    return 1;
  });

  useEffect(() => {
    const updateZoom = async () => {
      localStorage.setItem(STORAGE_KEY, zoomLevel.toString());
      document.documentElement.style.fontSize = `${zoomLevel * 100}%`;

      // Ajusta o tamanho mínimo da janela proporcionalmente ao zoom
      const newMinWidth = Math.round(BASE_MIN_WIDTH * zoomLevel);
      const newMinHeight = Math.round(BASE_MIN_HEIGHT * zoomLevel);

      const newPhysicalSize = new PhysicalSize(newMinWidth, newMinHeight);

      await appWindow.setMinSize(newPhysicalSize);

      // Verifica se o tamanho atual é menor que o novo mínimo
      const currentSize = await getCurrentWindow().innerSize();
      if (
        currentSize.width < newMinWidth ||
        currentSize.height < newMinHeight
      ) {
        await appWindow.setSize(new PhysicalSize(newMinWidth, newMinHeight));
      }
    };

    updateZoom();
  }, [zoomLevel]);

  const zoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoomLevel(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const setSpecificZoom = (level: ZoomLevel) => {
    setZoomLevel(level);
  };

  const canZoomIn = zoomLevel < ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  const canZoomOut = zoomLevel > ZOOM_LEVELS[0];

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    setSpecificZoom,
    canZoomIn,
    canZoomOut,
    zoomLevels: ZOOM_LEVELS,
  };
}
