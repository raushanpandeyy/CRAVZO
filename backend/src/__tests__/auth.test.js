import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../app.js";

const BASE_URL = "/api/v1/auth";

describe("Auth API", () => {
  it("should reject login without credentials", async () => {
    const { default: supertest } = await import("supertest");
    const res = await supertest(app)
      .post(`${BASE_URL}/login`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject invalid email format", async () => {
    const { default: supertest } = await import("supertest");
    const res = await supertest(app)
      .post(`${BASE_URL}/login`)
      .send({ email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
  });

  it("should reject login with wrong credentials", async () => {
    const { default: supertest } = await import("supertest");
    const res = await supertest(app)
      .post(`${BASE_URL}/login`)
      .send({ email: "nonexistent@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
