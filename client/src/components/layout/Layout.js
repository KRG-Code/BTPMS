import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from "../../components/layout/SideNav";
import TopNav from "../../components/layout/TopNav";

export default function Layout() {
    const [isSideNavOpen, setIsSideNavOpen] = useState(false);
    const [isDarkMode] = useState(false);

    const toggleSideNav = () => {
        setIsSideNavOpen(!isSideNavOpen);
    };

    return (
        <div className={`App ${isDarkMode ? "dark-mode" : "light-mode"}`}>
            <div className="flex h-screen">
                {/* Sidebar taking full height without overlapping */}
                <SideNav isOpen={isSideNavOpen} toggleSideNav={toggleSideNav} className="h-full" />

                <div className="flex flex-col w-full h-full">
                    {/* TopNav aligned to right */}
                    <TopNav toggleSideNav={toggleSideNav} />

                    {/* Main content with routes */}
                    <main className="main-content mt-3 z-0 flex-1 overflow-y-scroll scrollbar-hide">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
