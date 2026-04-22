export type City = {
  id: string;
  nameAr: string;
  nameEn: string;
  createdAt?: any;
};

export type Category = {
  id: string;
  nameAr: string;
  nameEn: string;
  icon?: string;
  createdAt?: any;
};

export type ServiceStatus = 'open' | 'active' | 'confirming' | 'completed';

export interface User {
  _id: string;
  tokenIdentifier: string;
  name?: string;
  email?: string;
  bio?: string;
  photoUrl?: string;
  city?: City | string;
  points: number;
  ratingSum: number;
  ratingCount: number;
  isAdmin?: boolean;
}

export interface Service {
  id: string;
  requesterId: string;
  requesterName: string;
  providerId?: string;
  providerName?: string;
  title: string;
  description: string;
  category: Category | string;
  city: City | string;
  points: number;
  status: ServiceStatus;
  requesterConfirmed?: boolean;
  providerConfirmed?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  type?: 'text' | 'system';
}

export interface PointTransaction {
  _id: string;
  userId: string;
  amount: number;
  reason: string;
  relatedServiceId?: string;
  _creationTime: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'status_change' | 'point_transfer' | 'system';
  link?: string;
  read: boolean;
  createdAt: any;
}
