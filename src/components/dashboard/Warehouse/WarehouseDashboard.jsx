import { useNotifications } from "@/hooks/useNotifications";

const WarehouseDashboard = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">
        Warehouse Dashboard
      </h1>

      <div className="mb-6">
        <h2 className="font-semibold mb-2">
          Notifications ({unreadCount})
        </h2>

        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-3 mb-2 rounded ${
              n.is_read ? "bg-white/5" : "bg-purple-500/20"
            }`}
            onClick={() => markAsRead(n.id)}
          >
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-gray-300">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
const submitInspection = async () => {
  await supabase.from("return_inspections").insert({
    return_id,
    inspected_by: user.id,
    condition,
    decision,
    notes
  });
};


export default WarehouseDashboard;
