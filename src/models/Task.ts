export interface Task {
    id: number;
    name: string;
    status: "IN_PROGRESS" | "DONE" | "COMPLETE";
    parentId?: number; // Optional parent task ID
    dependencies: number[]; // IDs of dependent tasks
}