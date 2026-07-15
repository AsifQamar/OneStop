import test from "node:test";
import assert from "node:assert/strict";
import { buildRideComparison, calculateFare } from "./server.js";

test("calculateFare includes the base distance before per-km pricing", () => {
  assert.equal(calculateFare("Rapido", "Bike", 2), 35);
  assert.equal(calculateFare("Rapido", "Bike", 5), 59);
  assert.equal(calculateFare("Uber", "Go", 10), 179);
});

test("calculateFare rejects invalid distances", () => {
  assert.equal(calculateFare("Uber", "Go", 0), null);
  assert.equal(calculateFare("Uber", "Go", "unknown"), null);
});

test("smart comparison returns scored, sorted rides with reliability data", () => {
  const rides = buildRideComparison(10, 30, 12);
  assert.equal(rides.length, 8);
  assert.ok(rides.every((ride) => Number.isInteger(ride.matchScore)));
  assert.ok(rides.every((ride) => ride.reliability === 100 - ride.cancellationChance));
  assert.ok(rides.every((ride, index) => index === 0 || rides[index - 1].matchScore >= ride.matchScore));
});

test("peak travel increases cancellation risk", () => {
  const offPeak = buildRideComparison(8, 25, 12);
  const peak = buildRideComparison(8, 25, 18);
  assert.equal(peak[0].cancellationChance, offPeak.find((ride) => ride.id === peak[0].id).cancellationChance + 5);
});
