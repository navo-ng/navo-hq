"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  CustomFieldDefinition,
  fetchCustomFieldDefinitions,
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  reorderCustomFieldDefinitions,
} from "@/lib/data/custom-fields";

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldDefinition["field_type"]>("text");
  const [newFieldEntityType, setNewFieldEntityType] = useState<"task" | "project">("task");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    setIsLoading(true);
    const taskFields = await fetchCustomFieldDefinitions(supabase, "task");
    const projectFields = await fetchCustomFieldDefinitions(supabase, "project");
    setFields([...taskFields, ...projectFields].sort((a, b) => a.position - b.position));
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!newFieldName.trim()) return;

    const options = newFieldType === "select" && newFieldOptions.trim()
      ? newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean)
      : null;

    await createCustomFieldDefinition(supabase, {
      entity_type: newFieldEntityType,
      name: newFieldName.trim(),
      field_type: newFieldType,
      options,
      position: fields.length,
    });

    setNewFieldName("");
    setNewFieldType("text");
    setNewFieldOptions("");
    setCreateDialogOpen(false);
    loadFields();
  };

  const handleUpdate = async () => {
    if (!editingField || !editingField.name.trim()) return;

    const options = editingField.field_type === "select" && editingField.options
      ? editingField.options
      : null;

    await updateCustomFieldDefinition(supabase, editingField.id, {
      name: editingField.name.trim(),
      field_type: editingField.field_type,
      options,
    });

    setEditingField(null);
    loadFields();
  };

  const handleDelete = async (id: string) => {
    await deleteCustomFieldDefinition(supabase, id);
    setDeleteConfirm(null);
    loadFields();
  };

  const handleReorder = async (dragIndex: number, dropIndex: number) => {
    const newFields = [...fields];
    const [dragged] = newFields.splice(dragIndex, 1);
    newFields.splice(dropIndex, 0, dragged);
    setFields(newFields);
    await reorderCustomFieldDefinitions(supabase, newFields.map((f) => f.id));
  };

  const taskFields = fields.filter((f) => f.entity_type === "task");
  const projectFields = fields.filter((f) => f.entity_type === "project");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Custom Fields
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage custom fields for tasks and projects
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
          <Plus size={16} />
          Add Field
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : (
        <>
          {taskFields.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Task Fields
              </h2>
              {taskFields.map((field, index) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  index={index}
                  totalCount={taskFields.length}
                  onEdit={setEditingField}
                  onDelete={setDeleteConfirm}
                  onReorder={handleReorder}
                />
              ))}
            </div>
          )}

          {projectFields.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Fields
              </h2>
              {projectFields.map((field, index) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  index={index + taskFields.length}
                  totalCount={projectFields.length}
                  onEdit={setEditingField}
                  onDelete={setDeleteConfirm}
                  onReorder={handleReorder}
                />
              ))}
            </div>
          )}

          {fields.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No custom fields yet. Create your first field to get started.
              </p>
            </div>
          )}
        </>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} title="Add Custom Field">
        <div className="space-y-4">
          <Input
            label="Field Name"
            placeholder="e.g., Priority Level"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
          />
          <Select
            label="Entity Type"
            value={newFieldEntityType}
            onChange={(e) => setNewFieldEntityType(e.target.value as "task" | "project")}
            options={[
              { value: "task", label: "Task" },
              { value: "project", label: "Project" },
            ]}
          />
          <Select
            label="Field Type"
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value as CustomFieldDefinition["field_type"])}
            options={[
              { value: "text", label: "Text" },
              { value: "number", label: "Number" },
              { value: "date", label: "Date" },
              { value: "select", label: "Select" },
              { value: "checkbox", label: "Checkbox" },
            ]}
          />
          {newFieldType === "select" && (
            <Input
              label="Options (comma-separated)"
              placeholder="Option 1, Option 2, Option 3"
              value={newFieldOptions}
              onChange={(e) => setNewFieldOptions(e.target.value)}
            />
          )}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Field</Button>
          </div>
        </div>
      </Dialog>

      {editingField && (
        <Dialog open={true} onClose={() => setEditingField(null)} title="Edit Custom Field">
          <div className="space-y-4">
            <Input
              label="Field Name"
              value={editingField.name}
              onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
            />
            <Select
              label="Field Type"
              value={editingField.field_type}
              onChange={(e) =>
                setEditingField({
                  ...editingField,
                  field_type: e.target.value as CustomFieldDefinition["field_type"],
                })
              }
              options={[
                { value: "text", label: "Text" },
                { value: "number", label: "Number" },
                { value: "date", label: "Date" },
                { value: "select", label: "Select" },
                { value: "checkbox", label: "Checkbox" },
              ]}
            />
            {editingField.field_type === "select" && (
              <Input
                label="Options (comma-separated)"
                value={editingField.options?.join(", ") || ""}
                onChange={(e) =>
                  setEditingField({
                    ...editingField,
                    options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                  })
                }
              />
            )}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button variant="secondary" onClick={() => setEditingField(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        </Dialog>
      )}

      {deleteConfirm && (
        <Dialog open={true} onClose={() => setDeleteConfirm(null)} title="Delete Field">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this custom field? All values for this field will be removed.
            </p>
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function FieldRow({
  field,
  index,
  totalCount,
  onEdit,
  onDelete,
  onReorder,
}: {
  field: CustomFieldDefinition;
  index: number;
  totalCount: number;
  onEdit: (field: CustomFieldDefinition) => void;
  onDelete: (id: string) => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-1 text-gray-400">
        {index > 0 && (
          <button
            onClick={() => onReorder(index, index - 1)}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ↑
          </button>
        )}
        {index < totalCount - 1 && (
          <button
            onClick={() => onReorder(index, index + 1)}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ↓
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{field.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {field.field_type} · {field.entity_type}
          {field.options && field.options.length > 0 && ` · ${field.options.length} options`}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => onEdit(field)}>
        Edit
      </Button>
      <Button variant="danger" size="sm" onClick={() => onDelete(field.id)}>
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
