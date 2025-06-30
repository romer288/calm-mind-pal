
import React from 'react';
import { Heart } from 'lucide-react';

const RegistrationHeader: React.FC = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 px-8 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-semibold text-gray-900">Anxiety Companion</span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationHeader;
