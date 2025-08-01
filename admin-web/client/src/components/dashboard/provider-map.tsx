import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function ProviderMap() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="shadow-floating hover:shadow-floating-lg transition-all duration-300 border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Provider Distribution</CardTitle>
            <Button variant="link" className="text-medium-blue hover:text-blue-700 text-sm font-medium p-0">
              View Full Map
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center border border-green-200 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-gradient-to-br from-medium-blue to-light-blue"></div>
            </div>
            
            {/* Content */}
            <div className="text-center relative z-10">
              <MapPin className="text-medium-blue mx-auto mb-2" size={48} />
              <p className="text-gray-600 font-medium">Interactive Provider Map</p>
              <p className="text-sm text-gray-500 mt-1">Geographic distribution visualization</p>
            </div>
            
            {/* Floating location markers */}
            <motion.div 
              className="absolute top-16 left-16 w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute top-32 right-24 w-3 h-3 bg-blue-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div 
              className="absolute bottom-20 left-32 w-3 h-3 bg-purple-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
