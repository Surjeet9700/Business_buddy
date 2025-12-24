import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formService } from '@/services/form.service';
import { submissionService } from '@/services/submission.service';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function FormSubmissionPage() {
    const { formId } = useParams<{ formId: string }>();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Fetch form details
    const { data: form, isLoading } = useQuery({
        queryKey: ['form', formId],
        queryFn: () => formService.getById(formId!),
        enabled: !!formId
    });

    // Submit mutation
    const submitMutation = useMutation({
        mutationFn: (data: any) => submissionService.create({
            formId: formId!,
            data: data,
            submitNow: true
        }),
        onSuccess: () => {
            toast.success('Form submitted successfully!');
            navigate('/submissions');
        },
        onError: () => {
            toast.error('Failed to submit form');
        }
    });

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        const fields = form?.schema?.fields || [];
        const requiredFields = fields.filter((f: any) =>
            f.validation?.some((v: any) => v.type === 'required')
        );

        for (const field of requiredFields) {
            if (!formData[field.name]) {
                toast.error(`${field.label} is required`);
                return;
            }
        }

        submitMutation.mutate(formData);
    };

    const renderField = (field: any) => {
        const value = formData[field.name] || '';
        const isRequired = field.validation?.some((v: any) => v.type === 'required');

        switch (field.type) {
            case 'text':
            case 'email':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={value}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={isRequired}
                        />
                        {field.helpText && (
                            <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                    </div>
                );

            case 'number':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                            id={field.name}
                            type="number"
                            placeholder={field.placeholder}
                            value={value}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={isRequired}
                        />
                        {field.helpText && (
                            <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Textarea
                            id={field.name}
                            placeholder={field.placeholder}
                            value={value}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={isRequired}
                            rows={4}
                        />
                        {field.helpText && (
                            <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                    </div>
                );

            case 'date':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                            id={field.name}
                            type="date"
                            value={value}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={isRequired}
                        />
                        {field.helpText && (
                            <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={field.name}
                            checked={value === true}
                            onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
                        />
                        <Label htmlFor={field.name} className="cursor-pointer">
                            {field.label}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                    </div>
                );

            case 'dropdown':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {isRequired && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
                            <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || 'Select an option'} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option: string, idx: number) => (
                                    <SelectItem key={idx} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {field.helpText && (
                            <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Loading form...</p>
                </div>
            </AppLayout>
        );
    }

    if (!form) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Form not found</p>
                </div>
            </AppLayout>
        );
    }

    const fields = form.schema?.fields || [];

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/forms')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">{form.name}</h1>
                        {form.description && (
                            <p className="text-sm text-muted-foreground">{form.description}</p>
                        )}
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fill out the form</CardTitle>
                        <CardDescription>
                            Fields marked with <span className="text-destructive">*</span> are required
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {fields.map((field: any) => renderField(field))}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => navigate('/forms')}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitMutation.isPending}>
                                    {submitMutation.isPending ? (
                                        'Submitting...'
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Submit Form
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
