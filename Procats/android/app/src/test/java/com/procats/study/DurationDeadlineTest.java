package com.procats.study;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class DurationDeadlineTest {
 @Test public void clockAdjustmentsDoNotChangeSameBootDuration() {
  assertEquals(59000,DurationDeadline.remaining(160000,"10",1800060000,"10",101000,1803600000));
  assertEquals(59000,DurationDeadline.remaining(160000,"10",1800060000,"10",101000,1796400000));
 }
 @Test public void processRestartUsesPersistedElapsedDeadline() {
  assertEquals(30000,DurationDeadline.remaining(160000,"10",1800060000,"10",130000,0));
 }
 @Test public void rebootOrLegacyUsesPortableWallDeadline() {
  assertEquals(25000,DurationDeadline.remaining(160000,"10",1800060000,"11",5000,1800035000));
  assertEquals(25000,DurationDeadline.remaining(0,"",1800060000,"11",5000,1800035000));
 }
 @Test public void overdueStateRemainsNegativeForReceiverGraceWindow() {
  assertEquals(-10000,DurationDeadline.remaining(160000,"10",1800060000,"10",170000,0));
 }
}
