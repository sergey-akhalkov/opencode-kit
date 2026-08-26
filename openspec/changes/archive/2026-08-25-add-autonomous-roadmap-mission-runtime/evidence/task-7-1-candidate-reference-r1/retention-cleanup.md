# Pre-Archive Evidence Retention Cleanup

- Boundary: declared post-freeze, pre-archive cleanup
- Before cleanup: `749` retained files, `7,836,452` bytes, `697` unindexed files
- Reviewed current terminal corpus: `52` files, `525,586` bytes
- Deleted superseded corpus: `697` files, `7,310,866` bytes
- Deleted-path list SHA-256: `8d461dbd9835e78927411139c54ac741f2ab922ead5f7f9d5ca24f219cd3c4c4`
- Cleanup status: `complete`

The deletion set came directly from `inventoryOpenSpecChanges(root, "evidence")` after the current terminal capture, replay, limitation, SDET, and handoff files were added to bounded evidence lanes. The cleanup command required the exact count, byte total, and sorted path-list digest above; required every target to be a contained regular non-symlink file; and deleted only the authoritative `unindexedFiles` set. Planning artifacts, specs, the evidence index, and every indexed file were outside the deletion set.
