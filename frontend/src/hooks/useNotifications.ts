import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import { Notification } from '@/types'
import { useAuthStore } from '@/stores/authStore'

export function useNotifications() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const response = await notificationsApi.getAll({ limit: 10 })
      return response.data
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 10000,
  })

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount()
      return response.data
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 10000,
  })

  const notifications: Notification[] = notificationsData?.data ?? []
  const unreadCount: number = unreadData?.data?.count ?? 0

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  }
}
