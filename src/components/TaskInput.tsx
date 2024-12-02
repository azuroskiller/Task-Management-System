import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";

interface TaskInputProps {
  onAddTask: (name: string, parentId?: number) => void;
  tasks: { id: number; name: string }[]; // Add existing tasks to validate parentId
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, tasks }) => {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = () => {
    // Check if the parentId is valid if provided
    if (parentId && !tasks.some((task) => task.id === parentId)) {
      setError("Parent ID does not exist.");
      return;
    }

    if (name.trim()) {
      onAddTask(name, parentId);

      // Reset
      setName("");
      setParentId(undefined);
      setError(null); 
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={2} mb={4}>
      <TextField
        label="Task Name"
        variant="outlined"
        size="small"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <TextField
        label="Parent ID"
        variant="outlined"
        size="small"
        type="number"
        value={parentId || ""}
        onChange={(e) => setParentId(Number(e.target.value) || undefined)}
        error={!!error} // Show error if there is one
        helperText={error} // Display the error message
      />

      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Add Task
      </Button>
    </Box>
  );
};

export default TaskInput;
