import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtlasTaskCard } from "./AtlasTaskCard";

export interface DefaultTask {
  id: number;
  title: string;
  avatar: string;
  progress: number;
  tags: { text: string; color: string }[];
  importance: number;
  timeframe: number;
  status: "pending" | "started" | "in_review" | "completed";
}

const initialTasks: DefaultTask[] = [
  {
    id: 1,
    title: "Design UI",
    avatar: "https://api.dicebear.com/6.x/initials/svg?seed=DU",
    progress: 75,
    status: "started",
    tags: [{ text: "Design", color: "bg-blue-200 text-blue-800" }],
    importance: 0,
    timeframe: 0,
  },
  {
    id: 2,
    title: "Implement API",
    avatar: "https://api.dicebear.com/6.x/initials/svg?seed=IA",
    progress: 30,
    status: "in_review",
    tags: [{ text: "Backend", color: "bg-green-200 text-green-800" }],
    importance: 1,
    timeframe: 1,
  },
  {
    id: 3,
    title: "Write Tests",
    avatar: "https://api.dicebear.com/6.x/initials/svg?seed=WT",
    progress: 50,
    status: "pending",
    tags: [{ text: "Testing", color: "bg-yellow-200 text-yellow-800" }],
    importance: 2,
    timeframe: 2,
  },
  {
    id: 4,
    title: "Refactor Code",
    avatar: "https://api.dicebear.com/6.x/initials/svg?seed=RC",
    progress: 20,
    status: "started",
    tags: [{ text: "Maintenance", color: "bg-purple-200 text-purple-800" }],
    importance: 0,
    timeframe: 2,
  },
  {
    id: 5,
    title: "Deploy to Prod",
    avatar: "https://api.dicebear.com/6.x/initials/svg?seed=DP",
    progress: 10,
    status: "pending",
    tags: [{ text: "DevOps", color: "bg-red-200 text-red-800" }],
    importance: 2,
    timeframe: 0,
  },
];

const importanceLevels = ["High", "Medium", "Low"];
const timeframeLevels = ["> 3 hours", "> 1 day", "> 1 week"];

export default function AtlasBoard() {
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prevTasks) => {
        return prevTasks.map((task) => ({
          ...task,
          importance: Math.floor(Math.random() * 3),
          timeframe: Math.floor(Math.random() * 3),
          // Randomly change status too for more visual interest
          status: ["pending", "started", "in_review", "completed"][
            Math.floor(Math.random() * 4)
          ] as DefaultTask["status"],
        }));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative border-2 border-blue-500/30 rounded-lg p-4 pl-24">
      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-0 mb-2">
        {timeframeLevels.map((time) => (
          <div
            key={time}
            className="text-center text-sm font-medium text-gray-600"
          >
            {time}
          </div>
        ))}
      </div>

      {/* Row Headers */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-around px-4">
        {importanceLevels.map((importance) => (
          <div key={importance} className="text-sm font-medium text-gray-600">
            {importance}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-0 bg-white">
        {Array.from({ length: 3 }).map((_, i) => (
          <React.Fragment key={i}>
            <div className="col-span-3 grid grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`
                    min-h-[200px] p-4 relative
                    ${i !== 2 ? "border-b border-gray-200 border-dashed" : ""}
                    ${j !== 2 ? "border-r border-gray-200 border-dashed" : ""}
                  `}
                >
                  <AnimatePresence mode="popLayout">
                    {tasks
                      .filter(
                        (task) => task.importance === i && task.timeframe === j
                      )
                      .map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{
                            opacity: { duration: 0.2 },
                            layout: { duration: 0.4 },
                            scale: { duration: 0.2 },
                          }}
                        >
                          <AtlasTaskCard task={task} />
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
