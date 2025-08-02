import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Mock user database (replace with actual database)
const users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '$2a$10$K9g5q8vGzHJ7nQ2xM3L4AeKtVzDj7eGbOvW4hL9pK8xC2vJ1hT6I6', // 'password'
    name: 'Admin User',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
];

// GET /api/users/profile
router.get('/profile', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = users.find(u => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/profile
router.put('/profile', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { name } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user?.id);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name) {
      users[userIndex].name = name;
    }

    res.json({
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        name: users[userIndex].name,
        createdAt: users[userIndex].createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
