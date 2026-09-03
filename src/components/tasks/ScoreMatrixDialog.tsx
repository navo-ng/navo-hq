"use client";

import { Dialog } from "@/components/ui/dialog";
import { ScoreMatrix } from "./ScoreMatrix";
import { Task } from "@/types/task";

interface ScoreMatrixDialogProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function ScoreMatrixDialog({
  open,
  onClose,
  tasks,
  onTaskClick,
}: ScoreMatrixDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Impact / Effort Matrix" maxWidth="lg">
      <div className="max-h-[70vh] overflow-auto">
        <ScoreMatrix tasks={tasks} onTaskClick={onTaskClick} />
      </div>
    </Dialog>
  );
}
