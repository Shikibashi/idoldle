import { describe, it, expect } from "vitest";
import { scoreGuess } from "./wordle";
import type { LetterState } from "../types";

/** Helper: extract just the states as a compact string of emojis. */
function states(answer: string, guess: string): LetterState[] {
  return scoreGuess(answer, guess).map((f) => f.state);
}

describe("scoreGuess (6-letter)", () => {
  // ── Mandatory cases from spec ────────────────────────────────────────────

  it("JENNIE vs EERIES → present correct absent present absent absent", () => {
    expect(states("JENNIE", "EERIES")).toEqual([
      "present", "correct", "absent", "present", "absent", "absent",
    ]);
  });

  it("KARINA vs ARRIAN → present absent correct correct present present", () => {
    expect(states("KARINA", "ARRIAN")).toEqual([
      "present", "absent", "correct", "correct", "present", "present",
    ]);
  });

  it("AAAAAA vs AAAAAA → all correct", () => {
    expect(states("AAAAAA", "AAAAAA")).toEqual([
      "correct", "correct", "correct", "correct", "correct", "correct",
    ]);
  });

  it("ABCDEF vs AAAAAA → first A correct, rest absent", () => {
    expect(states("ABCDEF", "AAAAAA")).toEqual([
      "correct", "absent", "absent", "absent", "absent", "absent",
    ]);
  });

  it("AABBCC vs ABCABC → mixed", () => {
    expect(states("AABBCC", "ABCABC")).toEqual([
      "correct", "present", "present", "present", "present", "correct",
    ]);
  });

  it("answer has double letter, guess has single matching letter in correct slot", () => {
    expect(states("KAREEN", "XXXXEX")).toEqual([
      "absent", "absent", "absent", "absent", "correct", "absent",
    ]);
  });

  it("answer has double letter, guess has single matching letter in wrong slot", () => {
    expect(states("KAREEN", "EXXXXX")).toEqual([
      "present", "absent", "absent", "absent", "absent", "absent",
    ]);
  });

  it("answer has double letter, guess has the letter in BOTH correct AND wrong slots", () => {
    expect(states("KAREEN", "EXXXEX")).toEqual([
      "present", "absent", "absent", "absent", "correct", "absent",
    ]);
  });

  it("answer has triple letter, guess has single matching letter", () => {
    expect(states("BBBCCC", "XXXXBX")).toEqual([
      "absent", "absent", "absent", "absent", "present", "absent",
    ]);
  });

  it("answer has triple letter, guess has double in correct positions", () => {
    expect(states("BBBCCC", "BXBXXX")).toEqual([
      "correct", "absent", "correct", "absent", "absent", "absent",
    ]);
  });

  it("fully disjoint (no letters match) → all absent", () => {
    expect(states("ABCDEF", "GHIJKL")).toEqual([
      "absent", "absent", "absent", "absent", "absent", "absent",
    ]);
  });

  it("KARINA vs KARINA → all correct", () => {
    expect(states("KARINA", "KARINA")).toEqual([
      "correct", "correct", "correct", "correct", "correct", "correct",
    ]);
  });

  it("WINTER vs WANTER → W/N/T/E/R correct, A absent, I absent", () => {
    expect(states("WINTER", "WANTER")).toEqual([
      "correct", "absent", "correct", "correct", "correct", "correct",
    ]);
  });

  it("single letter wrong: answer vs answer with one letter swapped", () => {
    expect(states("JENNIE", "JENNJE")).toEqual([
      "correct", "correct", "correct", "correct", "absent", "correct",
    ]);
  });

  it("guess is anagram of answer → all present or correct", () => {
    expect(states("FLAKES", "KAFLES")).toEqual([
      "present", "present", "present", "present", "correct", "correct",
    ]);
  });

  it("returns correct char values in feedback objects", () => {
    const result = scoreGuess("ABCDEF", "ABCXYZ");
    expect(result[0]).toEqual({ char: "A", state: "correct" });
    expect(result[1]).toEqual({ char: "B", state: "correct" });
    expect(result[2]).toEqual({ char: "C", state: "correct" });
    expect(result[3]).toEqual({ char: "X", state: "absent" });
    expect(result[4]).toEqual({ char: "Y", state: "absent" });
    expect(result[5]).toEqual({ char: "Z", state: "absent" });
  });

  it("throws on mismatched length", () => {
    expect(() => scoreGuess("ABCDE", "ABCDEF")).toThrow();
    expect(() => scoreGuess("ABCDEF", "ABC")).toThrow();
  });

  it("throws on too-short length (below 4)", () => {
    expect(() => scoreGuess("ABC", "ABC")).toThrow();
  });

  it("throws on too-long length (above 10)", () => {
    expect(() => scoreGuess("ABCDEFGHIJK", "ABCDEFGHIJK")).toThrow();
  });

  it("throws on non-uppercase input", () => {
    expect(() => scoreGuess("abcdef", "ABCDEF")).toThrow();
    expect(() => scoreGuess("ABCDEF", "abcdef")).toThrow();
  });

  // ── Extra edge case: present count never exceeds answer frequency ────────

  it("guess repeats a letter more times than it appears in answer — excess are absent", () => {
    expect(states("SINGLE", "SSSSSS")).toEqual([
      "correct", "absent", "absent", "absent", "absent", "absent",
    ]);
  });
});

describe("scoreGuess (5-letter)", () => {
  // JENNY (J,E,N,N,Y) vs EERIE (E,E,R,I,E)
  // Counts: J=1,E=1,N=2,Y=1
  // Pass1: pos1 E==E ✓(E→0). Rest no match.
  // Pass2: pos0 E→count0→absent. pos2 R→absent. pos3 I→absent. pos4 E→count0→absent.
  it("JENNY vs EERIE → absent correct absent absent absent", () => {
    expect(states("JENNY", "EERIE")).toEqual([
      "absent", "correct", "absent", "absent", "absent",
    ]);
  });

  // SOLAR (S,O,L,A,R) vs CLEAR (C,L,E,A,R)
  // Counts: S=1,O=1,L=1,A=1,R=1
  // Pass1: pos3 A==A ✓(A→0), pos4 R==R ✓(R→0).
  // Pass2: pos0 C→absent. pos1 L→count1>0→present(L→0). pos2 E→absent.
  it("SOLAR vs CLEAR → absent present absent correct correct", () => {
    expect(states("SOLAR", "CLEAR")).toEqual([
      "absent", "present", "absent", "correct", "correct",
    ]);
  });

  // MINJI (M,I,N,J,I) vs JIMIN (J,I,M,I,N)
  // Counts: M=1,I=2,N=1,J=1
  // Pass1: pos1 I==I ✓(I→1). Rest no match.
  // Pass2: pos0 J→count1>0→present(J→0). pos2 M→count1>0→present(M→0).
  //        pos3 I→count1>0→present(I→0). pos4 N→count1>0→present(N→0).
  it("MINJI vs JIMIN → present correct present present present", () => {
    expect(states("MINJI", "JIMIN")).toEqual([
      "present", "correct", "present", "present", "present",
    ]);
  });

  it("KARIN vs KARIN → all correct", () => {
    expect(states("KARIN", "KARIN")).toEqual([
      "correct", "correct", "correct", "correct", "correct",
    ]);
  });

  // HELLO (H,E,L,L,O) vs WORLD (W,O,R,L,D)
  // Counts: H=1,E=1,L=2,O=1
  // Pass1: pos3 L==L ✓(L→1). Rest no match.
  // Pass2: pos0 W→absent. pos1 O→count1>0→present(O→0). pos2 R→absent. pos4 D→absent.
  it("HELLO vs WORLD → absent present absent correct absent", () => {
    expect(states("HELLO", "WORLD")).toEqual([
      "absent", "present", "absent", "correct", "absent",
    ]);
  });

  // APPLE (A,P,P,L,E) vs AAPLE (A,A,P,L,E)
  // Counts: A=1,P=2,L=1,E=1
  // Pass1: pos0 A==A ✓(A→0). pos2 P==P ✓(P→1). pos3 L==L ✓(L→0). pos4 E==E ✓(E→0).
  // Pass2: pos1 A→count0→absent.
  it("APPLE vs AAPLE → correct absent correct correct correct", () => {
    expect(states("APPLE", "AAPLE")).toEqual([
      "correct", "absent", "correct", "correct", "correct",
    ]);
  });

  // BANAL (B,A,N,A,L) vs BANJO (B,A,N,J,O)
  // Counts: B=1,A=2,N=1,L=1
  // Pass1: pos0 B==B ✓(B→0). pos1 A==A ✓(A→1). pos2 N==N ✓(N→0).
  // Pass2: pos3 J→absent. pos4 O→absent.
  it("BANAL vs BANJO → correct correct correct absent absent", () => {
    expect(states("BANAL", "BANJO")).toEqual([
      "correct", "correct", "correct", "absent", "absent",
    ]);
  });

  // MAMMA (M,A,M,M,A) vs MXAMM (M,X,A,M,M)
  // Counts: M=3,A=2
  // Pass1: pos0 M==M ✓(M→2). pos3 M==M ✓(M→1).
  // Pass2: pos1 X→absent. pos2 A→count2>0→present(A→1). pos4 M→count1>0→present(M→0).
  it("MAMMA vs MXAMM → duplicates handled correctly", () => {
    expect(states("MAMMA", "MXAMM")).toEqual([
      "correct", "absent", "present", "correct", "present",
    ]);
  });

  // ABCDE vs FGHIJ → fully disjoint, all absent
  it("ABCDE vs FGHIJ → all absent (disjoint)", () => {
    expect(states("ABCDE", "FGHIJ")).toEqual([
      "absent", "absent", "absent", "absent", "absent",
    ]);
  });

  // Anagram: THREE (T,H,R,E,E) vs ETHER (E,T,H,E,R)
  // Counts: T=1,H=1,R=1,E=2
  // Pass1: pos3 E==E ✓(E→1). Rest no match.
  // Pass2: pos0 E→count1>0→present(E→0). pos1 T→count1>0→present(T→0).
  //        pos2 H→count1>0→present(H→0). pos4 R→count1>0→present(R→0).
  it("THREE vs ETHER → all present except pos3 correct", () => {
    expect(states("THREE", "ETHER")).toEqual([
      "present", "present", "present", "correct", "present",
    ]);
  });

  it("5-letter feedback returns correct chars", () => {
    const result = scoreGuess("SOLAR", "CLEAR");
    expect(result).toHaveLength(5);
    expect(result[0].char).toBe("C");
    expect(result[4].char).toBe("R");
  });
});
