import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Edit, Mail, MessageCircle } from 'lucide-react';
import { 
  type AutomationRule, 
  automationTypeLabels, 
  automationTypeIcons,
  useUpdateAutomationRule,
  useDeleteAutomationRule 
} from '@/hooks/useAutomation';

interface AutomationRuleCardProps {
  rule: AutomationRule;
  onEdit?: (rule: AutomationRule) => void;
}

export function AutomationRuleCard({ rule, onEdit }: AutomationRuleCardProps) {
  const updateRule = useUpdateAutomationRule();
  const deleteRule = useDeleteAutomationRule();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleActive = () => {
    updateRule.mutate({ id: rule.id, is_active: !rule.is_active });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteRule.mutateAsync(rule.id);
    setIsDeleting(false);
  };

  const getTriggerText = () => {
    if (rule.trigger_days === null) return 'Imediato';
    if (rule.trigger_days === 0) return 'No dia';
    if (rule.trigger_days < 0) return `${Math.abs(rule.trigger_days)} dias antes`;
    return `${rule.trigger_days} dias depois`;
  };

  return (
    <Card className={`card-glow transition-opacity ${!rule.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{automationTypeIcons[rule.type]}</span>
            <div>
              <CardTitle className="text-base">{rule.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {automationTypeLabels[rule.type]}
                </Badge>
                <span className="text-xs">•</span>
                <span className="text-xs">{getTriggerText()}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={rule.is_active} 
              onCheckedChange={handleToggleActive}
              disabled={updateRule.isPending}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(rule)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {rule.channel === 'email' ? (
              <Mail className="h-4 w-4 text-muted-foreground" />
            ) : (
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{rule.subject}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {rule.message_template}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
