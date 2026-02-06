import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function NavigationListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    const cleanupNavHome = window.electronAPI.onNavigateToHome(() => {
      void navigate("/");
    });

    const cleanupNavData = window.electronAPI.onNavigateToData(() => {
      void navigate("/data");
    });

    return () => {
      cleanupNavHome();
      cleanupNavData();
    };
  }, [navigate]);

  return null;
}
