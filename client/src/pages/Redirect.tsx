import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight, Home } from "lucide-react";
import { Link } from "wouter";

interface RedirectParams {
  url?: string;
  name?: string;
}

export default function Redirect() {
  const [, setLocation] = useLocation();
  const [params, setParams] = useState<RedirectParams>({});
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Parse the URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const url = searchParams.get("url") || "";
    const name = searchParams.get("name") || "external site";
    
    // Safety check - ensure URL contains http:// or https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setLocation("/");
      return;
    }
    
    setParams({ url, name });

    // Set a countdown for automatic redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = url;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  const handleRedirect = () => {
    if (params.url) {
      window.location.href = params.url;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <Card className="w-full max-w-md mx-4 border-purple-500 shadow-lg bg-gray-900 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-4 text-center">
            <ExternalLink className="h-16 w-16 text-purple-500 mb-4" />
            <h1 className="text-3xl font-bold text-white">External Redirect</h1>
            <div className="h-1 w-20 bg-purple-500 my-4 rounded-full"></div>
          </div>

          <p className="mt-4 text-gray-300 text-center">
            You are being redirected to:
          </p>
          
          <p className="mt-2 text-purple-400 text-center font-medium">
            {params.name}
          </p>
          
          <p className="mt-6 text-gray-400 text-center text-sm">
            Automatic redirect in {countdown} seconds...
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
          <Button 
            asChild 
            variant="outline" 
            className="border-purple-500 text-purple-400 hover:bg-purple-900 hover:text-white"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button 
            onClick={handleRedirect}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}