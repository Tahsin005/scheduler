import { CalendarDaysIcon, LayoutDashboardIcon, UserIcon, Wand2Icon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = ({isOpen, setIsOpen}: {isOpen: boolean; setIsOpen: (isOpen: boolean) => void}) => {
    const location = useLocation();
    const navItems = [
        { name: "Dashboard", icon: LayoutDashboardIcon, path: "/dashboard" },
        { name: "Accounts", icon: UserIcon, path: "/accounts" },
        { name: "Scheduler", icon: CalendarDaysIcon, path: "/scheduler" },
        { name: "AI Composer", icon: Wand2Icon, path: "/ai-composer" },
    ]
    return (
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-full transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 pb-4">
                <div className="text-xl tracking-tight text-slate-800 flex items-center gap-1.5">
                    <img src="/logo.svg" alt="Logo" className="size-6"  />
                    Scheduler
                </div>
            </div>

            <div className="px-6 py-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Menu</span>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink key={item.name} to={item.path} end={item.path === "/dashboard"} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 border ${isActive ? "bg-red-50 text-red-600 border-red-100" : "text-slate-500 hover:bg-slate-50 border-transparent hover:text-slate-700"}`}>
                            <item.icon className={`size-4.5 shrink-0 ${isActive ? "text-red-500" : "text-slate-500"}`} />
                            {item.name} 
                            {isActive && <span className="ml-auto w-[5px] h-5 rounded-full bg-red-500" />}
                        </NavLink>
                    )
                })}
            </nav>
        </div>
    )
}

export default Sidebar;
