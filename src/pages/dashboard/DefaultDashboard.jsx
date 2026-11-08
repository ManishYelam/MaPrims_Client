import React from 'react';
import { AlertCircle } from 'lucide-react';

const DefaultDashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="bg-blue-50 rounded-full p-3 mb-4">
        <AlertCircle className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Dashboard</h2>
      <p className="text-sm text-gray-600 text-center max-w-md">
        Your role does not have a dedicated dashboard. You can still access common features like profile, settings, and support from the menu.
      </p>
    </div>
  );
};

export default DefaultDashboard;