// src/utils/audio.js
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

/**
 * Empty stub for compatibility. 
 */
export const initAudio = async () => {
    return;
};

/**
 * Universal Haptic Trigger
 * Updated for Android 16 (Baklava) compatibility
 */
export const triggerHaptic = async (style = ImpactStyle.Light) => {
    if (!isNative) {
        // Web Fallback: Use navigator.vibrate if available
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            const ms = style === ImpactStyle.Heavy ? 30 : style === ImpactStyle.Medium ? 20 : 10;
            navigator.vibrate(ms);
        }
        console.log(`[Web Test] Haptic Triggered: ${style}`);
        return;
    }

    try {
        // Android 16 Logic: If impact fails or feels "muffled," 
        // selectionChanged is often prioritized by the Baklava task scheduler.
        if (platform === 'android' && style === ImpactStyle.Light) {
            await Haptics.selectionChanged();
        } else {
            await Haptics.impact({ style });
        }
    } catch (e) {
        // Failover: Direct vibration is the most reliable method on SDK 36 (Baklava)
        try {
            await Haptics.vibrate({ duration: 15 });
        } catch (vibeError) {
            console.error("Haptics completely unavailable:", vibeError);
        }
    }
};

/**
 * Replaces playClick to handle only tactile feedback
 */
export const playClick = async () => {
    // Standardized for consistent UI feedback across the app
    await triggerHaptic(ImpactStyle.Light);
};