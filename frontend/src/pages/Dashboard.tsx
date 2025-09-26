import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { TrendingUp, Target, Clock, Award, Flame, BookOpen, MessageCircle } from 'lucide-react'

type Task = {
  _id: string
  title: string
  subject: string
  date: string
  durationMinutes: number
  completed: boolean
}

type Plan = {
  _id: string
  goal: string
  tasks?: Task[]  // Mark tasks as optional to handle possible absence
}

type Reminder = {
  _id: string
  message: string
  scheduledAt: string
}

type Stats = {
  streak: number
  xp: number
  level: number
  totalTasks: number
  completedTasks: number
  completionRate: number
}

export default function Dashboard() {
  const { token } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    const client = api(token)
    Promise.all([
      client.get('/plans'),
      client.get('/reminders'),
      client.get('/gamification/stats')
    ]).then(([plansRes, remindersRes, statsRes]) => {
      setPlans(plansRes.data)
      setReminders(remindersRes.data)
      setStats(statsRes.data)
      setLoading(false)
    }).catch((err) => {
      setError(err.message || 'Failed to load data')
      setLoading(false)
    })
  }, [token])

  const chartData = useMemo(() => {
    const subjectMap: Record<string, { done: number; total: number }> = {}
    let totalTasks = 0
    let totalDone = 0

    plans.forEach(plan => {
      const tasks = Array.isArray(plan.tasks) ? plan.tasks : []
      tasks.forEach(task => {
        totalTasks++
        if (task.completed) totalDone++

        if (!subjectMap[task.subject]) {
          subjectMap[task.subject] = { done: 0, total: 0 }
        }
        subjectMap[task.subject].total++
        if (task.completed) subjectMap[task.subject].done++
      })
    })

    const subjectRows = Object.entries(subjectMap).map(([subject, counts]) => {
      const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0
      return { subject, done: counts.done, total: counts.total, pct }
    })

    const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

    return {
      subjectRows,
      overall: { total: totalTasks, done: totalDone, pct: overallPct }
    }
  }, [plans])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Welcome back!</h2>
          <p className="text-muted-foreground">Here's your study progress overview</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/scheduler">New Schedule</Link>
          </Button>
          <Button asChild>
            <Link to="/tasks">View Tasks</Link>
          </Button>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.level ?? 1}</div>
            <p className="text-xs text-muted-foreground">{stats?.xp ?? 0} XP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.streak ?? 0}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData.overall.pct}%</div>
            <Progress value={chartData.overall.pct} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {chartData.overall.done} / {chartData.overall.total} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">study plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.subjectRows.length > 0 ? (
                chartData.subjectRows.map(row => (
                  <div key={row.subject} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{row.subject}</span>
                      <Badge variant="secondary">{row.pct}%</Badge>
                    </div>
                    <Progress value={row.pct} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{row.done} completed</span>
                      <span>{row.total - row.done} pending</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              <div className="text-center">
                <p className="text-2xl font-bold mb-2">{stats?.completedTasks ?? 0}</p>
                <p className="text-sm">Completed Tasks</p>
                <p className="text-2xl font-bold mt-4">{(stats?.totalTasks ?? 0) - (stats?.completedTasks ?? 0)}</p>
                <p className="text-sm">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI Mentor</h3>
                <p className="text-sm text-muted-foreground">Get help with your studies</p>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/mentor">Chat with AI</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Resources</h3>
                <p className="text-sm text-muted-foreground">AI-curated learning materials</p>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/resources">Browse Resources</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">Track your progress</p>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reminders.map(r => (
                <div key={r._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{r.message}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.scheduledAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
