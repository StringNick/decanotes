import { InteractionManager } from 'react-native';

declare global {
  // Track layout offsets that influence focus reveal behaviour
  var __DECANOTES_KEYBOARD_HEIGHT__: number | undefined;
  var __DECANOTES_BOTTOM_BAR_HEIGHT__: number | undefined;
  var __DECANOTES_SAFE_AREA_BOTTOM__: number | undefined;
}

/**
 * Block focus capabilities registered by SafeBlockRenderer
 */
export interface BlockFocusEntry {
  /** Focus the block (usually calls TextInput.focus()) */
  focus: () => void;
  /** Measure block height (optional, for getItemLayout optimization) */
  getHeight?: () => number;
  /** Measure block position on screen */
  measure?: () => Promise<{ x: number; y: number; width: number; height: number }>;
}

/**
 * Desired focus target with reveal options
 */
interface DesiredFocus {
  blockId: string;
  reveal: boolean; // Whether to scroll to make it visible
  animated?: boolean;
  onRevealFailure?: (details: { blockId: string; extraOffset: number }) => void;
}

/**
 * FocusManager manages block focus and scroll-to-reveal for editor blocks
 *
 * Responsibilities:
 * - Track which block should be focused
 * - Coordinate FlatList scroll with block focus
 * - Provide single API for "focus this block" from anywhere
 *
 * Usage:
 * 1. Register blocks via registerBlock() from SafeBlockRenderer
 * 2. Call requestFocus() when you want to focus a block
 * 3. After scroll completes, call applyPendingFocus() to actually focus
 */
export class FocusManager {
  private blockRegistry = new Map<string, BlockFocusEntry>();
  private desiredFocus: DesiredFocus | null = null;
  private focusSequence = 0;
  private awaitingRegistration = false;
  private awaitingReveal = false;
  private lastMeasuredLayouts = new Map<string, string>();

  private maybeApplyFocus(): void {
    if (!this.desiredFocus) {
      return;
    }

    if (this.awaitingRegistration || this.awaitingReveal) {
      return;
    }

    this.applyPendingFocus();
  }

  /**
   * Register a block's focus capabilities
   * Called by SafeBlockRenderer when a block mounts
   */
  registerBlock(blockId: string, entry: BlockFocusEntry): void {
    if (__DEV__) {
      console.log('[FocusManager] registerBlock', { blockId });
    }
    this.blockRegistry.set(blockId, entry);

    if (this.desiredFocus?.blockId === blockId) {
      this.awaitingRegistration = false;
      this.maybeApplyFocus();
    }
  }

  /**
   * Unregister a block when it unmounts
   */
  unregisterBlock(blockId: string): void {
    this.blockRegistry.delete(blockId);
    this.lastMeasuredLayouts.delete(blockId);
  }

  /**
   * Request focus on a block
   *
   * @param blockId - ID of block to focus
   * @param options - Focus options
   * @param options.reveal - Whether to scroll to make block visible (default: true)
   * @param options.animated - Whether to animate scroll (default: true)
   */
  requestFocus(blockId: string, options: { reveal?: boolean; animated?: boolean; onRevealFailure?: DesiredFocus['onRevealFailure'] } = {}): void {
    if (__DEV__) {
      console.log('[FocusManager] requestFocus', { blockId, options });
    }
    const reveal = options.reveal ?? true;
    const animated = options.animated ?? true;

    this.desiredFocus = {
      blockId,
      reveal,
      animated,
      onRevealFailure: options.onRevealFailure,
    };

    this.awaitingRegistration = !this.blockRegistry.has(blockId);
    this.awaitingReveal = reveal;

    if (!this.awaitingRegistration && !this.awaitingReveal) {
      this.maybeApplyFocus();
    }
  }

  /**
   * Get the current desired focus target
   * Used by EditorCore to determine if/where to scroll
   */
  getDesiredFocus(): DesiredFocus | null {
    return this.desiredFocus;
  }

  /**
   * Clear desired focus (usually after scroll completes)
   */
  clearDesiredFocus(): void {
    this.desiredFocus = null;
    this.awaitingRegistration = false;
    this.awaitingReveal = false;
  }

  /**
   * Apply pending focus after scroll completes
   * Call this after FlatList.scrollToIndex or scrollToOffset finishes
   */
  applyPendingFocus(): void {
    if (!this.desiredFocus) {
      return;
    }

    const { blockId } = this.desiredFocus;
    const entry = this.blockRegistry.get(blockId);

    if (!entry) {
      console.warn(`[FocusManager] Cannot focus block ${blockId}: not registered`);
      this.awaitingRegistration = true;
      return;
    }

    // Use InteractionManager to ensure scroll animations complete
    const sequenceId = ++this.focusSequence;
    let applied = false;
    const visibilityCheckDone = { done: false }; // Use object to share state across async calls

    const applyFocus = async () => {
      if (applied) {
        return;
      }

      if (!this.desiredFocus || this.desiredFocus.blockId !== blockId || sequenceId !== this.focusSequence) {
        return;
      }

      const currentFocus = this.desiredFocus;
      if (!currentFocus) {
        return;
      }

      applied = true;

      try {
        entry.focus();
        if (__DEV__) {
          console.log('[FocusManager] focus applied', { blockId });
        }
      } catch (error) {
        console.warn(`[FocusManager] Failed to focus block ${blockId}:`, error);
        return;
      }

      this.clearDesiredFocus();
    };

    InteractionManager.runAfterInteractions(() => {
      if (!this.desiredFocus || this.desiredFocus.blockId !== blockId || sequenceId !== this.focusSequence) {
        return;
      }

      applyFocus();
    });

    setTimeout(() => {
      if (applied) {
        return;
      }
      if (!this.desiredFocus || this.desiredFocus.blockId !== blockId || sequenceId !== this.focusSequence) {
        return;
      }

      applyFocus();
    }, 250);
  }

  /**
   * Notify the focus manager that reveal/scrolling has completed
   */
  notifyRevealComplete(blockId: string): void {
    if (!this.desiredFocus || this.desiredFocus.blockId !== blockId) {
      return;
    }

    this.awaitingReveal = false;
    this.maybeApplyFocus();
  }

  /**
   * Get block height if available (for getItemLayout optimization)
   */
  getBlockHeight(blockId: string): number | undefined {
    const entry = this.blockRegistry.get(blockId);
    return entry?.getHeight?.();
  }

  /**
   * Check if a block is registered
   */
  isBlockRegistered(blockId: string): boolean {
    return this.blockRegistry.has(blockId);
  }

  /**
   * Get count of registered blocks (for debugging)
   */
  getRegisteredCount(): number {
    return this.blockRegistry.size;
  }

  /**
   * Measure a block's position on screen
   * Returns null if block not registered or measurement fails
   */
  async measureBlock(blockId: string): Promise<{ x: number; y: number; width: number; height: number } | null> {
    const entry = this.blockRegistry.get(blockId);
    if (!entry?.measure) {
      return null;
    }

    try {
      return await entry.measure();
    } catch (error) {
      if (__DEV__) {
        console.warn(`[FocusManager] Failed to measure block ${blockId}:`, error);
      }
      return null;
    }
  }

  /**
   * Clean up all resources
   * Call on unmount
   */
  cleanup(): void {
    this.blockRegistry.clear();
    this.clearDesiredFocus();
  }
}
