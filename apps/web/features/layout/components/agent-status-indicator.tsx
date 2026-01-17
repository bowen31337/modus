'use client';

import { useState } from 'react';
import { Circle, ChevronDown } from 'lucide-react';
import { Button } from '@modus/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@modus/ui';

export type AgentStatus = 'online' | 'busy' | 'offline';

interface AgentStatusIndicatorProps {
  currentStatus?: AgentStatus;
  onStatusChange?: (status: AgentStatus) => void;
}

const statusConfig = {
  online: {
    label: 'Online',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    description: 'Available for assignments',
  },
  busy: {
    label: 'Busy',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    description: 'Not accepting new assignments',
  },
  offline: {
    label: 'Offline',
    color: 'bg-slate-500',
    textColor: 'text-slate-400',
    description: 'Inactive',
  },
};

export function AgentStatusIndicator({
  currentStatus = 'online',
  onStatusChange,
}: AgentStatusIndicatorProps) {
  const [status, setStatus] = useState<AgentStatus>(currentStatus);

  const handleStatusChange = (newStatus: AgentStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const config = statusConfig[status];

  return (
    <div className="w-10 h-10 flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 relative"
            title={`Status: ${config.label}`}
            data-testid="agent-status-trigger"
          >
            <Circle
              size={16}
              className={`${config.color} fill-current`}
              data-testid="status-indicator"
            />
            <ChevronDown size={10} className="absolute bottom-1 right-1 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(statusConfig).map(([key, value]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => handleStatusChange(key as AgentStatus)}
              className="flex items-center gap-3 cursor-pointer"
              data-testid={`status-option-${key}`}
            >
              <Circle
                size={12}
                className={`${value.color} fill-current flex-shrink-0`}
              />
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${value.textColor}`}>
                  {value.label}
                </span>
                <span className="text-xs text-foreground-muted">
                  {value.description}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
