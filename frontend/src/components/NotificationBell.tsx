import { Bell, Check, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { Notification } from '@/types'

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const isUnread = !notification.read_at

  return (
    <DropdownMenuItem
      className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer ${isUnread ? 'bg-primary-50/50' : ''}`}
      onClick={() => {
        if (isUnread) onRead(notification.id)
      }}
    >
      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? 'bg-primary-500' : 'bg-transparent'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
          {notification.data.message}
        </p>
        {notification.data.soumission_title && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {notification.data.soumission_title}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">{formatDateTime(notification.created_at)}</p>
      </div>
      {isUnread && (
        <Check className="h-3.5 w-3.5 text-primary-500 shrink-0 mt-0.5" />
      )}
    </DropdownMenuItem>
  )
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[480px] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="warning">{unreadCount} non lues</Badge>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  markAllAsRead()
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Tout lire
              </button>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Aucune notification</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
            />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
