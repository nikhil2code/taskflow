import { createContext, useContext, useState } from "react";
import {
  getAllTasks,
  getMyTasks,
  createTask,
  updateProgress,
  approveTask,
  rejectTask,
  addComment,
  deleteTask,
} from "../services/taskService";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllTasks = async () => {
    setLoading(true);
    const { data } = await getAllTasks();
    setTasks(data.filter(t => t && t._id));
    setLoading(false);
  };

  const fetchMyTasks = async () => {
    setLoading(true);
    const { data } = await getMyTasks();
    setTasks(data.filter(t => t && t._id));
    setLoading(false);
  };

  const addTask = async (taskData) => {
    const { data } = await createTask(taskData);
    setTasks((prev) => [...prev, data]);
    return data;
  };

  const updateTaskProgress = async (id, percentageCompleted) => {
    const { data } = await updateProgress(id, { percentageCompleted });
    setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
    return data;
  };

  const approve = async (id) => {
    const { data } = await approveTask(id);
    setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
  };

  const reject = async (id) => {
    const { data } = await rejectTask(id);
    setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
  };

  const addTaskComment = async (id, text) => {
    const { data } = await addComment(id, { text });
    setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
    return data;
  };

  const removeTask = async (id) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        fetchAllTasks,
        fetchMyTasks,
        addTask,
        updateTaskProgress,
        approve,
        reject,
        addTaskComment,
        removeTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => useContext(TaskContext);
export const useTaskContext = useTask;