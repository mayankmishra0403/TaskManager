"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: Show manual installation instructions
      showManualInstallInstructions();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Installation failed:', error);
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = `To install this app on iOS:
1. Tap the Share button (square with arrow up)
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to confirm`;
    } else if (isAndroid) {
      instructions = `To install this app on Android:
1. Tap the menu (⋮) in Chrome
2. Tap "Add to Home screen"
3. Tap "Add" to confirm

Or look for the install banner that appears automatically.`;
    } else {
      instructions = `To install this app:
1. Look for the install icon (⬇) in your browser's address bar
2. Click it and select "Install"
3. Or use browser menu > "Install Task Manager Pro"`;
    }
    
    alert(instructions);
  };

  const dismissPrompt = () => {
    setShowInstallPrompt(false);
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Banner - Shows when PWA is installable */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 shadow-lg z-50">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">Install Task Manager Pro</p>
                <p className="text-xs opacity-90">Get the full app experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleInstallClick}
                size="sm"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Install
              </Button>
              <Button
                onClick={dismissPrompt}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Install Button - Always available */}
      <Button
        onClick={handleInstallClick}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-40 rounded-full"
        size="sm"
      >
        <Download className="h-4 w-4 mr-2" />
        Install App
      </Button>
    </>
  );
}
