import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("Image upload API", () => {
  it("allows large JSON bodies on the versioned upload route before auth runs", async () => {
    const { default: supertest } = await import("supertest");
    const largeDataUrl = `data:image/jpeg;base64,${"a".repeat(150 * 1024)}`;

    const res = await supertest(app)
      .post("/api/v1/users/uploads/image")
      .send({ dataUrl: largeDataUrl, folder: "dodago/restaurants" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Authentication required");
  });
});

