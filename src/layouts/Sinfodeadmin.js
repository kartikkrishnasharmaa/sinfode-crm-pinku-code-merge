import React, { useState, useEffect } from 'react';
import SAHeader from '../components/Adminheader';
import SASidebar from '../components/Adminsidebar';

const SinfodeAdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex bg-[#F4F9FD] min-h-screen">
      {/* Sidebar - Always fixed position */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'fixed inset-y-0 left-0 z-30'}
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <SASidebar 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content Area - Adjusted for sidebar on desktop */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        !isMobile ? 'lg:ml-64' : ''
      }`}>
        {/* Header - Sticky */}
        <div className="sticky top-0 z-40 bg-[#F4F9FD]">
          <SAHeader 
            toggleSidebar={toggleSidebar} 
            isSidebarOpen={isSidebarOpen}
            isMobile={isMobile}
          />
        </div>

        {/* Page Content */}
        <main 
          className="flex-1 overflow-auto p-4 lg:p-6 bg-[#F4F9FD]"
          onClick={closeSidebar}
        >
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default SinfodeAdminLayout;
