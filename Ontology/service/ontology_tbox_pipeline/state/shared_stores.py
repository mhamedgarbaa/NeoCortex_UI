"""Thread/coroutine-safe append-only store used by parallel ReAct workers.

Workers only ever append; they never overwrite or delete. A single
``asyncio.Lock`` per store serializes appends across coroutines that share
the same instance.
"""

from __future__ import annotations

import asyncio
from typing import Generic, List, TypeVar

T = TypeVar("T")


class AsyncAppendOnlyStore(Generic[T]):
    """An async-safe list that supports only ``append`` and ``snapshot``."""

    def __init__(self) -> None:
        self._items: List[T] = []
        self._lock = asyncio.Lock()

    async def append(self, item: T) -> None:
        """Atomically append a single item."""
        async with self._lock:
            self._items.append(item)

    async def extend(self, items: List[T]) -> None:
        """Atomically append a batch of items."""
        async with self._lock:
            self._items.extend(items)

    async def snapshot(self, max_items: int | None = None) -> List[T]:
        """Return a defensive copy of the current items, optionally truncated.

        When ``max_items`` is set and exceeded, the most recent items are kept
        — this preserves freshly extracted entries that the next worker is most
        likely to need to reconcile against.
        """
        async with self._lock:
            if max_items is None or len(self._items) <= max_items:
                return list(self._items)
            return list(self._items[-max_items:])

    def snapshot_sync(self, max_items: int | None = None) -> List[T]:
        """Synchronous snapshot — safe only when no writers are running."""
        if max_items is None or len(self._items) <= max_items:
            return list(self._items)
        return list(self._items[-max_items:])

    def __len__(self) -> int:
        return len(self._items)
