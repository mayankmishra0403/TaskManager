'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-6 h-6 text-gray-400" />
          </div>
          <CardTitle className="text-xl">You're offline</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            It looks like you don't have an internet connection. Some features may not be available.
          </p>
          <p className="text-sm text-gray-500">
            Don't worry! Your data is safe and will sync when you're back online.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Metadata moved to layout since this is now a client component
