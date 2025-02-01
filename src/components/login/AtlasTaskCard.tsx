import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DefaultTask } from "./AtlasBoard";
interface AtlasTaskCardProps {
  task: DefaultTask;
}

const statusColors = {
  pending: "bg-white",
  started: "bg-blue-50 border-blue-200",
  in_review: "bg-orange-50 border-orange-200",
  completed: "bg-green-50 border-green-200",
};

export function AtlasTaskCard({ task }: AtlasTaskCardProps) {
  return (
    <div
      className={`group/card relative ${
        statusColors[task.status as keyof typeof statusColors]
      } p-3 rounded-lg shadow-sm border hover:shadow-md transition-all mb-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-800 flex-1 text-sm">
          {task.title}
        </h3>
        <div className="flex-shrink-0">
          <Avatar className="h-5 w-5">
            <AvatarImage src={task.avatar} alt={task.title} />
            <AvatarFallback>{task.title[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className={`px-1.5 py-0.5 text-[10px] rounded-full ${tag.color}`}
            >
              {tag.text}
            </span>
          ))}
        </div>
      )}

      {task.progress > 0 && (
        <div className="h-1 mt-2 border rounded w-full">
          <div
            className="h-full"
            style={{
              width: `${task.progress}%`,
              backgroundColor: task.progress === 100 ? "#22c55e" : "#3b82f6",
            }}
          />
        </div>
      )}
    </div>
  );
}
