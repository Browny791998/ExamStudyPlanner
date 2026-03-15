export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  targetExam?: string;
  examDate?: Date;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  targetExam?: string;
  examDate?: Date;
  role?: 'user' | 'admin';
}
