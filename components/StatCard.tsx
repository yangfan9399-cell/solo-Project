interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

export default function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
