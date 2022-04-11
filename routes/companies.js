const db = require("../db");
const slugify = require("slugify");
const express = require("express");
const ExpressError = require("../expressError");
let router = express.Router();

// GET ALL COMPANIES
router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT code, name 
        FROM companies 
        ORDER BY name`
    );
    return res.json({ companies: result.rows });
  } catch (err) {
    return next(err);
  }
});

// GET COMPANY BY ID
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const companyResult = await db.query(
      `SELECT code, name, description 
        FROM companies 
        WHERE code = $1`,
      [code]
    );

    const invoiceResult = await db.query(
      `SELECT id 
        FROM invoices 
        WHERE comp_code = $1`,
      [code]
    );

    if (companyResult.rows.length === 0) {
      throw new ExpressError(`Cannot find the company: ${code}`, 404);
    }

    const company = companyResult.rows[0];
    const invoices = invoiceResult.rows;

    company.invoices = invoices.map((inv) => inv.id);

    return res.json({ company: company });
  } catch (err) {
    return next(err);
  }
});

// CREATE NEW COMPANY
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true });
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3) 
        RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// UPDATE COMPANY BY ID
router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies 
        SET name = $2, description = $3 
        WHERE code = $1 
        RETURNING code, name, description`,
      [code, name, description]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find the company: ${code}`, 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// DELETE COMPANY BY ID
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query(
      `DELETE FROM companies 
        WHERE code = $1 
        RETURNING code`,
      [code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find the company: ${code}`, 404);
    }
    return res.send({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
