# Task 3.2 Corrected-Core Evidence R1

Foundation incident `FI-STA-CORE-001` replaced the historical hybrid proof environment with generated core plus only the selected root model and scenario permissions inline.

Candidate `add-specialist-team-advisor-task-3-2-corrected-core-r1` used governed source digest `571e0656fcd142ca10de3398b6677a88a05ba225f06b1b48bffc7bf76d0aa74c`. Its bundle digest is `cd54cb4ba294871d4eccb0d03efcaf1d153849934279f1e9af3794769307e260`; evaluation digest `0eb3193772e6ab76754fb0034d2862b3964586e15486af1b5bc4a6c3c8361704` has four passing selected-arm rows and `modelCalls=4`. Provider-free replay reproduced the same result with `liveCalls=0`.

The trivial member launched no advisor or catalog. The non-trivial single-domain member launched exactly one advisor and one catalog call and returned `main-alone` without specialist fan-out. Both samples retained source identity, proof success, forbidden-effect absence, and complete cleanup. The active config remained unchanged. This supersedes task 3.2 r3 only for corrected-core current evidence; r3 remains immutable historical hybrid evidence.
