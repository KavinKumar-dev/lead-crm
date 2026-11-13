export interface AdminClientRow {
  clientId: string;
  clientCode: string;
  clientName: string;
  businessName: string;
  status: string;
  total: number;
  converted: number;
  pending: number;
  lost: number;
  conversionRate: number;
  overdue: number;
}
