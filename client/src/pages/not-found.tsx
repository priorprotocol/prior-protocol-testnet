import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Home, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <Card className="w-full max-w-md mx-4 border-purple-500 shadow-lg bg-gray-900 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-4 text-center">
            <AlertCircle className="h-16 w-16 text-purple-500 mb-4" />
            <h1 className="text-3xl font-bold text-white">404 Page Not Found</h1>
            <div className="h-1 w-20 bg-purple-500 my-4 rounded-full"></div>
          </div>

          <p className="mt-4 text-gray-300 text-center">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <p className="mt-2 text-gray-400 text-center text-sm">
            Return to homepage to continue exploring Prior Protocol.
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
              Home
            </Link>
          </Button>
          <Button 
            onClick={() => window.history.back()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
