import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  duration?: number;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto remove after duration (default 5 seconds)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Global notification function
  useEffect(() => {
    (window as any).showNotification = addNotification;
    
    return () => {
      delete (window as any).showNotification;
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={20} />;
      case "error":
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case "success":
        return "bg-emerald-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      default:
        return "bg-amber-600 text-white";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 rounded-xl shadow-lg transform transition-all duration-300 animate-in slide-in-from-right ${getColorClasses(notification.type)}`}
          style={{
            minWidth: "300px",
            maxWidth: "400px",
          }}
        >
          <div className="flex items-start space-x-3">
            {getIcon(notification.type)}
            <div className="flex-1">
              <div className="font-semibold">{notification.title}</div>
              <div className="text-sm opacity-90 mt-1">{notification.message}</div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-1 hover:bg-black hover:bg-opacity-20 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
