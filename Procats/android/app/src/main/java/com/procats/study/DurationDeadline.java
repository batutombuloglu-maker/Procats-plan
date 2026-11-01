package com.procats.study;

/** A boot-scoped elapsed deadline survives process death and includes deep sleep. */
final class DurationDeadline {
 private DurationDeadline() {}
 static long remaining(long elapsedEnd,String savedBoot,long wallEnd,String currentBoot,long elapsedNow,long wallNow) {
  if(elapsedEnd>0&&currentBoot!=null&&!currentBoot.isEmpty()&&currentBoot.equals(savedBoot))return elapsedEnd-elapsedNow;
  // Monotonic counters reset at reboot. Persisted wall time is the only portable
  // fallback for a new boot / legacy installation; never reuse the old uptime.
  return wallEnd-wallNow;
 }
}
