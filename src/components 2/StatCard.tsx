interface Props {
  icon: string;
  label: string;
  value: number | string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  yellow: "bg-yellow-50 text-yellow-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600"
};

export default function StatCard(props: Props) {
  return (
    <div class="card">
      <div class="card-body flex items-center">
        <div class={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[props.color || "blue"]}`}>
          {props.icon}
        </div>
        <div class="ml-4">
          <p class="text-sm text-gray-500">{props.label}</p>
          <p class="text-2xl font-bold text-gray-900">{props.value}</p>
        </div>
      </div>
    </div>
  );
}
