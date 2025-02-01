"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface Task {
  id: number
  title: string
  avatar: string
  progress: number
  tags: { text: string; color: string }[]
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Design UI",
    avatar: "/placeholder.svg?height=40&width=40",
    progress: 75,
    tags: [{ text: "Design", color: "bg-blue-200 text-blue-800" }],
  },
  {
    id: 2,
    title: "Implement API",
    avatar: "/placeholder.svg?height=40&width=40",
    progress: 30,
    tags: [{ text: "Backend", color: "bg-green-200 text-green-800" }],
  },
  {
    id: 3,
    title: "Write Tests",
    avatar: "/placeholder.svg?height=40&width=40",
    progress: 50,
    tags: [{ text: "Testing", color: "bg-yellow-200 text-yellow-800" }],
  },
  {
    id: 4,
    title: "Refactor Code",
    avatar: "/placeholder.svg?height=40&width=40",
    progress: 20,
    tags: [{ text: "Maintenance", color: "bg-purple-200 text-purple-800" }],
  },
  {
    id: 5,
    title: "Deploy to Prod",
    avatar: "/placeholder.svg?height=40&width=40",
    progress: 10,
    tags: [{ text: "DevOps", color: "bg-red-200 text-red-800" }],
  },
]

export default function AtlasBoard() {
  const [tasks, setTasks] = useState(initialTasks)

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({
          ...task,
          progress: Math.min(100, task.progress + Math.random() * 10),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-2xl font-bold mb-4 text-center">AtlasBoard</h2>
      <div className="grid grid-cols-3 gap-4">
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            className="bg-white p-4 rounded-lg shadow-md"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <div className="flex items-center mb-2">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={task.avatar} alt={task.title} />
                <AvatarFallback>{task.title[0]}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">{task.title}</h3>
            </div>
            <Progress value={task.progress} className="mb-2" />
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag, index) => (
                <span key={index} className={`text-xs px-2 py-1 rounded-full ${tag.color}`}>
                  {tag.text}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

