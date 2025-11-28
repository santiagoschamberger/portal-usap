import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface LeadFiltersProps {
  filters: {
    search: string;
    status: string;
    dateRange: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export function LeadFilters({ filters, onFilterChange }: LeadFiltersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
        <CardDescription>
          Filter leads by various criteria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Label htmlFor="search" className="mb-2 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Search by name, company..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="status" className="mb-2 block">Status</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9a132d] focus:border-transparent text-sm bg-background"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pre-Vet / New Lead">Pre-Vet / New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Sent for Signature / Submitted">Sent for Signature / Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
              <option value="Dead / Withdrawn">Dead / Withdrawn</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="dateRange" className="mb-2 block">Date Range</Label>
            <select
              id="dateRange"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9a132d] focus:border-transparent text-sm bg-background"
              value={filters.dateRange}
              onChange={(e) => onFilterChange('dateRange', e.target.value)}
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

