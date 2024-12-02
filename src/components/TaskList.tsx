import React from "react";
import { Checkbox, List, ListItem, ListItemText, Typography, Box, Button, TextField } from "@mui/material";
import { Task } from "../models/Task";

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: number) => void;
  onEditTask: (id: number, name: string, parentId?: number) => void;
  onRemoveTask: (id: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleTask, onEditTask, onRemoveTask }) => {

  const [editingTaskId, setEditingTaskId] = React.useState<number | null>(null);
  const [editedName, setEditedName] = React.useState<string>("");
  const [editedParentId, setEditedParentId] = React.useState<number | undefined>(undefined);
  const renderedTasks = new Set<number>(); // Track rendered tasks to prevent duplicates

  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setEditedName(task.name);
    setEditedParentId(task.parentId);
  };

  const handleSaveClick = (taskId: number) => {
    onEditTask(taskId, editedName, editedParentId);
    setEditingTaskId(null);
  };

  // Render task, ensuring no task is rendered twice
  const renderTask = (task: Task) => {
    // Skip rendering this task if it's already rendered
    if (renderedTasks.has(task.id)) return null;
    renderedTasks.add(task.id);

    const dependencies = tasks.filter((t) => task.dependencies.includes(t.id));

    return (
      <ListItem key={task.id} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>

        <Box display="flex" alignItems="center" width="100%">
          <Checkbox checked={task.status !== "IN_PROGRESS"} onChange={() => onToggleTask(task.id)} />

          {editingTaskId === task.id ? (
            <Box display="flex" gap={1} alignItems="center">

              <TextField
                label="Task Name"
                variant="outlined"
                size="small"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />

              <TextField
                label="Parent ID"
                variant="outlined"
                size="small"
                type="number"
                value={editedParentId || ""}
                onChange={(e) => setEditedParentId(Number(e.target.value) || undefined)}
              />

              <Button variant="contained" color="primary" onClick={() => handleSaveClick(task.id)}>
                Save
              </Button>
              <Button variant="outlined" onClick={() => setEditingTaskId(null)}>
                Cancel
              </Button>

            </Box>
          ) : (
            <Box display="flex" justifyContent="space-between" width="100%">

              <ListItemText
                primary={<Typography variant="h6">{task.name}</Typography>}
                secondary={
                  <>
                    <Typography variant="body2">ID: {task.id} - Status: {task.status}</Typography>
                    <Typography variant="body2">
                      Dependencies: {task.dependencies.length} | Done: {dependencies.filter((dep) => dep.status === "DONE").length} | Complete: {dependencies.filter((dep) => dep.status === "COMPLETE").length}
                    </Typography>
                  </>
                  
                }
              />

              <Button variant="text" color="primary" onClick={() => handleEditClick(task)}>
                Edit
              </Button>
              <Button variant="text" color="error" onClick={() => onRemoveTask(task.id)}>
                Remove
              </Button>

            </Box>
          )}
        </Box>
        
        {dependencies.length > 0 && (
          <List sx={{ pl: 4, width: "100%" }}>
            {dependencies.map(renderTask)} {/* Render child tasks */}
          </List>
        )}
      </ListItem>
    );
  };

  return (
    <List>
      {tasks.map(renderTask)} {/* Render paginated tasks */}
    </List>
  );
};

export default TaskList;
