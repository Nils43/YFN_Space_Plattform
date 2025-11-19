const express = require('express');
const db = require('./db');
const router = express.Router();


router.get('/', async (_req, res) => {
  const { rows: resources } = await db.query('SELECT * FROM resources ORDER BY id ASC');
  res.render('home', { title: 'DeskHub', resources });
});


router.get('/resources', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM resources ORDER BY id ASC');
  res.render('resources', { title: 'Ressourcen', resources: rows });
});


router.get('/bookings/new', async (_req, res) => {
  const { rows: resources } = await db.query('SELECT * FROM resources ORDER BY name ASC');
  res.render('bookings-new', { title: 'Jetzt buchen', resources, error: null, values: {} });
});

router.post('/bookings', async (req, res) => {
  try {
    const { user_name, resource_id, start_at, end_at } = req.body;

   
    if (!user_name || !resource_id || !start_at || !end_at) {
     
      return res.redirect('/?error=missing');
    }

    const start = new Date(start_at);
    const end = new Date(end_at);
    if (isNaN(start) || isNaN(end) || start >= end) {
     
      return res.redirect('/?error=invalid_time');
    }


    const conflictSQL = `
      SELECT 1 FROM bookings
      WHERE resource_id = $1
        AND $2::timestamptz < end_at
        AND start_at < $3::timestamptz
      LIMIT 1
    `;
    const conflict = await db.query(conflictSQL, [resource_id, start_at, end_at]);

    if (conflict.rowCount > 0) {
    
      return res.redirect('/?error=belegt');
    }

    await db.query(
      'INSERT INTO bookings(user_name, resource_id, start_at, end_at) VALUES ($1,$2,$3,$4)',
      [user_name, resource_id, start_at, end_at]
    );

 
    return res.redirect('/?ok=1');

  

  } catch (e) {
    console.error(e);
    return res.redirect('/?error=server');
  }
});




router.get('/me/bookings', async (req, res) => {
  const name = (req.query.name || '').toString();
  const { rows } = await db.query(
    `SELECT b.*, r.name as resource_name, r.type as resource_type
     FROM bookings b JOIN resources r ON r.id=b.resource_id
     WHERE user_name = $1
     ORDER BY start_at DESC`,
    [name]
  );
  res.render('my-bookings', { title: 'Meine Buchungen', name, bookings: rows });
});

module.exports = router;
