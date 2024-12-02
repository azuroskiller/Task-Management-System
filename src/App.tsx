import React, { useState } from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import TaskList from "./components/TaskList";
import TaskInput from "./components/TaskInput";
import { Task } from "./models/Task";

const App: React.FC = () => {
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 20; // Show 20 tasks per page

  const addTask = (name: string, parentId?: number) => {
    setTasks((prevTasks) => {
      // Generate a unique ID for the new task
      const newTaskId = prevTasks.length + 1;
  
      const newTask: Task = {
        id: newTaskId,
        name,
        status: "IN_PROGRESS",
        parentId,
        dependencies: [], // No dependencies initially
      };
  
      let updatedTasks = [...prevTasks];
  
      // If the task has a parent, add this task to the parent's dependencies
      if (parentId) {
        // Find the parent task and add the new task to its dependencies
        updatedTasks = updatedTasks.map((task) => {
          if (task.id === parentId) {
            return { ...task, dependencies: [...task.dependencies, newTaskId] };
          }
          return task;
        });
      }

      updatedTasks.push(newTask);
  
      console.log(updatedTasks);  
      return updatedTasks;
    });
  };
  
  const detectCircularDependency = (parentId: number, newTaskId: number): boolean => {
    let currentTaskId = parentId;
    while (currentTaskId) {
      const parentTask = tasks.find((task) => task.id === currentTaskId);
      if (!parentTask) break;
      if (parentTask.id === newTaskId) return true;
      currentTaskId = parentTask.parentId!;
    }
    return false;
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks((prevTasks) => {
      const task = prevTasks.find((t) => t.id === taskId);
      if (!task) return prevTasks;
  
      // Toggle the task's status
      const newStatus: Task["status"] =
        task.status === "IN_PROGRESS" ? "DONE" : "IN_PROGRESS";
  
      const updatedTasks = prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );
  
      return propagateStatus(updatedTasks, taskId);
    });
  };

  const propagateStatus = (tasks: Task[], taskId: number): Task[] => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return tasks;
  
    // Downward propagation: Update dependencies based on parent task's status
    if (task.status === "DONE" || task.status === "COMPLETE") {
      tasks = tasks.map((t) => {
        if (task.dependencies.includes(t.id)) {
          const newStatus =
            task.status === "COMPLETE"
              ? "COMPLETE"
              : t.status === "IN_PROGRESS"
              ? "DONE"
              : t.status; // Only update if not already COMPLETE
          return { ...t, status: newStatus };
        }
        return t;
      });
  
      // If all dependencies are COMPLETE, update the task itself to COMPLETE
      const dependenciesComplete = task.dependencies.every((depId) => {
        const dep = tasks.find((t) => t.id === depId);
        return dep?.status === "COMPLETE";
      });
  
      if (dependenciesComplete && task.status !== "COMPLETE") {
        tasks = tasks.map((t) =>
          t.id === taskId ? { ...t, status: "COMPLETE" } : t
        );
      }
    }
  
    // Upward propagation: Handle changes to parent task's status
    if (task.status === "IN_PROGRESS" && task.parentId) {
      tasks = tasks.map((t) => {
        if (t.id === task.parentId && t.status === "COMPLETE") {
          return { ...t, status: "DONE" }; // Revert parent to DONE
        }
        return t;
      });
      tasks = propagateStatus(tasks, task.parentId); // Recursively propagate
    }
  
    return tasks;
  };

  const editTask = (id: number, newName: string, newParentId?: number) => {
    setTasks((prevTasks) => {
      const task = prevTasks.find((t) => t.id === id);
      if (!task) return prevTasks;

      // Prevent circular dependencies
      if (newParentId && detectCircularDependency(newParentId, id)) {
        alert("Circular dependency detected. Task update aborted.");
        return prevTasks;
      }

      const updatedTasks = prevTasks.map((t) =>
        t.id === id ? { ...t, name: newName, parentId: newParentId } : t
      );

      // Update old parent dependencies
      if (task.parentId) {
        updatedTasks.forEach((t) => {
          if (t.id === task.parentId) {
            t.dependencies = t.dependencies.filter((depId) => depId !== id);
          }
        });
      }

      // Add task to new parent dependencies
      if (newParentId) {
        updatedTasks.forEach((t) => {
          if (t.id === newParentId) {
            t.dependencies.push(id);
          }
        });
      }

      return propagateStatus(updatedTasks, id);
    });
  };

  const removeTask = (taskId: number) => {
    setTasks((prevTasks) => {
      const taskToRemove = prevTasks.find((t) => t.id === taskId);
      if (!taskToRemove) return prevTasks;
  
      let updatedTasks = prevTasks.filter((t) => t.id !== taskId);
  
      // Remove the task from its parent's dependencies
      if (taskToRemove.parentId) {
        updatedTasks = updatedTasks.map((t) =>
          t.id === taskToRemove.parentId
            ? { ...t, dependencies: t.dependencies.filter((depId) => depId !== taskId) }
            : t
        );
      }
  
      // Remove the task from all other tasks' dependencies
      updatedTasks = updatedTasks.map((t) => ({
        ...t,
        dependencies: t.dependencies.filter((depId) => depId !== taskId),
      }));
  
      // Propagate status to parent if applicable
      if (taskToRemove.parentId) {
        updatedTasks = propagateStatus(updatedTasks, taskToRemove.parentId);
      }
  
      return updatedTasks;
    });
  };

  // Flatten tasks (including children) and apply pagination
  const flattenTasks = (tasks: Task[]) => {
    const result: Task[] = [];
  
    // Helper function to flatten tasks recursively
    const flatten = (task: Task) => {
      if (!result.some((t) => t.id === task.id)) {
        result.push(task); // Add task to the list
      }
  
      // Flatten all child tasks (dependencies)
      const children = tasks.filter((t) => t.parentId === task.id);
      children.forEach(flatten); // Recursively flatten child tasks
    };
  
    // Start flattening the root tasks (tasks with no parent)
    tasks.filter((t) => !t.parentId).forEach(flatten);
  
    return result;
  };

  // Get tasks to display based on pagination
  const flattenedTasks = flattenTasks(tasks);
  const paginatedTasks = flattenedTasks.slice(
    (currentPage - 1) * tasksPerPage,
    currentPage * tasksPerPage
  );

  // Handle page changes
  const handlePageChange = (direction: "next" | "prev") => {
    if (direction === "next" && flattenedTasks.length > currentPage * tasksPerPage) {
      setCurrentPage(currentPage + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Task Manager
      </Typography>

      <TaskInput onAddTask={addTask} tasks={tasks} />

      <TaskList
        tasks={paginatedTasks}
        onToggleTask={toggleTaskStatus}
        onEditTask={editTask}
        onRemoveTask={removeTask}
      />

      <Box display="flex" justifyContent="center" gap={2}>
        <Button variant="outlined" onClick={() => handlePageChange("prev")} disabled={currentPage === 1}>
          Prev
        </Button>
        <Typography variant="body1">Page {currentPage}</Typography>
        <Button
          variant="outlined"
          onClick={() => handlePageChange("next")}
          disabled={flattenedTasks.length <= currentPage * tasksPerPage}
        >
          Next
        </Button>
      </Box>

    </Container>
  );
};

export default App;