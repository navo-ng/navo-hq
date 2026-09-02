import { SupabaseClient } from "@supabase/supabase-js";

export interface CustomFieldDefinition {
  id: string;
  entity_type: "task" | "project";
  name: string;
  field_type: "text" | "number" | "date" | "select" | "checkbox";
  options: string[] | null;
  position: number;
  created_at: string;
}

export interface CustomFieldValue {
  id: string;
  field_id: string;
  entity_id: string;
  value: string | null;
  created_at: string;
}

export async function fetchCustomFieldDefinitions(
  supabase: SupabaseClient,
  entityType: "task" | "project"
): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("entity_type", entityType)
    .order("position");

  if (error) {
    console.error("Error fetching custom field definitions:", error);
    return [];
  }

  return (data || []).map((d) => ({
    ...d,
    options: d.options || null,
  }));
}

export async function createCustomFieldDefinition(
  supabase: SupabaseClient,
  input: Omit<CustomFieldDefinition, "id" | "created_at">
): Promise<CustomFieldDefinition | null> {
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .insert({
      entity_type: input.entity_type,
      name: input.name,
      field_type: input.field_type,
      options: input.options,
      position: input.position,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating custom field definition:", error);
    return null;
  }

  return data;
}

export async function updateCustomFieldDefinition(
  supabase: SupabaseClient,
  id: string,
  input: Partial<Omit<CustomFieldDefinition, "id" | "created_at">>
): Promise<void> {
  const { error } = await supabase
    .from("custom_field_definitions")
    .update(input)
    .eq("id", id);

  if (error) {
    console.error("Error updating custom field definition:", error);
  }
}

export async function deleteCustomFieldDefinition(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("custom_field_definitions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting custom field definition:", error);
  }
}

export async function reorderCustomFieldDefinitions(
  supabase: SupabaseClient,
  ids: string[]
): Promise<void> {
  const updates = ids.map((id, index) =>
    supabase
      .from("custom_field_definitions")
      .update({ position: index })
      .eq("id", id)
  );
  await Promise.all(updates);
}

export async function fetchCustomFieldValues(
  supabase: SupabaseClient,
  entityType: "task" | "project",
  entityId: string
): Promise<Record<string, string | null>> {
  const { data: fields, error: fieldsError } = await supabase
    .from("custom_field_definitions")
    .select("id")
    .eq("entity_type", entityType);

  if (fieldsError || !fields || fields.length === 0) return {};

  const fieldIds = fields.map((f) => f.id);

  const { data: values, error: valuesError } = await supabase
    .from("custom_field_values")
    .select("field_id, value")
    .in("field_id", fieldIds)
    .eq("entity_id", entityId);

  if (valuesError || !values) return {};

  const result: Record<string, string | null> = {};
  for (const v of values) {
    result[v.field_id] = v.value;
  }
  return result;
}

export async function saveCustomFieldValues(
  supabase: SupabaseClient,
  entityId: string,
  values: Record<string, string | null>
): Promise<void> {
  const entries = Object.entries(values).filter(([_, v]) => v !== null && v !== undefined);

  for (const [fieldId, value] of entries) {
    const { error } = await supabase
      .from("custom_field_values")
      .upsert(
        { field_id: fieldId, entity_id: entityId, value },
        { onConflict: "field_id,entity_id" }
      );

    if (error) {
      console.error("Error saving custom field value:", error);
    }
  }

  // Remove fields set to null
  const nullFields = Object.entries(values).filter(([_, v]) => v === null || v === undefined);
  for (const [fieldId] of nullFields) {
    await supabase
      .from("custom_field_values")
      .delete()
      .eq("field_id", fieldId)
      .eq("entity_id", entityId);
  }
}
