import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTask } from "@/contexts/TaskContext";
import { StatusBadge, PriorityBadge } from "@/components/TaskBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  Tag,
  Trash2,
  Download,
} from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  getTaskById,
  uploadAttachment,
  deleteAttachment,
} from "@/services/taskService";

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateTaskProgress, approve, reject, addTaskComment } = useTask();

  const [task, setTask] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [progressValue, setProgressValue] = useState(0);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data } = await getTaskById(id);
        setTask(data);
        setProgressValue(data.percentageCompleted);
      } catch {
        toast.error("Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading task...
      </div>
    );
  }

  if (!task || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Task not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </div>
    );
  }

  const assigneeName = task.assignedTo?.name || "Unassigned";
  const assignerName = task.assignedBy?.name || "Unknown";

  const isAssignee = user._id === task.assignedTo?._id;
  const isManager = user.role === "manager" || user.role === "teamlead";

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== "approved";

  const handleProgressChange = async (val) => {
    setProgressValue(val);

    try {
      const updated = await updateTaskProgress(task._id, val);
      setTask(updated);
    } catch {
      toast.error("Failed to update progress");
    }
  };

  const handleSubmitTask = async () => {
    try {
      const updated = await updateTaskProgress(task._id, 100);
      setTask(updated);
      toast.success("Task submitted for review!");
    } catch {
      toast.error("Failed to submit task");
    }
  };

  const handleApprove = async () => {
    try {
      await approve(task._id);
      setTask((prev) => ({ ...prev, status: "approved" }));
      toast.success("Task approved!");
    } catch {
      toast.error("Failed to approve task");
    }
  };

  const handleReject = async () => {
    try {
      await reject(task._id);
      setTask((prev) => ({ ...prev, status: "rejected" }));
      toast.error("Task rejected");
    } catch {
      toast.error("Failed to reject task");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      const updated = await addTaskComment(task._id, comment);
      setTask(updated);
      setComment("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await uploadAttachment(task._id, formData);
      setTask(data);

      toast.success("File uploaded!");
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const { data } = await deleteAttachment(task._id, attachmentId);
      setTask(data);
      toast.success("Attachment removed");
    } catch {
      toast.error("Failed to delete attachment");
    }
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-card rounded-lg border p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">
              {task.title}
            </h1>

            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {task.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Assigned To
            </p>
            <p className="font-medium">{assigneeName}</p>
          </div>

          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Assigned By
            </p>
            <p className="font-medium">{assignerName}</p>
          </div>

          <div>
            <p
              className={`flex items-center gap-1 ${
                isOverdue ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Deadline
            </p>

            <p className={`font-medium ${isOverdue ? "text-destructive" : ""}`}>
              {task.deadline
                ? new Date(task.deadline).toLocaleDateString()
                : "No deadline"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Updated
            </p>
            <p className="font-medium">
              {new Date(task.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{progressValue}%</span>
          </div>

          <Progress value={progressValue} className="h-2" />

          {isAssignee && (
            <Slider
              value={[progressValue]}
              max={100}
              step={5}
              onValueChange={([val]) => handleProgressChange(val)}
            />
          )}
        </div>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div>
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4" /> Tags
            </h3>

            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {task.dependsOn?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm">Blocked by</h3>

            <div className="space-y-1 mt-2">
              {task.dependsOn.map((dep) => (
                <div
                  key={dep._id || dep}
                  className="text-xs flex items-center gap-2 bg-muted rounded px-3 py-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  {dep.title || dep}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4" />
              Attachments ({task.attachments?.length || 0})
            </h3>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload file"}
              </Button>
            </div>
          </div>

          {task.attachments?.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No attachments yet
            </p>
          )}

          {task.attachments?.map((att) => (
            <div
              key={att._id}
              className="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
            >
              <span className="text-sm">{att.filename}</span>

              <div className="flex gap-1">
                <a href={att.url} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </a>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDeleteAttachment(att._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({task.comments?.length || 0})
          </h3>

          {task.comments?.map((c) => (
            <div key={c._id}>
              <p className="text-sm font-medium">{c.user?.name}</p>
              <p className="text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}

          <form onSubmit={handleAddComment} className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <Button size="sm" type="submit">
              Post
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;