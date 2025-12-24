import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Settings, Plus, GripVertical, Trash2, ChevronDown, Type, Hash, Mail, Calendar, AlignLeft, CheckSquare } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField, FieldType } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formService } from '@/services/form.service';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const fieldTypeOptions: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Short Text' },
  { type: 'number', label: 'Number' },
  { type: 'email', label: 'Email' },
  { type: 'dropdown', label: 'Dropdown' },
  { type: 'date', label: 'Date' },
  { type: 'textarea', label: 'Long Text' },
  { type: 'checkbox', label: 'Checkbox' },
];

const fieldIcons: Record<FieldType, React.ElementType> = {
  text: Type,
  number: Hash,
  email: Mail,
  dropdown: ChevronDown,
  date: Calendar,
  textarea: AlignLeft,
  checkbox: CheckSquare,
};

export default function FormBuilder() {
  const { formId } = useParams<{ formId?: string }>();
  const isEditMode = Boolean(formId);

  const [formName, setFormName] = useState('Untitled Form');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState('fields');

  const { toast } = useToast();
  const navigate = useNavigate();

  // Load existing form if editing
  const { data: existingForm, isLoading: loadingForm } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => formService.getById(formId!),
    enabled: isEditMode
  });

  // Populate form data when editing
  useEffect(() => {
    if (existingForm && isEditMode) {
      setFormName(existingForm.name || 'Untitled Form');
      setFormDescription(existingForm.description || '');
      // Get fields from schema
      const schema = existingForm.schema as any;
      if (schema?.fields) {
        setFields(schema.fields);
      }
    }
  }, [existingForm, isEditMode]);

  const createFormMutation = useMutation({
    mutationFn: (data: any) => formService.create(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Form created successfully' });
      navigate('/forms');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create form', variant: 'destructive' });
    }
  });

  const updateFormMutation = useMutation({
    mutationFn: (data: any) => formService.update(formId!, data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Form updated successfully' });
      navigate('/forms');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update form', variant: 'destructive' });
    }
  });

  const handleSave = () => {
    const formData = {
      name: formName,
      description: formDescription,
      schema: {
        fields: fields
      },
      permissions: {
        canView: ['admin', 'manager', 'user'],
        canSubmit: ['admin', 'manager', 'user'],
        canApprove: ['admin', 'manager']
      }
    };

    if (isEditMode) {
      updateFormMutation.mutate(formData);
    } else {
      createFormMutation.mutate(formData);
    }
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      name: `field_${Date.now()}`,
      placeholder: '',
      validation: [],
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
    setSelectedField(newField);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Sortable Field Component
  const SortableField = ({ field }: { field: FormField }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: field.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const Icon = fieldIcons[field.type];
    const isSelected = selectedField?.id === field.id;

    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => setSelectedField(field)}
        className={`group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${isDragging
          ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
          : isSelected
            ? 'border-primary bg-accent'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{field.label}</p>
          <p className="text-xs text-muted-foreground capitalize">{field.type}</p>
        </div>
        {field.validation.some(v => v.type === 'required') && (
          <Badge variant="outline" className="text-[10px]">Required</Badge>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            removeField(field.id);
          }}
          className="opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/forms">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-auto border-0 bg-transparent p-0 text-2xl font-semibold focus-visible:ring-0"
                placeholder="Form Name"
              />
              <p className="text-sm text-muted-foreground">
                Drag and drop fields to build your form
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open('/forms/' + (formId || 'preview'), '_blank')} disabled={!formId}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={createFormMutation.isPending || updateFormMutation.isPending}>
              {(createFormMutation.isPending || updateFormMutation.isPending) ? 'Saving...' : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Update Form' : 'Save Form'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Builder Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Field Palette */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Field Types</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {fieldTypeOptions.map(({ type, label }) => {
                const Icon = fieldIcons[type];
                return (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm transition-all hover:border-primary hover:bg-accent"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Form Canvas */}
          <Card className="lg:col-span-5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Form Canvas</CardTitle>
                <Badge variant="secondary">{fields.length} fields</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 py-16 text-center">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Plus className="h-10 w-10 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Start Building Your Form</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                    Click any field type from the left panel to add it to your form
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline">1. Click a field type</Badge>
                    <Badge variant="outline">2. Configure in right panel</Badge>
                    <Badge variant="outline">3. Save your form</Badge>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={fields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {fields.map((field) => (
                        <SortableField key={field.id} field={field} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Field Properties */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Field Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedField ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="fields" className="flex-1">General</TabsTrigger>
                    <TabsTrigger value="validation" className="flex-1">Validation</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fields" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-label">Label</Label>
                      <Input
                        id="field-label"
                        value={selectedField.label}
                        onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-name">Field Name</Label>
                      <Input
                        id="field-name"
                        value={selectedField.name}
                        onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used as the key in form data
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-placeholder">Placeholder</Label>
                      <Input
                        id="field-placeholder"
                        value={selectedField.placeholder || ''}
                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-help">Help Text</Label>
                      <Textarea
                        id="field-help"
                        value={selectedField.helpText || ''}
                        onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="validation" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Required</Label>
                        <p className="text-xs text-muted-foreground">
                          Field must be filled
                        </p>
                      </div>
                      <Switch
                        checked={selectedField.validation.some(v => v.type === 'required')}
                        onCheckedChange={(checked) => {
                          const validation = checked
                            ? [...selectedField.validation, { type: 'required' as const, message: `${selectedField.label} is required` }]
                            : selectedField.validation.filter(v => v.type !== 'required');
                          updateField(selectedField.id, { validation });
                        }}
                      />
                    </div>
                    <Separator />
                    {selectedField.type === 'text' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="min-length">Minimum Length</Label>
                          <Input id="min-length" type="number" placeholder="No minimum" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-length">Maximum Length</Label>
                          <Input id="max-length" type="number" placeholder="No maximum" />
                        </div>
                      </>
                    )}
                    {selectedField.type === 'number' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="min-value">Minimum Value</Label>
                          <Input id="min-value" type="number" placeholder="No minimum" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-value">Maximum Value</Label>
                          <Input id="max-value" type="number" placeholder="No maximum" />
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Settings className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a field to edit its properties
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
