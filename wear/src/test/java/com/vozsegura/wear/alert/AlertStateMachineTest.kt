package com.vozsegura.wear.alert

import com.vozsegura.wear.haptics.HapticSignal
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AlertStateMachineTest {

    private fun reduce(phase: AlertPhase, event: AlertEvent) = AlertStateMachine.reduce(phase, event)

    @Test
    fun `double tap arms with a single tick, starts the session and the grace window`() {
        val t = reduce(AlertPhase.Idle, AlertEvent.DoubleTap)
        assertEquals(AlertPhase.Arming, t.phase)
        assertEquals(
            listOf(
                AlertEffect.Vibrate(HapticSignal.DETECTED),
                AlertEffect.StartSession,
                AlertEffect.StartGraceTimer,
            ),
            t.effects,
        )
    }

    @Test
    fun `cancelling during the grace window sends nothing to contacts`() {
        val t = reduce(AlertPhase.Arming, AlertEvent.LongPress)
        assertEquals(AlertPhase.Cancelled, t.phase)
        assertFalse(AlertEffect.SendCancellation in t.effects)
        assertTrue(AlertEffect.Vibrate(HapticSignal.CANCELLED) in t.effects)
    }

    @Test
    fun `grace window elapsing starts delivery`() {
        val t = reduce(AlertPhase.Arming, AlertEvent.GraceElapsed)
        assertEquals(AlertPhase.Delivering, t.phase)
        assertEquals(listOf(AlertEffect.StartDelivery), t.effects)
    }

    @Test
    fun `successful delivery vibrates twice`() {
        val t = reduce(AlertPhase.Delivering, AlertEvent.DeliverySucceeded)
        assertEquals(AlertPhase.Sent, t.phase)
        assertEquals(listOf(AlertEffect.Vibrate(HapticSignal.SENT)), t.effects)
    }

    @Test
    fun `only the first failure vibrates, later ones retry silently`() {
        val first = reduce(AlertPhase.Delivering, AlertEvent.DeliveryFailed)
        assertEquals(AlertPhase.Failed(attempts = 1), first.phase)
        assertTrue(AlertEffect.Vibrate(HapticSignal.ERROR) in first.effects)

        val second = reduce(first.phase, AlertEvent.DeliveryFailed)
        assertEquals(AlertPhase.Failed(attempts = 2), second.phase)
        assertEquals(listOf(AlertEffect.StartRetryTimer), second.effects)
    }

    @Test
    fun `a retry that succeeds ends in sent`() {
        val retry = reduce(AlertPhase.Failed(1), AlertEvent.RetryElapsed)
        assertEquals(listOf(AlertEffect.StartDelivery), retry.effects)
        assertEquals(AlertPhase.Sent, reduce(retry.phase, AlertEvent.DeliverySucceeded).phase)
    }

    @Test
    fun `cancelling after the grace window always notifies contacts`() {
        listOf(AlertPhase.Delivering, AlertPhase.Sent, AlertPhase.Failed(2)).forEach { phase ->
            val t = reduce(phase, AlertEvent.LongPress)
            assertEquals(AlertPhase.Cancelled, t.phase)
            assertTrue("from $phase", AlertEffect.SendCancellation in t.effects)
            assertTrue("from $phase", AlertEffect.StopAll in t.effects)
        }
    }

    @Test
    fun `double tap while an alert is running is ignored`() {
        listOf(AlertPhase.Arming, AlertPhase.Delivering, AlertPhase.Sent).forEach { phase ->
            val t = reduce(phase, AlertEvent.DoubleTap)
            assertEquals(phase, t.phase)
            assertTrue(t.effects.isEmpty())
        }
    }

    @Test
    fun `long press while idle does nothing`() {
        val t = reduce(AlertPhase.Idle, AlertEvent.LongPress)
        assertEquals(AlertPhase.Idle, t.phase)
        assertTrue(t.effects.isEmpty())
    }

    @Test
    fun `cancelled returns to idle after the cool-down and ignores taps meanwhile`() {
        assertEquals(AlertPhase.Cancelled, reduce(AlertPhase.Cancelled, AlertEvent.DoubleTap).phase)
        assertEquals(AlertPhase.Idle, reduce(AlertPhase.Cancelled, AlertEvent.ResetElapsed).phase)
    }
}
