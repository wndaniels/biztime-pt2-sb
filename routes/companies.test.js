/** Tests for companies. */

const request = require("supertest");

const app = require("../app");
const { createData } = require("../_test-create-data.js");
const db = require("../db");

// before each test, clean out data
beforeEach(createData);

afterAll(async () => {
  await db.end();
});

describe("GET /", function () {
  test("It should respond with array of companies", async function () {
    const response = await request(app).get("/companies");
    expect(response.body).toEqual({
      companies: [
        { code: "apple", name: "Apple" },
        { code: "ibm", name: "IBM" },
      ],
    });
  });
});

describe("GET /apple", function () {
  test("It return company info", async function () {
    const response = await request(app).get("/companies/apple");
    expect(response.body).toEqual({
      company: {
        code: "apple",
        name: "Apple",
        description: "Maker of OSX.",
        invoices: [1, 2],
      },
    });
  });

  test("It should return 404 for no-such-company", async function () {
    const response = await request(app).get("/companies/facebook");
    expect(response.status).toEqual(404);
  });
});

describe("POST /", function () {
  test("It should add company", async function () {
    const response = await request(app)
      .post("/companies")
      .send({ name: "Canoo", description: "Coolest EV company" });

    expect(response.body).toEqual({
      company: {
        code: "canoo",
        name: "Canoo",
        description: "Coolest EV company",
      },
    });
  });

  test("It should return 500 for conflict", async function () {
    const response = await request(app)
      .post("/companies")
      .send({ name: "Apple", description: "Yeah, I already exist" });

    expect(response.status).toEqual(500);
  });
});

describe("PUT /", function () {
  test("It should update company", async function () {
    const response = await request(app)
      .put("/companies/apple")
      .send({ name: "Apple", description: "This company is worth so much!" });

    expect(response.body).toEqual({
      company: {
        code: "apple",
        name: "Apple",
        description: "This company is worth so much!",
      },
    });
  });

  test("It should return 404 for no-such-comp", async function () {
    const response = await request(app)
      .put("/companies/facebook")
      .send({ name: "Facebook" });

    expect(response.status).toEqual(404);
  });

  test("It should return 500 for missing data", async function () {
    const response = await request(app).put("/companies/apple").send({});

    expect(response.status).toEqual(500);
  });
});

describe("DELETE /", function () {
  test("It should delete company", async function () {
    const response = await request(app).delete("/companies/apple");

    expect(response.body).toEqual({ status: "deleted" });
  });

  test("It should return 404 for no-such-comp", async function () {
    const response = await request(app).delete("/companies/facebook");

    expect(response.status).toEqual(404);
  });
});
