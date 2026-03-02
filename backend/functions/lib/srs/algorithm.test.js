"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Unit tests for SRS algorithm pure functions.
 * Run: npx jest src/srs/algorithm.test.ts
 */
const algorithm_1 = require("./algorithm");
describe("SRS algorithm", () => {
    describe("nextBucket", () => {
        it("increments bucket on correct use, cap at 6", () => {
            expect((0, algorithm_1.nextBucket)(0, true)).toBe(1);
            expect((0, algorithm_1.nextBucket)(5, true)).toBe(6);
            expect((0, algorithm_1.nextBucket)(6, true)).toBe(6);
        });
        it("decrements bucket on missed opportunity, floor at 0", () => {
            expect((0, algorithm_1.nextBucket)(1, false)).toBe(0);
            expect((0, algorithm_1.nextBucket)(6, false)).toBe(5);
            expect((0, algorithm_1.nextBucket)(0, false)).toBe(0);
        });
        it("progresses through buckets correctly", () => {
            let b = 0;
            for (let i = 0; i < 6; i++) {
                b = (0, algorithm_1.nextBucket)(b, true);
            }
            expect(b).toBe(6);
        });
    });
    describe("calculateConfidence", () => {
        it("returns bucket/6 when reviewCount is 0", () => {
            expect((0, algorithm_1.calculateConfidence)(0, 0, 0)).toBe(0);
            expect((0, algorithm_1.calculateConfidence)(3, 0, 0)).toBe(0.5);
            expect((0, algorithm_1.calculateConfidence)(6, 0, 0)).toBe(1);
        });
        it("combines bucket and accuracy", () => {
            expect((0, algorithm_1.calculateConfidence)(6, 10, 10)).toBe(1);
            expect((0, algorithm_1.calculateConfidence)(6, 5, 10)).toBe(0.5);
            expect((0, algorithm_1.calculateConfidence)(3, 3, 3)).toBe(0.5);
        });
        it("caps at 1", () => {
            expect((0, algorithm_1.calculateConfidence)(6, 15, 10)).toBeLessThanOrEqual(1);
        });
    });
    describe("srsStateId", () => {
        it("produces consistent IDs", () => {
            const id = (0, algorithm_1.srsStateId)("user1", "list1", "vocabulary");
            expect(id).toBe("user1_list1_vocabulary");
        });
        it("lowercases word", () => {
            const id = (0, algorithm_1.srsStateId)("u", "l", "Vocabulary");
            expect(id).toBe("u_l_vocabulary");
        });
        it("sanitizes slashes in word", () => {
            const id = (0, algorithm_1.srsStateId)("u", "l", "and/or");
            expect(id).not.toContain("/");
            expect(id).toContain("and_or");
        });
    });
});
//# sourceMappingURL=algorithm.test.js.map