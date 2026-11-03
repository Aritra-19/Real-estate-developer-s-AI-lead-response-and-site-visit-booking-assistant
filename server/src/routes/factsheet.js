import express from 'express';

export function createFactSheetRouter(db) {
  const router = express.Router();

  // 1. Get fact sheet for a project
  router.get('/:projectId', (req, res) => {
    try {
      const { projectId } = req.params;
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const factSheet = db.prepare('SELECT * FROM fact_sheets WHERE project_id = ?').get(projectId);

      res.json({
        success: true,
        project,
        fact_sheet: {
          ...factSheet,
          approved_amenities: JSON.parse(factSheet?.approved_amenities || '[]'),
          specifications: JSON.parse(factSheet?.specifications || '{}'),
          payment_plans: JSON.parse(factSheet?.payment_plans || '[]'),
          frequently_asked: JSON.parse(factSheet?.frequently_asked || '[]')
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Update fact sheet (Admin Editor)
  router.put('/:projectId', (req, res) => {
    try {
      const { projectId } = req.params;
      const {
        pricing_policy,
        approved_amenities,
        specifications,
        payment_plans,
        prohibited_claims,
        frequently_asked
      } = req.body;

      const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      db.prepare(`
        UPDATE fact_sheets
        SET pricing_policy = COALESCE(?, pricing_policy),
            approved_amenities = COALESCE(?, approved_amenities),
            specifications = COALESCE(?, specifications),
            payment_plans = COALESCE(?, payment_plans),
            prohibited_claims = COALESCE(?, prohibited_claims),
            frequently_asked = COALESCE(?, frequently_asked),
            updated_at = datetime('now')
        WHERE project_id = ?
      `).run(
        pricing_policy || null,
        approved_amenities ? JSON.stringify(approved_amenities) : null,
        specifications ? JSON.stringify(specifications) : null,
        payment_plans ? JSON.stringify(payment_plans) : null,
        prohibited_claims || null,
        frequently_asked ? JSON.stringify(frequently_asked) : null,
        projectId
      );

      const updated = db.prepare('SELECT * FROM fact_sheets WHERE project_id = ?').get(projectId);

      res.json({
        success: true,
        message: 'Fact sheet updated successfully. AI assistant knowledge updated immediately.',
        fact_sheet: {
          ...updated,
          approved_amenities: JSON.parse(updated.approved_amenities || '[]'),
          specifications: JSON.parse(updated.specifications || '{}'),
          payment_plans: JSON.parse(updated.payment_plans || '[]'),
          frequently_asked: JSON.parse(updated.frequently_asked || '[]')
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

export default createFactSheetRouter;
