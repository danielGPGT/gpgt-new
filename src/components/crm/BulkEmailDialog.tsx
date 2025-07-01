import React, { useState, useMemo } from 'react';
import {
  Mail,
  Users,
  Send,
  Eye,
  EyeOff,
  FileText,
  User,
  Calendar,
  Building,
  MapPin,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Client } from '@/types/crm';

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClients: Client[];
  onSendEmails: (emailData: EmailCampaignData) => Promise<void>;
}

interface EmailCampaignData {
  subject: string;
  body: string;
  template: string;
  personalization: boolean;
  scheduledDate?: string;
  clientIds: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'follow-up',
    name: 'Follow-up Email',
    subject: 'Following up on your travel plans',
    body: `Hi {{firstName}},

I hope this email finds you well. I wanted to follow up on your recent travel inquiry and see if you have any questions about the options we discussed.

{{#if company}}I noticed you're traveling for {{company}} - I'd be happy to help arrange any business travel needs as well.{{/if}}

Please don't hesitate to reach out if you need any clarification or would like to explore additional options.

Best regards,
{{agentName}}`,
    description: 'Standard follow-up email for prospects'
  },
  {
    id: 'quote-reminder',
    name: 'Quote Reminder',
    subject: 'Your personalized travel quote is ready',
    body: `Hi {{firstName}},

I'm excited to share your personalized travel quote! I've put together some amazing options based on your preferences and requirements.

{{#if budgetPreference}}Your budget range of {{budgetPreference.currency}} {{budgetPreference.min}} - {{budgetPreference.max}} has been carefully considered in these recommendations.{{/if}}

Please review the attached quote and let me know if you'd like any adjustments or have questions.

I'm here to help make your travel dreams a reality!

Best regards,
{{agentName}}`,
    description: 'Reminder for clients with pending quotes'
  },
  {
    id: 'vip-update',
    name: 'VIP Client Update',
    subject: 'Exclusive travel opportunities for you',
    body: `Dear {{firstName}},

As one of our valued VIP clients, I wanted to personally share some exclusive travel opportunities that have just become available.

{{#if preferences.travelStyle}}Based on your preference for {{preferences.travelStyle}} travel, I think you'll find these options particularly appealing.{{/if}}

These are limited-time offers, so please let me know if you'd like to secure any of these experiences.

Thank you for your continued trust in our services.

Warm regards,
{{agentName}}`,
    description: 'Special offers for VIP clients'
  },
  {
    id: 'seasonal-promo',
    name: 'Seasonal Promotion',
    subject: 'Special seasonal travel offers just for you',
    body: `Hi {{firstName}},

I hope you're having a wonderful {{season}}! I wanted to share some special seasonal travel offers that I think you'll love.

{{#if preferences.preferredAirlines}}I've included options with your preferred airlines: {{preferences.preferredAirlines}}.{{/if}}

These offers are available for a limited time, so please let me know if you'd like to take advantage of any of these deals.

Happy travels!

Best regards,
{{agentName}}`,
    description: 'Seasonal promotions and offers'
  },
  {
    id: 'custom',
    name: 'Custom Email',
    subject: '',
    body: '',
    description: 'Write your own custom email'
  }
];

export function BulkEmailDialog({ 
  open, 
  onOpenChange, 
  selectedClients, 
  onSendEmails 
}: BulkEmailDialogProps) {
  const [activeTab, setActiveTab] = useState('compose');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('follow-up');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [personalization, setPersonalization] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const currentTemplate = useMemo(() => 
    EMAIL_TEMPLATES.find(t => t.id === selectedTemplate), 
    [selectedTemplate]
  );

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template && templateId !== 'custom') {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const replaceVariables = (text: string, client: Client): string => {
    return text
      .replace(/\{\{firstName\}\}/g, client.firstName)
      .replace(/\{\{lastName\}\}/g, client.lastName)
      .replace(/\{\{email\}\}/g, client.email || '')
      .replace(/\{\{company\}\}/g, client.company || '')
      .replace(/\{\{agentName\}\}/g, 'Your Travel Agent') // TODO: Get from user profile
      .replace(/\{\{season\}\}/g, getCurrentSeason())
      .replace(/\{\{budgetPreference\.currency\}\}/g, client.budgetPreference?.currency || 'USD')
      .replace(/\{\{budgetPreference\.min\}\}/g, client.budgetPreference?.min?.toString() || '')
      .replace(/\{\{budgetPreference\.max\}\}/g, client.budgetPreference?.max?.toString() || '')
      .replace(/\{\{preferences\.travelStyle\}\}/g, client.preferences?.travelStyle || '')
      .replace(/\{\{preferences\.preferredAirlines\}\}/g, client.preferences?.preferredAirlines?.join(', ') || '')
      .replace(/\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
        const field = condition.trim();
        if (field === 'company' && client.company) return content;
        if (field === 'budgetPreference' && client.budgetPreference) return content;
        if (field === 'preferences.travelStyle' && client.preferences?.travelStyle) return content;
        if (field === 'preferences.preferredAirlines' && client.preferences?.preferredAirlines?.length) return content;
        return '';
      });
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

  const getPreviewEmail = (client: Client) => {
    const previewSubject = personalization ? replaceVariables(subject, client) : subject;
    const previewBody = personalization ? replaceVariables(body, client) : body;
    return { subject: previewSubject, body: previewBody };
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in both subject and body');
      return;
    }

    try {
      setIsSending(true);
      await onSendEmails({
        subject,
        body,
        template: selectedTemplate,
        personalization,
        scheduledDate: scheduledDate || undefined,
        clientIds: selectedClients.map(c => c.id)
      });
      
      toast.success(`Email campaign sent to ${selectedClients.length} client(s)`);
      onOpenChange(false);
      
      // Reset form
      setSubject('');
      setBody('');
      setSelectedTemplate('follow-up');
      setScheduledDate('');
    } catch (error) {
      toast.error('Failed to send email campaign');
    } finally {
      setIsSending(false);
    }
  };

  const clientStats = useMemo(() => {
    const stats = {
      total: selectedClients.length,
      withEmail: selectedClients.filter(c => c.email).length,
      withoutEmail: selectedClients.filter(c => !c.email).length,
      active: selectedClients.filter(c => c.status === 'active').length,
      vip: selectedClients.filter(c => c.status === 'vip').length,
      prospect: selectedClients.filter(c => c.status === 'prospect').length
    };
    return stats;
  }, [selectedClients]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-y-auto sm:!max-w-[95vw] lg:!max-w-[90vw] xl:!max-w-[85vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Mail className="h-5 w-5 text-primary" />
            Bulk Email Campaign
          </DialogTitle>
          <DialogDescription>
            Send personalized emails to {selectedClients.length} selected client(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipients Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{clientStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Selected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{clientStats.withEmail}</div>
                  <div className="text-sm text-muted-foreground">With Email</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{clientStats.withoutEmail}</div>
                  <div className="text-sm text-muted-foreground">No Email</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{clientStats.vip}</div>
                  <div className="text-sm text-muted-foreground">VIP Clients</div>
                </div>
              </div>
              
              {clientStats.withoutEmail > 0 && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {clientStats.withoutEmail} client(s) don't have email addresses and will be skipped.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label>Email Template</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMAIL_TEMPLATES.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{template.name}</span>
                                <span className="text-xs text-muted-foreground">{template.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject..."
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label htmlFor="body">Email Body</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write your email content..."
                      className="mt-2 min-h-[200px]"
                    />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="personalization"
                        checked={personalization}
                        onChange={(e) => setPersonalization(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="personalization">Enable personalization</Label>
                    </div>
                    
                    {personalization && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium mb-2">Available Variables:</div>
                        <div className="flex flex-wrap gap-2">
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">&#123;&#123;firstName&#125;&#125;</code>
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">&#123;&#123;lastName&#125;&#125;</code>
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">&#123;&#123;email&#125;&#125;</code>
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">&#123;&#123;company&#125;&#125;</code>
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">&#123;&#123;agentName&#125;&#125;</code>
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">&#123;&#123;season&#125;&#125;</code>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="scheduledDate">Schedule Send (Optional)</Label>
                      <Input
                        id="scheduledDate"
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Email Preview</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      {previewMode ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                      {previewMode ? 'Hide' : 'Show'} Personalization
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {selectedClients.slice(0, 2).map((client, index) => {
                      const preview = getPreviewEmail(client);
                      return (
                        <Card key={client.id} className="border">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {client.firstName} {client.lastName}
                              </span>
                              {client.email && <Badge variant="secondary">{client.email}</Badge>}
                              {!client.email && (
                                <Badge variant="destructive">No Email</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium">Subject:</Label>
                              <div className="text-sm bg-muted/30 p-2 rounded mt-1">
                                {preview.subject}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Body:</Label>
                              <div className="text-sm bg-muted/30 p-2 rounded mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {preview.body}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {selectedClients.length > 2 && (
                    <div className="text-center text-sm text-muted-foreground mt-4">
                      + {selectedClients.length - 2} more recipients...
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {client.firstName} {client.lastName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {client.company || 'No company'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={client.status === 'vip' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                          {client.email ? (
                            <Badge variant="outline">{client.email}</Badge>
                          ) : (
                            <Badge variant="destructive">No Email</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || !subject.trim() || !body.trim() || clientStats.withEmail === 0}
          >
            {isSending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {clientStats.withEmail} Client(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 