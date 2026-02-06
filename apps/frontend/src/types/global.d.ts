import type { PhotoResultDocument } from "../utils/database";

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }

  interface ElectronAPI {
    platform: string;
    isElectron: boolean;
    print: (imageDataUrl: string) => Promise<PrintResult>;
    savePhotoFile: (
      base64Data: string,
      fileName: string,
    ) => Promise<{ success: boolean; error?: string; filePath?: string }>;
    db: {
      savePhotoResult: (
        document: PhotoResultDocument,
      ) => Promise<{ success: boolean; error?: string }>;
      getAllPhotoResults: () => Promise<{
        success: boolean;
        error?: string;
        data: PhotoResultDocument[];
      }>;
      getPhotoResultById: (id: string) => Promise<{
        success: boolean;
        error?: string;
        data: PhotoResultDocument | null;
      }>;
    };
    onNavigateToHome: (callback: () => void) => () => void;
    onNavigateToData: (callback: () => void) => () => void;
  }

  interface PrintResult {
    success: boolean;
    error?: string;
    filepath?: string;
  }
}

export {};
