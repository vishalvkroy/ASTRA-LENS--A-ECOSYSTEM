export type Alert = {
  id: string
  title: string
  description: string
  level: 'high' | 'medium' | 'low'
  createdAt: string
}