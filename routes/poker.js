const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

module.exports = (pool) => {
  // GET route to display the list of poker winnings
  
// GET route to display the list of poker winnings
router.get('/list', async (req, res) => {
    try {
        const query = 'SELECT * FROM poker_results ORDER BY date DESC';
        const result = await pool.query(query);
        const data = result.rows;

        if (data.length === 0) {
            res.render('list', {
                winPercentage: 0,
                averageWin: 0,
                biggestWin: 0,
                biggestLoss: 0,
                totalWinnings: 0,
                allTimeHigh: 0,
                sessions: 0,
                hourly : 0
        
                
            });
            return;
        }

        let totalProfit = 0;
        let totalHours = 0
        let winCount = 0;
        let totalHourlyProfit = 0;
        let hourSessions = 0
        let biggestWin = Number.MIN_SAFE_INTEGER;
        let biggestLoss = Number.MAX_SAFE_INTEGER;
        let allTimeHigh = Number.MIN_SAFE_INTEGER;

        data.forEach(row => {
            //Hourly += row.hours 
            const sessionProfit = row.cashout - row.buyin;
            totalProfit += sessionProfit;
            if (row.hours !== null) {
              totalHours += Number(row.hours);
              totalHourlyProfit += (row.cashout - row.buyin);

            }

            if (sessionProfit > 0) winCount++;
            if (sessionProfit > biggestWin) biggestWin = sessionProfit;
            if (sessionProfit < biggestLoss) biggestLoss = sessionProfit;
            if (row.running_profit > allTimeHigh) allTimeHigh = row.running_profit;
        });

        const winPercentage = (winCount / data.length) * 100;
        const averageWin = totalProfit / data.length;
        const totalWinnings = data[0].running_profit;
        const hourly = totalHourlyProfit / totalHours
        
        

        res.render('list', {
            winPercentage: winPercentage.toFixed(2),
            averageWin: averageWin.toFixed(2),
            biggestWin: biggestWin,
            biggestLoss: biggestLoss,
            totalWinnings: totalWinnings,
            allTimeHigh: allTimeHigh,
            sessions: data.length,
            data : data,
            hourly : (hourly).toFixed(1),
            totalHours : totalHours
            
            
        });
    } catch (err) {
        console.error(err);
        res.send('Error retrieving data');
    }
});

// POST route to add new records


  // POST route to add a new record
  router.post('/add', async (req, res) => {
    const { date, buyin, cashout, hours } = req.body;  // Added 'hours' to the destructured object

    // Calculate session profit
    const sessionProfit = cashout - buyin;

    try {
        // Get the last SessionID from the database
        const lastSessionIDQuery = 'SELECT SessionID FROM poker_results ORDER BY SessionID DESC LIMIT 1';
        const lastSessionIDResult = await pool.query(lastSessionIDQuery);

        let newSessionID = 1; // Default to 1 if no records exist
        if (lastSessionIDResult.rows.length > 0) {
            newSessionID = lastSessionIDResult.rows[0].sessionid + 1;
        }

        // Get the last running profit from the database
        const lastRunningProfitQuery = 'SELECT running_profit FROM poker_results WHERE Date < $1 ORDER BY Date DESC LIMIT 1';
        const lastRunningProfitResult = await pool.query(lastRunningProfitQuery, [date]);
        console.log(date)

        // Calculate new running profit
        let runningProfit = 0;
        if (lastRunningProfitResult.rows.length > 0) {
            runningProfit = lastRunningProfitResult.rows[0].running_profit + sessionProfit;
        } else {
            runningProfit = sessionProfit;
        }

        // Insert new record into the database, including 'hours'
        const insertQuery = `
            INSERT INTO poker_results (sessionid, date, buyin, cashout, session_profit, running_profit, hours)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const values = [newSessionID, date, buyin, cashout, sessionProfit, runningProfit, hours];
        await pool.query(insertQuery, values);

        // Redirect to the index page
        res.redirect('/');
    } catch (err) {
        console.error('Error adding record:', err);
        res.status(500).send('Error adding record');
    }
});


  router.get('/data', async (req, res) => {
    try {
        const query = `
            SELECT Date, Running_Profit
            FROM poker_results
            ORDER BY Date;
        `;
        const result = await pool.query(query);
        const data = result.rows;

        res.json(data); // Send JSON response with queried data
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Error fetching data' });
    }
});
  

  return router;
};




