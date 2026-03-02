/**
 * Unit tests for SRS algorithm pure functions.
 * Run: npx jest src/srs/algorithm.test.ts
 */
import {
  calculateConfidence,
  nextBucket,
  srsStateId,
} from "./algorithm";

describe("SRS algorithm", () => {
  describe("nextBucket", () => {
    it("increments bucket on correct use, cap at 6", () => {
      expect(nextBucket(0, true)).toBe(1);
      expect(nextBucket(5, true)).toBe(6);
      expect(nextBucket(6, true)).toBe(6);
    });

    it("decrements bucket on missed opportunity, floor at 0", () => {
      expect(nextBucket(1, false)).toBe(0);
      expect(nextBucket(6, false)).toBe(5);
      expect(nextBucket(0, false)).toBe(0);
    });

    it("progresses through buckets correctly", () => {
      let b = 0;
      for (let i = 0; i < 6; i++) {
        b = nextBucket(b, true);
      }
      expect(b).toBe(6);
    });
  });

  describe("calculateConfidence", () => {
    it("returns bucket/6 when reviewCount is 0", () => {
      expect(calculateConfidence(0, 0, 0)).toBe(0);
      expect(calculateConfidence(3, 0, 0)).toBe(0.5);
      expect(calculateConfidence(6, 0, 0)).toBe(1);
    });

    it("combines bucket and accuracy", () => {
      expect(calculateConfidence(6, 10, 10)).toBe(1);
      expect(calculateConfidence(6, 5, 10)).toBe(0.5);
      expect(calculateConfidence(3, 3, 3)).toBe(0.5);
    });

    it("caps at 1", () => {
      expect(calculateConfidence(6, 15, 10)).toBeLessThanOrEqual(1);
    });
  });

  describe("srsStateId", () => {
    it("produces consistent IDs", () => {
      const id = srsStateId("user1", "list1", "vocabulary");
      expect(id).toBe("user1_list1_vocabulary");
    });

    it("lowercases word", () => {
      const id = srsStateId("u", "l", "Vocabulary");
      expect(id).toBe("u_l_vocabulary");
    });

    it("sanitizes slashes in word", () => {
      const id = srsStateId("u", "l", "and/or");
      expect(id).not.toContain("/");
      expect(id).toContain("and_or");
    });
  });
});
