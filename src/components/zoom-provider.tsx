import { getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

const ZOOM_LEVELS = [1, 1.2, 1.5, 2] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

const STORAGE_KEY = 'app-zoom-level';

// Tamanhos base da janela
const BASE_MIN_WIDTH = 800;
const BASE_MIN_HEIGHT = 600;

interface ZoomContextType {
  zoomLevel: ZoomLevel;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setSpecificZoom: (level: ZoomLevel) => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomLevels: readonly ZoomLevel[];
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined);

export function ZoomProvider({ children }: { children: ReactNode }) {
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

      // Aplica o zoom usando a propriedade zoom (melhor para layout)
      document.documentElement.style.zoom = `${zoomLevel}`;

      // Reset de qualquer transform/width/height anterior
      document.body.style.transform = '';
      document.body.style.width = '';
      document.body.style.height = '';

      // Compensa o stroke-width dos ícones SVG para manter a espessura original
      const strokeCompensations: Record<number, number> = {
        1: 1,
        1.2: 1.2,
        1.5: 1.5,
        2: 2.2,
      };

      const strokeCompensation = strokeCompensations[zoomLevel] / zoomLevel;

      document.documentElement.style.setProperty(
        '--icon-stroke-compensation',
        strokeCompensation.toString(),
      );

      // Ajusta o tamanho mínimo da janela proporcionalmente ao zoom
      const appWindow = getCurrentWindow();
      const newMinWidth = Math.round(BASE_MIN_WIDTH * zoomLevel);
      const newMinHeight = Math.round(BASE_MIN_HEIGHT * zoomLevel);

      const newPhysicalSize = new PhysicalSize(newMinWidth, newMinHeight);

      await appWindow.setMinSize(newPhysicalSize);

      // Verifica se o tamanho atual é menor que o novo mínimo
      const currentSize = await appWindow.innerSize();
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

  return (
    <ZoomContext.Provider
      value={{
        zoomLevel,
        zoomIn,
        zoomOut,
        resetZoom,
        setSpecificZoom,
        canZoomIn,
        canZoomOut,
        zoomLevels: ZOOM_LEVELS,
      }}
    >
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  if (context === undefined) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
}
