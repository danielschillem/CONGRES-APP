import { Bell, Check, CheckCheck, RefreshCw } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { Notification } from '@/types'

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const isUnread = !notification.read_at

  const typeLabel: Record<string, string> = {
    soumission_approved: 'Soumission approuvée',
    soumission_rejected: 'Soumission rejetée',
    soumission_received: 'Soumission reçue',
    broadcast: 'Diffusion officielle',
    invitation_accepted: 'Invitation relecteur',
    review_assigned: 'Évaluation assignée',
  }

  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 border-b border-gray-100 last:border-0 transition-colors ${
        isUnread ? 'bg-primary-50/40 hover:bg-primary-50' : 'hover:bg-gray-50'
      }`}
    >
      <div
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
          isUnread ? 'bg-primary-500' : 'bg-gray-200'
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
            {typeLabel[notification.type] ?? notification.type}
          </span>
        </div>
        <p
          className={`text-sm leading-snug ${
            isUnread ? 'font-medium text-gray-900' : 'text-gray-600'
          }`}
        >
          {notification.data.message}
        </p>
        {notification.data.soumission_title && (
          <p className="text-xs text-gray-500 mt-1">{notification.data.soumission_title}</p>
        )}
        {notification.data.broadcast_subject && (
          <p className="text-xs text-gray-500 mt-1">{notification.data.broadcast_subject}</p>
        )}
        {notification.data.invitation_email && (
          <p className="text-xs text-gray-500 mt-1">{notification.data.invitation_email}</p>
        )}
        {notification.data.raison && (
          <p className="text-xs text-gray-500 mt-1">Raison : {notification.data.raison}</p>
        )}
        <p className="text-xs text-gray-400 mt-1.5">{formatDateTime(notification.created_at)}</p>
      </div>
      {isUnread && (
        <Button
          size="sm"
          variant="ghost"
          className="text-primary-600 hover:text-primary-700 hover:bg-primary-100 shrink-0"
          onClick={() => onRead(notification.id)}
        >
          <Check className="h-4 w-4 mr-1" />
          Lu
        </Button>
      )}
    </div>
  )
}

export function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes vos notifications'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllAsRead()}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell className="h-14 w-14 mb-4 text-gray-200" />
            <p className="font-medium text-gray-500">Aucune notification</p>
            <p className="text-sm mt-1">
              Vous serez notifié ici des mises à jour de vos soumissions.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onRead={markAsRead} />
          ))
        )}
      </div>
    </div>
  )
}
