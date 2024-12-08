import React from 'react';
import Sidebar from '../components/SideMenu';

const Layout = ({ children, rightContent, title }) => {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col h-[100vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-2 border-gray-300 w-full">
          <p className="font-semibold text-[18px] pl-4">{title}</p>
          <div className="flex justify-end p-4">{rightContent}</div>
        </div>
        <div className="px-4">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
