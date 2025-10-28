import { InteractionManager } from 'react-native';

/**
 * Block focus capabilities registered by SafeBlockRenderer
 */
export interface BlockFocusEntry {
  /** Focus the block (usually calls TextInput.focus()) */
  focus: () => void;
  /** Measure block height (optional, for getItemLayout optimization) */
  getHeight?: () => number;
}

/**
 * Desired focus target with reveal options
 */
interface DesiredFocus {
  blockId: string;
  reveal: boolean; // Whether to scroll to make it visible
  animated?: boolean;
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
  private interactionHandle: InteractionManager.Handle | null = null;

  /**
   * Register a block's focus capabilities
   * Called by SafeBlockRenderer when a block mounts
   */
  registerBlock(blockId: string, entry: BlockFocusEntry): void {
    this.blockRegistry.set(blockId, entry);
  }

  /**
   * Unregister a block when it unmounts
   */
  unregisterBlock(blockId: string): void {
    this.blockRegistry.delete(blockId);
  }

  /**
   * Request focus on a block
   *
   * @param blockId - ID of block to focus
   * @param options - Focus options
   * @param options.reveal - Whether to scroll to make block visible (default: true)
   * @param options.animated - Whether to animate scroll (default: true)
   */
  requestFocus(blockId: string, options: { reveal?: boolean; animated?: boolean } = {}): void {
    this.desiredFocus = {
      blockId,
      reveal: options.reveal ?? true,
      animated: options.animated ?? true,
    };
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

    // Cancel any pending focus operations
    if (this.interactionHandle) {
      InteractionManager.clearInteractionHandle(this.interactionHandle);
      this.interactionHandle = null;
    }
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
      this.clearDesiredFocus();
      return;
    }

    // Use InteractionManager to ensure scroll animations complete
    this.interactionHandle = InteractionManager.runAfterInteractions(() => {
      this.interactionHandle = null;

      // Double-check block is still desired target
      if (this.desiredFocus?.blockId === blockId) {
        try {
          entry.focus();
        } catch (error) {
          console.warn(`[FocusManager] Failed to focus block ${blockId}:`, error);
        } finally {
          this.clearDesiredFocus();
        }
      }
    });
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
   * Clean up all resources
   * Call on unmount
   */
  cleanup(): void {
    this.blockRegistry.clear();
    this.clearDesiredFocus();
  }
}
