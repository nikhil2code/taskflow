import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTask } from "@/contexts/TaskContext";
import { StatusBadge, PriorityBadge } from "@/components/TaskBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { getAllUsers } from "@/services/authService";
import {
  ArrowLeft, Calendar, User, Clock, Send,
  CheckCircle, XCircle, MessageSquare, Paperclip,
  Tag, Trash2, Download, X
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getTaskById, uploadAttachment, deleteAttachment } from "@/services/taskService";

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

  // @mention states
  const [allUsers, setAllUsers] = useState([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState([]);

  // Fetch task
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

  // Fetch all users for @mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await getAllUsers();
        setAllUsers(data);
      } catch {}
    };
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading task...</div>;
  }

  if (!task || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Task not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const assigneeName = task.assignedTo?.name || "Unassigned";
  const assignerName = task.assignedBy?.name || "Unknown";
  const isAssignee = user._id === task.assignedTo?._id;
  const isManagerOrAbove = ['admin', 'bod', 'manager', 'teamlead'].includes(user.role);
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "approved";

  // ── Handlers ──────────────────────────────────

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
      setTask(prev => ({ ...prev, status: "approved" }));
      toast.success("Task approved!");
    } catch {
      toast.error("Failed to approve task");
    }
  };

  const handleReject = async () => {
    try {
      await reject(task._id);
      setTask(prev => ({ ...prev, status: "rejected" }));
      toast.error("Task rejected");
    } catch {
      toast.error("Failed to reject task");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const updated = await addTaskComment(
        task._id,
        comment,
        selectedMentions.map(m => m._id)
      );
      setTask(updated);
      setComment('');
      setSelectedMentions([]);
      setShowMentions(false);
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setComment(val);
    const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionSearch(lastWord.slice(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const handleSelectMention = (u) => {
    if (!selectedMentions.find(m => m._id === u._id)) {
      setSelectedMentions(prev => [...prev, u]);
    }
    setComment(prev => prev.replace(/@\w*$/, `@${u.name.split(' ')[0]} `));
    setShowMentions(false);
    setMentionSearch('');
  };

  const handleRemoveMention = (id) => {
    setSelectedMentions(prev => prev.filter(m => m._id !== id));
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

  // ── Render ──────────────────────────────────

  return (
    <div className="max-w-3xl animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-card rounded-lg border p-6 space-y-6">

        {/* Title + Badges */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">{task.title}</h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Assigned To
            </p>
            <p className="font-medium">{assigneeName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Assigned By
            </p>
            <p className="font-medium">{assignerName}</p>
          </div>
          <div className="space-y-1">
            <p className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
              <Calendar className="h-3.5 w-3.5" /> Deadline
            </p>
            <p className={`font-medium ${isOverdue ? "text-destructive" : ""}`}>
              {task.deadline
                ? new Date(task.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "No deadline"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Updated
            </p>
            <p className="font-medium">
              {new Date(task.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
          {isAssignee && (task.status === 'pending' || task.status === 'in_progress' || task.status === 'rejected') && (
            <Slider
              value={[progressValue]}
              max={100}
              step={5}
              onValueChange={([val]) => handleProgressChange(val)}
              className="mt-2"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          {isAssignee && task.status === 'in_progress' && progressValue === 100 && (
            <Button onClick={handleSubmitTask} className="gap-1.5">
              <Send className="h-4 w-4" /> Submit for Review
            </Button>
          )}
          {isManagerOrAbove && task.status === 'submitted' && (
            <>
              <Button
                onClick={handleApprove}
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
              <Button onClick={handleReject} variant="destructive" className="gap-1.5">
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4" /> Tags
            </h3>
            <div className="flex flex-wrap gap-1">
              {task.tags.map(tag => (
                <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {task.dependsOn?.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Blocked by</h3>
            <div className="space-y-1">
              {task.dependsOn.map(dep => (
                <div key={dep._id || dep} className="text-xs flex items-center gap-2 bg-muted rounded px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  {dep.title || dep}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
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
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xlsx"
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
            <p className="text-xs text-muted-foreground">No attachments yet</p>
          )}

          <div className="space-y-2">
            {task.attachments?.map(att => (
              <div key={att._id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{att.filename}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={att.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteAttachment(att._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({task.comments?.length || 0})
          </h3>

          {/* Comment List */}
          {task.comments?.length === 0 && (
            <p className="text-xs text-muted-foreground">No comments yet</p>
          )}

          {task.comments?.map(c => (
            <div key={c._id} className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                {c.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.user?.name || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {c.text.split(' ').map((word, i) =>
                    word.startsWith('@') ? (
                      <span key={i} className="text-primary font-medium">{word} </span>
                    ) : (
                      `${word} `
                    )
                  )}
                </p>
                {c.mentions?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {c.mentions.map(m => (
                      <span key={m._id || m} className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        @{m.name || 'user'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Comment Form */}
          <div className="space-y-2">

            {/* Selected mentions chips */}
            {selectedMentions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedMentions.map(m => (
                  <span
                    key={m._id}
                    className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                  >
                    @{m.name}
                    <button type="button" onClick={() => handleRemoveMention(m._id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Add a comment... (type @ to mention someone)"
                  value={comment}
                  onChange={handleCommentChange}
                  className="w-full"
                />

                {/* Mention dropdown */}
                {showMentions && (
                  <div className="absolute bottom-full left-0 mb-1 w-full bg-card border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {allUsers
                      .filter(u =>
                        u._id !== user._id &&
                        u.name.toLowerCase().includes(mentionSearch.toLowerCase())
                      )
                      .length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3">No users found</p>
                    ) : (
                      allUsers
                        .filter(u =>
                          u._id !== user._id &&
                          u.name.toLowerCase().includes(mentionSearch.toLowerCase())
                        )
                        .map(u => (
                          <button
                            key={u._id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                            onClick={() => handleSelectMention(u)}
                          >
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {u.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-xs">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{u.role}</p>
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>
              <Button size="sm" type="submit">Post</Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskDetailPage;