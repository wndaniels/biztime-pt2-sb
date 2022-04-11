const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

// GET ALL INVOICES
router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, comp_code 
        FROM invoices 
        ORDER BY id`
    );
    return res.json({ invoices: result.rows });
  } catch (err) {
    return next(err);
  }
});

// GET INVOICE BY ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT 
        i.id, 
        i.comp_code, 
        i.amt, i.paid, 
        i.add_date, 
        i.paid_date, 
        c.name, 
        c.description 
        FROM invoices AS i 
        INNER JOIN companies AS c ON (i.comp_code = c.code)
        WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find the invoice: ${id}`, 404);
    }
    const data = result.rows[0];
    const invoice = {
      id: data.id,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
    };
    return res.json({ invoice: invoice });
  } catch (err) {
    return next(err);
  }
});

// CREATE NEW INVOICE
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) 
        VALUES ($1, $2) 
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// UPDATE INVOICE BY ID
// ALL USER TO PAY INVOICE
router.put("/:id", async (req, res, next) => {
  try {
    let { id } = req.params;
    let { amt, paid } = req.body;
    let paidDate = null;

    const currResult = await db.query(
      `SELECT paid
        FROM invoices
        WHERE id = $1`,
      [id]
    );

    if (currResult.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }

    const paidDateResult = currResult.rows[0].paid_date;

    if (!paidDateResult && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = paidDateResult;
    }

    const updateResult = await db.query(
      `UPDATE invoices 
        SET amt = $2, paid = $3, paid_date = $4 
        WHERE id = $1
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [id, amt, paid, paidDate]
    );
    if (updateResult.rows.length === 0) {
      throw new ExpressError(`Cannot find the invoice: ${id}`, 404);
    }

    return res.json({ invoice: updateResult.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// DELETE INVOICE BY ID
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM invoices 
        WHERE id = $1 
        RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find the invoice: ${id}`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
