import React from 'react';
import Sidebar from '../components/SideMenu';

const Layout = ({ children, rightContent }) => {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4">{rightContent}</div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
