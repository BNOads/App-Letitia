import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { MobileSidebar } from "./MobileSidebar";
import { SidebarProvider } from "./SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { initializePushNotifications } from "@/services/pushService";
import { Bell, X, Share } from "lucide-react";

export function AppLayout() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  // Inicializa notificações push automaticamente
  useEffect(() => {
    if (user) {
      initializePushNotifications(user.id);
    }
  }, [user]);

  // Detecta se é iOS e não está em modo Standalone (PWA Instalado)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('laetitia_ios_banner_dismissed') === 'true';

    if (isIOS && !isStandalone && !dismissed) {
      setShowIOSBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    localStorage.setItem('laetitia_ios_banner_dismissed', 'true');
    setShowIOSBanner(false);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuToggle={() => setMobileMenuOpen(true)} />
          
          {/* Banner de Instalação iOS Standalone */}
          {showIOSBanner && (
            <div className="mx-4 md:mx-8 mt-4 p-4 rounded-2xl bg-letitia-bone/90 border border-letitia-gold/20 flex items-start justify-between gap-3 shadow-sm animate-fade-in relative z-20">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-letitia-gold/10 flex items-center justify-center flex-shrink-0 text-letitia-clay">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Receba Notificações no iPhone</p>
                  <p className="text-muted text-xs mt-1 leading-relaxed">
                    Para receber notificações push no seu celular, adicione o aplicativo à sua tela inicial: 
                    toque em <Share className="inline h-4 w-4 mx-1 text-letitia-clay align-text-bottom" /> no Safari e selecione <strong>Adicionar à Tela de Início</strong>.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDismissBanner}
                className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-foreground/5 transition-all flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
            <div className="mx-auto max-w-7xl pb-8 md:pb-0">
              <Outlet />
            </div>
          </main>
        </div>
        <BottomNav />
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
    </SidebarProvider>
  );
}
