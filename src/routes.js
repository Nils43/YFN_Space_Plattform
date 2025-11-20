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


function generateWeekSlots({ mondayDate, startHour = 9, endHour = 15, stepMin = 30, resourceId = 1, busyIntervals = [] }) {
  const days = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const result = [];

  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(mondayDate);
    dayDate.setDate(mondayDate.getDate() + d);
    const dayLabel = days[d];
    const slots = [];

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += stepMin) {
        const start = new Date(dayDate);
        start.setHours(h, m, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + stepMin);

      
        const isBusy = busyIntervals.some(({ start: bs, end: be }) => start < be && bs < end);

        slots.push({
          resource_id: resourceId,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          label: `${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}–${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`,
          busy: isBusy
        });
      }
    }
    result.push({ dayLabel, slots });
  }
  return result;
}


function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() - diffToMonday);
  return date;
}

router.get('/api/calendar', async (req, res) => {
  try {

    const resourceIds = (req.query.resource_ids || '1,2,3,4')
      .split(',')
      .map(x => Number(x.trim()))
      .filter(Boolean);


    const monday = getMonday();
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 7);

  
    const busySQL = `
      SELECT resource_id, start_at, end_at
      FROM bookings
      WHERE resource_id = ANY($1::int[])
        AND start_at < $2::timestamptz
        AND end_at   > $3::timestamptz
    `;
    const { rows } = await db.query(busySQL, [resourceIds, weekEnd.toISOString(), monday.toISOString()]);

   
    const busyByResource = {};
    for (const rid of resourceIds) busyByResource[rid] = [];
    for (const r of rows) busyByResource[r.resource_id].push({
      start: new Date(r.start_at),
      end: new Date(r.end_at),
    });

  
    res.json({
      weekStart: monday.toISOString().slice(0,10),
      startHour: 9,
      endHour: 15,
      stepMin: 30,
      resourceIds,
      busyByResource
    });
  } catch (e) {
    console.error('[api/calendar] ERROR', e);
    res.status(500).json({ error: 'server' });
  }
});

module.exports = router;
