import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Star, Sliders, FlaskConical, BarChart2, Menu, X } from "lucide-react";
import { useState } from "react";

import Dashboard    from "./pages/Dashboard";
import StockList    from "./pages/StockList";
import StockDetail  from "./pages/StockDetail";
import Watchlists   from "./pages/Watchlists";
import Strategies   from "./pages/Strategies";
import Backtest     from "./pages/Backtest";
import Results      from "./pages/Results";
import ResultDetail from "./pages/ResultDetail";

const NAV = [
  { to: "/",           icon: LayoutDashboard, label: "Dashboard"   },
  { to: "/stocks",     icon: TrendingUp,      label: "股票列表"     },
  { to: "/watchlists", icon: Star,            label: "自選清單"     },
  { to: "/strategies", icon: Sliders,         label: "策略管理"     },
  { to: "/backtest",   icon: FlaskConical,    label: "執行回測"     },
  { to: "/results",    icon: BarChart2,       label: "回測結果"     },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-gray-900 text-white z-30 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <BarChart2 className="text-blue-400" size={22} />
            <span>BacktestPro</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-xs text-gray-600 border-t border-gray-700">Stock Backtest System v1.0</div>
      </aside>
    </>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="lg:hidden flex items-center px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700"><Menu size={22} /></button>
            <span className="ml-3 font-semibold text-gray-700">BacktestPro</span>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Routes>
              <Route path="/"            element={<Dashboard />}    />
              <Route path="/stocks"      element={<StockList />}    />
              <Route path="/stocks/:id"  element={<StockDetail />}  />
              <Route path="/watchlists"  element={<Watchlists />}   />
              <Route path="/strategies"  element={<Strategies />}   />
              <Route path="/backtest"    element={<Backtest />}     />
              <Route path="/results"     element={<Results />}      />
              <Route path="/results/:id" element={<ResultDetail />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
