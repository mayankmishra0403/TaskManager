"use client";

import { useEffect } from "react";

export default function PWADetector() {
  useEffect(() => {
    // Enhanced PWA installation detection
    const setupPWA = () => {
      // Register service worker manually if needed
      // Only register manually in production when next-pwa is not disabled
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.warn('Service worker registration failed:', error);
        });
      }

      // Force show install prompt on supported browsers
      let deferredPrompt: any;
      
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install UI
        console.log('PWA install prompt available');
        
        // Trigger the install prompt after a delay
        setTimeout(() => {
          if (deferredPrompt) {
            // Custom event to trigger install button
            window.dispatchEvent(new CustomEvent('pwa-installable', { detail: deferredPrompt }));
          }
        }, 3000);
      });

      // Handle successful installation
      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        deferredPrompt = null;
      });

      // Add to home screen guidance for iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isIOS && !isStandalone) {
        setTimeout(() => {
          const showIOSInstallBanner = localStorage.getItem('ios-install-banner-shown');
          if (!showIOSInstallBanner) {
            console.log('iOS device detected - manual installation available');
            // You can show a custom iOS installation guide here
            localStorage.setItem('ios-install-banner-shown', 'true');
          }
        }, 5000);
      }
    };

    setupPWA();
  }, []);

  return null; // This component doesn't render anything
}
