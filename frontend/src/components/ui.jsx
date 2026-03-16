export function Spinner({ size = "md" }) {
  const s = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" }[size];
  return (
    <div className="flex justify-center items-center py-12">
      <div className={`${s} animate-spin rounded-full border-4 border-blue-200 border-t-blue-600`} />
    </div>
  );
}

export function ErrorAlert({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      ⚠️ {message}
    </div>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="font-semibold text-gray-500 text-lg">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}

export function StatCard({ label, value, sub, color = "blue", icon }) {
  const colors = {
    blue:   "bg-blue-50   text-blue-600",
    green:  "bg-green-50  text-green-600",
    red:    "bg-red-50    text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && <span className={`p-2 rounded-lg text-lg ${colors[color]}`}>{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export function Badge({ children, color = "gray" }) {
  const colors = {
    gray:   "bg-gray-100 text-gray-600",
    green:  "bg-green-100 text-green-700",
    red:    "bg-red-100 text-red-700",
    blue:   "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
