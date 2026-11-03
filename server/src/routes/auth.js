import express from 'express';

export function createAuthRouter(db) {
  const router = express.Router();

  // 1. List available staff / demo profiles
  router.get('/profiles', (req, res) => {
    try {
      const staff = db.prepare('SELECT id, name, email, role, phone, avatar, active_leads_count FROM users').all();
      res.json({ success: true, staff });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Mock Login / Switch Active Role
  router.post('/login', (req, res) => {
    try {
      const { role, user_id } = req.body;

      if (user_id) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        return res.json({ success: true, user, role: user.role });
      }

      if (role === 'buyer') {
        return res.json({
          success: true,
          role: 'buyer',
          user: {
            id: 'buyer-guest',
            name: 'Prospective Buyer',
            role: 'buyer'
          }
        });
      }

      // Default to sales head if role is sales_head or admin
      const targetRole = role || 'sales_head';
      const user = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(targetRole)
        || db.prepare('SELECT * FROM users LIMIT 1').get();

      res.json({ success: true, user, role: user?.role || 'sales_head' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

export default createAuthRouter;
